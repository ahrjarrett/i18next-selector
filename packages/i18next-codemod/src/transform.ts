import type * as j from 'jscodeshift'
import type { ExpressionKind, IdentifierKind, TSTypeKind } from 'ast-types/lib/gen/kinds'
import prettier from '@prettier/sync'

import { has } from './has.js'

const PATTERN = {
  identifier: /^[A-Za-z_$][A-Za-z0-9_$]*$/,
  digit: /^\d+$/,
}

function isStringLiteralNode(x: unknown): x is j.StringLiteral {
  return has('type', type => type === 'StringLiteral')(x)
}

function isTemplateLiteralNode(x: unknown): x is j.TemplateLiteral {
  return has('type', type => type === 'TemplateLiteral')(x)
}

function isMemberExpressionNode(x: unknown): x is j.MemberExpression {
  return has('type', type => type === 'MemberExpression')(x)
}

function isIdentifierNode(x: unknown): x is j.Identifier {
  return has('type', type => type === 'Identifier')(x)
}

function isArrayExpressionNode(x: unknown): x is j.ArrayExpression {
  return has('type', type => type === 'ArrayExpression')(x)
}

function isObjectExpressionNode(x: unknown): x is j.ObjectExpression {
  return has('type', type => type === 'ObjectExpression')(x)
}

function isCallExpressionNode(x: unknown): x is j.CallExpression {
  return has('type', type => type === 'CallExpression')(x)
}

function keyToSelector(key: string, j: j.JSCodeshift) {
  const path = key.split('.')
  const expr = path.reduce<j.Identifier | j.MemberExpression>(
    (acc, part) => {
      if (PATTERN.digit.test(part))
        return j.memberExpression(acc, j.literal(Number(part)), true)
      else if (PATTERN.identifier.test(part))
        return j.memberExpression(acc, j.identifier(part))
      else
        return j.memberExpression(acc, j.literal(part), true)
    },
    j.identifier('$')
  )
  return j.arrowFunctionExpression([j.identifier('$')], expr)
}

type SeparatedNamespace = { ns: string | null, path: string }
function separateNamespaceFromPath(key: string): SeparatedNamespace {
  const [head, ...tail] = key.split(':')
  return tail.length
    ? { ns: head, path: tail.join(':') }
    : { ns: null, path: head }
}


