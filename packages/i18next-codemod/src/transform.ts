import type * as j from 'jscodeshift'
import type { ExpressionKind, TSTypeKind } from 'ast-types/lib/gen/kinds'
import prettier from '@prettier/sync'

import { has } from './has.js'

const PATTERN = {
  identifier: /^[A-Za-z_$][A-Za-z0-9_$]*$/,
  digit: /^\d+$/,
}

function keyToSelector(key: string, j: j.JSCodeshift) {
  const parts = key.split('.')
  const expr = parts.reduce<j.Identifier | j.MemberExpression>((acc, part) =>
    PATTERN.digit.test(part) ? j.memberExpression(acc, j.literal(Number(part)), true)
      : PATTERN.identifier.test(part) ? j.memberExpression(acc, j.identifier(part))
        : j.memberExpression(acc, j.literal(part), true),
    j.identifier('$')
  )
  return j.arrowFunctionExpression([j.identifier('$')], expr)
}

function splitNs(key: string) {
  const [maybeNs, ...rest] = key.split(':')
  return rest.length
    ? { ns: maybeNs, bare: rest.join(':') }
    : { ns: null, bare: maybeNs }
}

function isStringLiteralNode(x: { type: unknown } | null): x is j.StringLiteral {
  return x !== null && x.type === 'StringLiteral'
}

function templateToTokens(template: j.TemplateLiteral) {
  const tokens: (ExpressionKind | TSTypeKind | string)[] = []
  template.quasis.forEach((q, i) => {
    if (q.value.cooked) {
      q.value.cooked.split('.').forEach(s => {               // may yield ''
        if (s) tokens.push(s)
      })
    }
    if (i < template.expressions.length) {
      tokens.push(template.expressions[i])
    }
  })
  return tokens
}

function tokensToSelector(tokens: (string | ExpressionKind | TSTypeKind)[], j: j.JSCodeshift) {
  return tokens.reduce<j.Identifier | j.MemberExpression>((acc, token) => {
    if (typeof token === 'string') {
      if (PATTERN.digit.test(token)) {
        return j.memberExpression(acc, j.literal(Number(token)), true)
      }
      if (PATTERN.identifier.test(token)) {
        return j.memberExpression(acc, j.identifier(token))
      }
      return j.memberExpression(acc, j.literal(token), true)
    }
    /* dynamic  */
    return j.memberExpression(acc, token as never, true)
  }, j.identifier('$'))
}

/** 
 * TODO: See if jscodeshift has native utilities for cloning AST nodes (since 
 * {@link globalThis.structuredClone `structuredClone`} doesn't work here).
 */
function clone(node: unknown) {
  return JSON.parse(JSON.stringify(node))
}

export function transform(file: j.FileInfo, api: j.API) {
  const j = api.jscodeshift
  const root = j(file.source)

  const i18nAliases = new Set()
  const tAliases = new Set()

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

  const is18nextT = (callee: ExpressionKind) =>
    (callee.type === 'Identifier' && tAliases.has(callee.name)) ||
    (
      callee.type === 'MemberExpression' &&
      !callee.computed &&
      callee.property.type === 'Identifier' &&
      callee.property.name === 't' &&
      callee.object.type === 'Identifier' &&
      i18nAliases.has(callee.object.name)
    )

  root
    .find(j.CallExpression)
    .filter(p => is18nextT(p.node.callee))
    .forEach(p => {
      const { node } = p
      const [arg0, arg1, arg2] = node.arguments

      if (
        arg0 &&
        arg0.type === 'ArrayExpression' &&
        arg0.elements.length &&
        arg0.elements.every(isStringLiteralNode)
      ) {
        const keys = arg0.elements.map(el => el?.value)

        /** Gather default value + extra option props (if any) */
        let explicitDefault = null  // StringLiteral (2nd positional string arg)
        let optionObject = null     // first ObjectExpression arg, if any
        if (arg1 && arg1.type === 'StringLiteral') explicitDefault = arg1
        if (arg1 && arg1.type === 'ObjectExpression') optionObject = arg1
        if (!optionObject && arg2 && arg2.type === 'ObjectExpression') optionObject = arg2

        /** options object properties (e.g., context, val, etc.,but NOT defaultValue) */
        let extraTopProps = Array.of<j.Property | j.ObjectProperty>()
        /** case: defaultValue passed in the options object */
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

        /** default value passed via option object takes precedence over default value passed as 2nd argument */
        const finalDefault = optionDefault || explicitDefault

        /** Recursively build nested t() calls */
        const calleeClone = clone(node.callee)

        const buildCall = (idx: number) => {
          const { ns, bare } = splitNs(keys[idx])

          const props = []

          if (ns) props.push(j.property(
            'init',
            j.identifier('ns'),
            j.literal(ns)
          ))

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

          /** top-level extra props go only on the outermost selector */
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

      root
        .find(j.CallExpression)
        .filter(p => is18nextT(p.node.callee))
        .forEach(p => {
          const { node } = p
          const [arg0, arg1, arg2] = node.arguments

          /** case: dynamic-key */
          if (
            (arg0 && arg0.type === 'TemplateLiteral') ||
            (arg0 && (arg0.type === 'Identifier' || arg0.type === 'MemberExpression'))
          ) {
            /* derive selector function */
            const tokens =
              arg0.type === 'TemplateLiteral'
                ? templateToTokens(arg0)
                : [arg0]
            const selectorFn = j.arrowFunctionExpression(
              [j.identifier('$')],
              tokensToSelector(tokens, j)
            )

            const newArgs: (j.ArrowFunctionExpression | j.ObjectExpression)[] = [selectorFn]
            const opts: { [x: string]: unknown } = {}

            /** positional defaultValue (string) */
            if (arg1 && arg1.type === 'Literal') opts.defaultValue = arg1

            /** object‑style options (2nd or 3rd arg) */
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
            /** return so we don't fall through and start evaluating other branches */
            return
          }
        })

      /** case: default value */
      if (!arg0 || arg0.type !== 'StringLiteral' || typeof arg0.value !== 'string') return

      const { ns, bare } = splitNs(arg0.value)
      const selectorFn = keyToSelector(bare, j)
      const newArgs: (j.ArrowFunctionExpression | j.ObjectExpression)[] = [selectorFn]
      const opts: { [x: string]: unknown } = {}

      /** positional defaultValue (string) */
      if (arg1 && arg1.type === 'StringLiteral') opts.defaultValue = arg1

      /** object-style options (2nd or 3rd arg) */
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

  return prettier.format(
    root.toSource(), {
    parser: 'typescript',
    arrowParens: 'avoid',
    singleQuote: true,
  })
};
