import type * as j from 'jscodeshift'
import type { ExpressionKind } from 'ast-types/lib/gen/kinds'
import prettier from '@prettier/sync'

import { has } from './has.js'

function keyToSelector(key: string, j: j.JSCodeshift) {
  const parts = key.split('.')
  const expr = parts.reduce<j.Identifier | j.MemberExpression>((acc, part) =>
    /^\d+$/.test(part)
      ? j.memberExpression(acc, j.literal(Number(part)), true)
      : j.memberExpression(acc, j.identifier(part)),
    j.identifier('$')
  )
  return j.arrowFunctionExpression([j.identifier('$')], expr)
}

const splitNs = (key: string) => {
  const [maybeNs, ...rest] = key.split(':')
  return rest.length
    ? { ns: maybeNs, bare: rest.join(':') }
    : { ns: null, bare: maybeNs }
}


const isStringLiteralNode = (x: { type: unknown } | null): x is j.StringLiteral => x !== null && x.type === 'StringLiteral'

const clone = (node: unknown) => JSON.parse(JSON.stringify(node))

// const default

export function transform(file: j.FileInfo, api: j.API) {
  const j = api.jscodeshift
  const root = j(file.source)

  /* ──────────────────────────────────────────────────────────
   * 1️⃣  Collect local bindings that come from 'i18next'
   * ────────────────────────────────────────────────────────── */
  const i18nAliases = new Set() // e.g. i18next, i18n
  const tAliases = new Set()    // e.g. t, translate

  root
    .find(j.ImportDeclaration, { source: { value: 'i18next' } })
    .forEach(p => {
      (p.node.specifiers || []).forEach(s => {
        switch (s.type) {
          case 'ImportDefaultSpecifier':
          case 'ImportNamespaceSpecifier': {
            if (s.local == null) return
            else i18nAliases.add(s.local.name)
            break
          }
          case 'ImportSpecifier':
            if (s.imported.name === 't') tAliases.add(s.local ? s.local.name : 't')
            break
        }
      })
    })

  if (i18nAliases.size === 0 && tAliases.size === 0) return file.source // nothing to do

  /* ──────────────────────────────────────────────────────────
   * 2️⃣  Helpers
   * ────────────────────────────────────────────────────────── */
  const isOurT = (callee: ExpressionKind) =>
    (callee.type === 'Identifier' && tAliases.has(callee.name)) ||
    (
      callee.type === 'MemberExpression' &&
      !callee.computed &&
      callee.property.type === 'Identifier' &&
      callee.property.name === 't' &&
      callee.object.type === 'Identifier' &&
      i18nAliases.has(callee.object.name)
    )


  /* ──────────────────────────────────────────────────────────
   * 3️⃣  Transform calls
   * ────────────────────────────────────────────────────────── */
  root
    .find(j.CallExpression)
    .filter(p => isOurT(p.node.callee))
    .forEach(p => {
      const { node } = p
      const [arg0, arg1, arg2] = node.arguments

      /* ── 3a. Array‑of‑keys syntax ───────────────────────── */
      if (
        arg0 &&
        arg0.type === 'ArrayExpression' &&
        arg0.elements.length &&
        arg0.elements.every(isStringLiteralNode)
      ) {
        const keys = arg0.elements.map(el => el?.value)

        /* Gather default value + extra option props (if any) */
        let explicitDefault = null           // StringLiteral (2nd positional string arg)
        let optionObject = null              // first ObjectExpression arg, if any
        if (arg1 && arg1.type === 'StringLiteral') explicitDefault = arg1
        if (arg1 && arg1.type === 'ObjectExpression') optionObject = arg1
        if (!optionObject && arg2 && arg2.type === 'ObjectExpression') optionObject = arg2

        // context, val, etc. (but NOT defaultValue)
        let extraTopProps = Array.of<j.Property | j.ObjectProperty>()
        // defaultValue property inside the object
        let optionDefault = null
        if (optionObject) {
          optionObject.properties.forEach(prop => {
            if (has('key')(prop) && has('value')(prop)) {
              const { key, value } = prop
              if (has('name', (name) => typeof name === 'string')(key)) {
                const k = key.name || value
                if (k === 'defaultValue') {
                  optionDefault = prop.value
                } else {
                  extraTopProps.push(prop)
                }
              }
            }
          })
        }

        const finalDefault = optionDefault || explicitDefault // option wins over positional

        /* Recursively build nested t() chain */
        // const calleeClone = clone(node.callee)
        const calleeClone = clone(node.callee)

        const buildCall = (idx: number) => {
          const { ns, bare } = splitNs(keys[idx])

          const props = []

          // ns for THIS selector
          if (ns) props.push(j.property(
            'init',
            j.identifier('ns'),
            j.literal(ns)
          ))


          // defaultValue: nested call OR final default
          if (idx < keys.length - 1) {
            props.push(
              j.property(
                'init',
                j.identifier('defaultValue'),
                buildCall(idx + 1)
              )
            )
          } else if (finalDefault) {
            props.push(
              j.property(
                'init',
                j.identifier('defaultValue'),
                finalDefault
              )
            )
          }

          // top‑level extra props go only on the outermost selector
          if (idx === 0 && extraTopProps.length) {
            props.push(...extraTopProps)
          }

          const args: (j.ArrowFunctionExpression | j.ObjectExpression)[] = [keyToSelector(bare, j)]
          if (props.length) args.push(j.objectExpression(props))

          return j.callExpression(clone(calleeClone), args)
        }

        /* Replace the entire original call */
        const replacement = buildCall(0)
        j(p).replaceWith(replacement)
        return
      }

      /* ── 3b. Single string key (legacy path) ────────────── */
      if (!arg0 || arg0.type !== 'StringLiteral' || typeof arg0.value !== 'string') return

      const { ns, bare } = splitNs(arg0.value)
      const selectorFn = keyToSelector(bare, j)
      const newArgs: (j.ArrowFunctionExpression | j.ObjectExpression)[] = [selectorFn]
      const opts: { [x: string]: unknown } = {}

      // positional defaultValue (string)
      if (arg1 && arg1.type === 'StringLiteral') opts.defaultValue = arg1

      // object‑style options (2nd or 3rd arg)
      const optObj = [arg1, arg2].find(a => a && a.type === 'ObjectExpression')
      if (optObj) {
        optObj.properties.forEach(prop => {
          if (has('key')(prop) && has('value')(prop)) {
            const { key, value } = prop
            if (has('name', (name) => typeof name === 'string')(key)) {
              opts[key.name] = value
            } else if (has('value', (value) => typeof value === 'string')(key)) {
              opts[key.value] = value
            }
          }
        })
      }

      if (ns && !('ns' in opts)) opts.ns = j.literal(ns)
      if (Object.keys(opts).length) {
        newArgs.push(
          j.objectExpression(
            Object.entries(opts).map(([k, v]) =>
              j.property('init', j.identifier(k), v as never)
            )
          )
        )
      }

      node.arguments = newArgs
    })

  return prettier.format(root.toSource(), { parser: 'typescript', arrowParens: 'avoid', singleQuote: true })
};