function templateLiteralToTokens(template: j.TemplateLiteral) {
  let tokens: (ExpressionKind | TSTypeKind | string)[] = []
  template.quasis.forEach((quasi, i) => {
    if (quasi.value.cooked) {
      quasi.value.cooked.split('.').forEach(s => {
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
    if (typeof token === 'string')
      if (PATTERN.digit.test(token))
        return j.memberExpression(acc, j.literal(Number(token)), true)
      else if (PATTERN.identifier.test(token))
        return j.memberExpression(acc, j.identifier(token))
      else
        return j.memberExpression(acc, j.literal(token), true)
    else
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

interface Context {
  tAliases: Set<string | IdentifierKind>
  i18nAliases: Set<string | IdentifierKind>
  useTranslationAliases: Set<string | IdentifierKind>
}

function is18nextTFunction(callee: ExpressionKind, { tAliases, i18nAliases }: Context): boolean {
  return (isIdentifierNode(callee) && tAliases.has(callee.name)) ||
    (
      isMemberExpressionNode(callee) &&
      !callee.computed &&
      isIdentifierNode(callee.property) &&
      callee.property.name === 't' &&
      isIdentifierNode(callee.object) &&
      i18nAliases.has(callee.object.name)
    )
}

function isUseTranslationTFunction(callee: ExpressionKind, { tAliases, i18nAliases, useTranslationAliases }: Context) {
  return (isIdentifierNode(callee) && useTranslationAliases.has(callee.name)) ||
    (
      isMemberExpressionNode(callee) &&
      !callee.computed &&
      isIdentifierNode(callee.property) &&
      callee.property.name === 't' &&
      isIdentifierNode(callee.object) &&
      i18nAliases.has(callee.object.name)
    )
}



export function transform(file: j.FileInfo, api: j.API) {
  const j = api.jscodeshift
  const root = j(file.source)

  const i18nAliases = new Set<string | IdentifierKind>()
  const tAliases = new Set<string | IdentifierKind>()
  const useTranslationAliases = new Set<string | IdentifierKind>()

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

  root
    .find(j.ImportDeclaration, { source: { value: 'react-i18next' } })
    .forEach(p => {
      (p.node.specifiers || []).forEach(s => {
        if (
          s.type === 'ImportSpecifier' &&
          s.imported.name === 'useTranslation'
        ) {
          useTranslationAliases.add(s.local ? s.local.name : 'useTranslation')
        }
      })
    })

  if (i18nAliases.size === 0 && tAliases.size === 0 && useTranslationAliases.size === 0) return file.source

  root
    .find(j.VariableDeclarator)
    .forEach(p => {
      const init = p.node.init
      const id = p.node.id

      /**
       * @example
       * const { t } = useTranslation()
       */
      if (
        isIdentifierNode(id) &&
        isCallExpressionNode(init) &&
        isIdentifierNode(init.callee) &&
        useTranslationAliases.has(init.callee.name)
      ) {
        tAliases.add(id.name)
      }

      /**
       * @example
       * const t = useTranslation().t
       * // or:
       * const someOtherName = useTranslation().t
       */
      if (
        isIdentifierNode(id) &&
        isMemberExpressionNode(init) &&
        isCallExpressionNode(init.object) &&
        isIdentifierNode(init.object.callee) &&
        useTranslationAliases.has(init.object.callee.name) &&
        isIdentifierNode(init.property) &&
        init.property.name === 't'
      ) {
        tAliases.add(id.name)
      }
    })

  root
    .find(j.CallExpression)
    .filter(
      p =>
        is18nextTFunction(p.node.callee, { tAliases, i18nAliases, useTranslationAliases })
        || isUseTranslationTFunction(p.node.callee, { tAliases, i18nAliases, useTranslationAliases })
    )
    .forEach(p => {
      const { node } = p
      const [arg0, arg1, arg2] = node.arguments

      if (
        isArrayExpressionNode(arg0) &&
        arg0.elements.length > 0 &&
        arg0.elements.every(isStringLiteralNode)
      ) {
        const keys = arg0.elements.map(el => el?.value)

        /** Gather default value + extra option props (if any) */
        let positionalDefaultValue = null
        let optionsObject = null
        if (isStringLiteralNode(arg1)) positionalDefaultValue = arg1
        if (isObjectExpressionNode(arg1)) optionsObject = arg1
        if (!optionsObject && isObjectExpressionNode(arg2)) optionsObject = arg2

        /** options object properties (e.g., context, val, etc., but NOT defaultValue) */
        let toplevelOptionProperties = Array.of<j.Property | j.ObjectProperty>()
        /** case: defaultValue passed in the options object */
        let defaultValueFromOptions = null
        if (optionsObject) {
          optionsObject.properties.forEach(prop => {
            if (has('key')(prop) && has('value')(prop)) {
              const { key, value } = prop
              if (has('name', (name) => typeof name === 'string')(key)) {
                const k = key.name || value
                if (k === 'defaultValue') {
                  defaultValueFromOptions = prop.value
                } else {
                  toplevelOptionProperties.push(prop)
                }
              }
            }
          })
        }

        const finalDefault = defaultValueFromOptions || positionalDefaultValue

        /** Recursively build nested t() calls */
        const calleeClone = clone(node.callee)

        const buildCall = (idx: number) => {
          const { ns, path } = separateNamespaceFromPath(keys[idx])

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

          /** top-level props (besides nested default values) bubble up to the root selector */
          if (idx === 0 && toplevelOptionProperties.length) {
            props.push(...toplevelOptionProperties)
          }

          const args: (j.ArrowFunctionExpression | j.ObjectExpression)[] = [keyToSelector(path, j)]
          if (props.length) args.push(j.objectExpression(props))

          return j.callExpression(clone(calleeClone), args)
        }

        /** Replace the entire original call */
        j(p).replaceWith(buildCall(0))
        return
      }

      root
        .find(j.CallExpression)
        .filter(p => is18nextTFunction(p.node.callee, { tAliases, i18nAliases, useTranslationAliases }))
        .forEach(p => {
          const { node } = p
          const [arg0, arg1, arg2] = p.node.arguments

          /** case: dynamic-key */
          if (
            isTemplateLiteralNode(arg0)
            || isIdentifierNode(arg0)
            || isMemberExpressionNode(arg0)
          ) {
            /* derive selector function */
            const tokens = isTemplateLiteralNode(arg0) ? templateLiteralToTokens(arg0) : [arg0]
            const selectorFn = j.arrowFunctionExpression(
              [j.identifier('$')],
              tokensToSelector(tokens, j)
            )

            const newArgs: (j.ArrowFunctionExpression | j.ObjectExpression)[] = [selectorFn]
            const opts: { [x: string]: unknown } = {}

            /** positional defaultValue (string) */
            if (isStringLiteralNode(arg1)) opts.defaultValue = arg1

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
                  Object.entries(opts).map(
                    ([k, v]) => j.property('init', j.identifier(k), v as never)
                  )
                )
              )
            }

            node.arguments = newArgs
            /** return so we don't fall through and start evaluating other branches */
            return
          }
        })

      if (!isStringLiteralNode(arg0) || typeof arg0.value !== 'string') return

      const { ns, path } = separateNamespaceFromPath(arg0.value)
      const selectorFn = keyToSelector(path, j)
      const newArgs: (j.ArrowFunctionExpression | j.ObjectExpression)[] = [selectorFn]
      const opts: { [x: string]: unknown } = {}

      if (isStringLiteralNode(arg1)) opts.defaultValue = arg1

      const optObj = [arg1, arg2].find(isObjectExpressionNode)
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
            Object.entries(opts).map(
              ([k, v]) => j.property('init', j.identifier(k), v as never)
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
