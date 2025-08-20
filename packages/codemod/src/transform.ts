import type * as j from 'jscodeshift'
import type { ExpressionKind, IdentifierKind, TSTypeKind } from 'ast-types/lib/gen/kinds'
import type { namedTypes } from 'ast-types'

const Object_hasOwnProperty = globalThis.Object.prototype.hasOwnProperty

const NotFound = Symbol.for('@i18next-selector/codemod::NotFound')

const isComposite = <T>(u: unknown): u is { [x: string]: T } => !!u && typeof u === 'object'

function hasOwn<K extends keyof any>(u: unknown, key: K): u is { [P in K]: unknown }
function hasOwn(u: unknown, key: keyof any): u is { [x: string]: unknown } {
  return !isComposite(u)
    ? typeof u === 'function' && key in u
    : typeof key === 'symbol'
      ? isComposite(u) && key in u
      : Object_hasOwnProperty.call(u, key)
}

function get(x: unknown, ks: (keyof any)[]) {
  let out = x
  let k: keyof any | undefined
  while ((k = ks.shift()) !== undefined) {
    if (hasOwn(out, k)) void (out = out[k])
    else if (k === '') continue
    else return NotFound
  }
  return out
}

const isKey = (u: unknown) => typeof u === 'symbol' || typeof u === 'number' || typeof u === 'string'

function parsePath(xs: readonly (keyof any)[] | readonly [...(keyof any)[], (u: unknown) => boolean]):
  [path: (keyof any)[], check: (u: any) => u is any]
function parsePath(xs: readonly (keyof any)[] | readonly [...(keyof any)[], (u: unknown) => boolean]) {
  return Array.isArray(xs) && xs.every(isKey)
    ? [xs, () => true]
    : [xs.slice(0, -1), xs[xs.length - 1]]
}

type has<KS extends readonly (keyof any)[], T = {}> = has.loop<KS, T>

declare namespace has {
  export type loop<KS extends readonly unknown[], T>
    = KS extends readonly [...infer Todo, infer K extends keyof any]
    ? has.loop<Todo, { [P in K]: T }>
    : T extends infer U extends {} ? U : never
}

function has<KS extends readonly (keyof any)[]>(...params: [...KS]): (u: unknown) => u is has<KS>
function has<const KS extends readonly (keyof any)[], T>(...params: [...KS, (u: unknown) => u is T]): (u: unknown) => u is has<KS, T>
// impl.
function has(
  ...args:
    | [...path: (keyof any)[]]
    | [...path: (keyof any)[], check: (u: any) => u is any]
) {
  return (u: unknown) => {
    const [path, check] = parsePath(args)
    const got = get(u, path)
    return got !== NotFound && check(got)
  }
}

type TFunctionArg =
  | j.Identifier
  | j.MemberExpression
  | j.ArrowFunctionExpression
  | j.ObjectExpression

type SeparatedNamespace<T = string> = {
  ns?: string
  path: T
}

declare const Options: {
  nsSeparator: string
  keySeparator: string
  parser: 'tsx' | 'ts'
}

export type Options = typeof Options

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

function isConditionalExpressionNode(x: unknown): x is j.ConditionalExpression {
  return has('type', type => type === 'ConditionalExpression')(x)
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

function isSpreadElement(x: unknown): x is j.SpreadElement {
  return has('type', type => type === 'SpreadElement')(x)
}

function isCallExpressionNode(x: unknown): x is j.CallExpression {
  return has('type', type => type === 'CallExpression')(x)
}

function isObjectPatternNode(x: unknown): x is j.ObjectPattern {
  return has('type', type => type === 'ObjectPattern')(x)
}

function keyToSelector(key: string, j: j.JSCodeshift, options: Options) {
  const path = key.split(options.keySeparator)
  const expr = path.reduce<TFunctionArg>(
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

function separateNamespaceFromPath(key: string, options: Options): SeparatedNamespace {
  const [head, ...tail] = key.split(options.nsSeparator)
  return tail.length
    ? { ns: head, path: tail.join(options.nsSeparator) }
    : { path: head }
}

function templateLiteralToTokens(template: j.TemplateLiteral, options: Options): SeparatedNamespace<(ExpressionKind | TSTypeKind | string)[]> {
  let tokens: (ExpressionKind | TSTypeKind | string)[] = []
  let ns: string | null = null
  template.quasis.forEach((quasi, i) => {
    if (quasi.value.cooked) {
      const tmp = quasi.value.cooked.split(options.nsSeparator)
      if (tmp.length > 1) {
        ns = tmp[0]
        tmp.slice(1).join('').split(options.keySeparator).forEach(s => {
          if (s) tokens.push(s)
        })
      } else {
        quasi.value.cooked.split(options.keySeparator).forEach(s => {
          if (s) tokens.push(s)
        })
      }
    }
    if (i < template.expressions.length) {
      tokens.push(template.expressions[i])
    }
  })
  return { path: tokens, ...typeof ns === 'string' ? { ns } : {} }
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
  i18nAliases: Set<string | IdentifierKind>
  tAliases: Set<string | IdentifierKind>
  TransAliases: Set<string | IdentifierKind>
}

function is18nextTFunction(
  callee: ExpressionKind,
  { tAliases, i18nAliases }: Context
): boolean {
  return (isIdentifierNode(callee) && tAliases.has(callee.name)) || (
    isMemberExpressionNode(callee) &&
    !callee.computed &&
    isIdentifierNode(callee.property) &&
    callee.property.name === 't' &&
    isIdentifierNode(callee.object) &&
    i18nAliases.has(callee.object.name)
  )
}

function isTransComponent(
  callee: ExpressionKind,
  { TransAliases }: Context
): boolean {
  return isIdentifierNode(callee)
    && TransAliases.has(callee.name)
}

const defaults = {
  keySeparator: '.',
  nsSeparator: ':',
  parser: 'tsx',
} satisfies Options

export function transform(
  file: j.FileInfo,
  api: j.API,
  options?: { [x: string]: unknown } // Options
) {
  const j = api.jscodeshift
  const root = j(file.source)
  const i18nAliases = new Set<string | IdentifierKind>()
  const tAliases = new Set<string | IdentifierKind>()
  const useTranslationAliases = new Set<string | IdentifierKind>()
  const TransAliases = new Set<string | IdentifierKind>()
  const context = {
    i18nAliases,
    tAliases,
    TransAliases,
  } satisfies Context
  const config = { ...defaults, ...options } satisfies Options

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
        if (
          s.type === 'ImportSpecifier' &&
          s.imported.name === 'Trans'
        ) {
          TransAliases.add(s.local ? s.local.name : 'Trans')
        }
      })
    })

  if (
    i18nAliases.size === 0
    && tAliases.size === 0
    && useTranslationAliases.size === 0
    && TransAliases.size === 0
  ) return file.source

  function buildSelector(pathString: string) {
    const segments = pathString.split(".")
    let expr: namedTypes.Identifier | namedTypes.MemberExpression = j.identifier("$")

    for (const seg of segments) {
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(seg)) {
        expr = j.memberExpression(expr, j.identifier(seg))
      } else {
        expr = j.memberExpression(expr, j.literal(seg), true)
      }
    }
    return expr
  }

  function parseKey(key: string) {
    const colonIndex = key.indexOf(config.nsSeparator)
    if (colonIndex === -1) {
      return { ns: null, path: key }
    }
    return {
      ns: key.slice(0, colonIndex),
      path: key.slice(colonIndex + 1),
    }
  }

  root
    .find(j.JSXElement, {
      openingElement: {
        name: { type: "JSXIdentifier", name: "Trans" },
      },
    })
    .forEach(path => {
      const attrs = path.node.openingElement.attributes || []

      const i18nAttr = attrs.find(
        attr => attr.type === "JSXAttribute" && attr.name.name === "i18nKey"
      )
      if (!i18nAttr) return

      let keyString
      let selectorFn
      let tokens

      if (
        has('value', 'type')(i18nAttr)
        && i18nAttr.value?.type === "StringLiteral"
        && has('value', 'value')(i18nAttr)
      ) {
        keyString = i18nAttr.value.value
      } else if (
        has('value', 'type')(i18nAttr)
        && i18nAttr.value.type === "JSXExpressionContainer"
        && has('value', 'expression', 'type')(i18nAttr)
        && i18nAttr.value.expression.type === "StringLiteral"
        && has('value', 'expression', 'value')(i18nAttr)
      ) {
        keyString = i18nAttr.value.expression.value
      } else if (
        has('value', 'type')(i18nAttr)
        && i18nAttr.value.type === "JSXExpressionContainer"
        && has('value', 'expression', 'type')(i18nAttr)
        && isTemplateLiteralNode(i18nAttr.value.expression)
        && has('value', 'expression', 'expressions', Array.isArray)(i18nAttr)
      ) {
        if (
          i18nAttr.value.expression.expressions.length === 0
          && has('value', 'expression', 'quasis', Array.isArray)(i18nAttr)
        ) {
          keyString = i18nAttr.value.expression.quasis[0].value.cooked
        }
        else {
          tokens = templateLiteralToTokens(i18nAttr.value.expression, config)
        }
      }

      if (typeof keyString !== "string") {
        if (tokens !== undefined) {
          selectorFn = j.arrowFunctionExpression(
            [j.identifier("$")],
            tokensToSelector(tokens.path, j)
          )
          console.log('HERE', tokens);

          (i18nAttr as { value: unknown }).value = j.jsxExpressionContainer(selectorFn)
          // const ns = 

          if (tokens.ns && !attrs.some(a => a.type === "JSXAttribute" && a.name.name === "ns")) {
            attrs.push(j.jsxAttribute(j.jsxIdentifier("ns"), j.literal(tokens.ns)))
          }
        }
        else return
      } else {
        const { ns, path: pathString } = parseKey(keyString)
        selectorFn = j.arrowFunctionExpression(
          [j.identifier("$")],
          buildSelector(pathString)
        )

          ; (i18nAttr as { value: unknown }).value = j.jsxExpressionContainer(selectorFn)

        if (ns && !attrs.some(a => a.type === "JSXAttribute" && a.name.name === "ns")) {
          attrs.push(j.jsxAttribute(j.jsxIdentifier("ns"), j.literal(ns)))
        }
      }

    })

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
        isObjectPatternNode(id) &&
        isCallExpressionNode(init) &&
        isIdentifierNode(init.callee) &&
        useTranslationAliases.has(init.callee.name)
      ) {
        id.properties.forEach(prop => {
          if (
            has('value', isIdentifierNode)(prop) && (
              has('key', 'name', (name) => name === 't')(prop)
              || has('key', 'value', (value) => value === 't')(prop)
            )
          ) {
            tAliases.add(prop.value.name)
          }
        })
      }

      /**
       * @example
       * const t = useTranslation().t
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

      /**
       * @example
       * const { i18n } = useTranslation()
       * i18n.t(...)
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

      root.find(j.VariableDeclarator, {
        id: { type: "ObjectPattern" },
        init: { type: "CallExpression", callee: { name: "useTranslation" } }
      }).forEach(path => {
        if (has('properties', Array.isArray)(path.node.id)) {
          path.node.id.properties.forEach(prop => {
            if (has('key', 'name')(prop) && has('value', 'name', (_) => typeof _ === 'string')(prop)) {
              if (prop.key?.name === "i18n") {
                i18nAliases.add(prop.value?.name || prop.key.name)
              }
            }
          })
        }
      })
    })

  root
    .find(j.CallExpression)
    .filter(p => is18nextTFunction(p.node.callee, context))
    .forEach(p => {
      const { node } = p
      let [arg0, arg1, arg2] = node.arguments

      if (
        isArrayExpressionNode(arg0) &&
        arg0.elements.length > 0 &&
        arg0.elements.every(isStringLiteralNode)
      ) {
        const keys = arg0.elements.map(el => el?.value)

        /** gather default value + extra option props (if any) */
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
                const k = key.name ?? value
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

        const calleeClone = clone(node.callee)

        /** recursively build nested `t()` calls */
        const buildCall = (idx: number) => {
          const { ns, path } = separateNamespaceFromPath(keys[idx], config)

          const props = []

          if (ns) {
            props.push(j.property(
              'init',
              j.identifier('ns'),
              j.literal(ns)
            ))
          }

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

          const args: (j.ArrowFunctionExpression | j.ObjectExpression)[] = [keyToSelector(path, j, config)]
          if (props.length) args.push(j.objectExpression(props))

          return j.callExpression(clone(calleeClone), args)
        }

        /** replace the entire original call */
        j(p).replaceWith(buildCall(0))
        /** return so we don't fall through and start evaluating other branches */
        return
      }

      root
        .find(j.CallExpression)
        .filter(p => is18nextTFunction(p.node.callee, context))
        .forEach(p => {
          const { node } = p
          const [arg0, arg1, arg2] = p.node.arguments

          if (
            isConditionalExpressionNode(arg0) &&
            isStringLiteralNode(arg0.consequent) &&
            isStringLiteralNode(arg0.alternate) &&
            typeof arg0.consequent.value === 'string' &&
            typeof arg0.alternate.value === 'string'
          ) {
            const selectorFn = j.arrowFunctionExpression(
              [j.identifier('$')],
              j.conditionalExpression(
                arg0.test,
                keyToSelector(arg0.consequent.value, j, config).body as ExpressionKind,
                keyToSelector(arg0.alternate.value, j, config).body as ExpressionKind
              )
            )

            const newArgs: TFunctionArg[] = [selectorFn]
            const opts: { [x: string]: unknown } = {}
            let spreads: any[] = []

            const userDefinedOptionsObject = [arg1, arg2].find(a => a && a.type === 'ObjectExpression')
            if (userDefinedOptionsObject) {
              userDefinedOptionsObject.properties.forEach(prop => {
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

            const hasOpts = Object.keys(opts).length > 0
            const arg1IsPointer = isIdentifierNode(arg1) || isMemberExpressionNode(arg1)
            const arg2IsPointer = isIdentifierNode(arg2) || isMemberExpressionNode(arg2)

            if (arg1IsPointer) {
              if (hasOpts) {
                newArgs.push(
                  j.objectExpression([
                    ...spreads,
                    j.spreadElement(arg1),
                    ...Object.entries(opts).map(
                      ([k, v]) => j.property('init', j.identifier(k), v as never)
                    )
                  ])
                )
              } else {
                newArgs.push(arg1)
              }
            } else if (arg2IsPointer && hasOpts) {
              newArgs.push(
                j.objectExpression([
                  ...spreads,
                  j.spreadElement(arg2),
                  ...Object.entries(opts).map(
                    ([k, v]) => j.property('init', j.identifier(k), v as never)
                  )
                ])
              )
            } else if (hasOpts) {
              newArgs.push(
                j.objectExpression([
                  ...spreads,
                  ...Object.entries(opts).map(
                    ([k, v]) => j.property('init', j.identifier(k), v as never)
                  )
                ])
              )
            } else {
            }

            node.arguments = newArgs
            /** return so we don't fall through and start evaluating other branches */
            return
          }

          /** case: dynamic-key */
          if (
            isTemplateLiteralNode(arg0)
            || isIdentifierNode(arg0)
            || isMemberExpressionNode(arg0)
          ) {
            const tokens = isTemplateLiteralNode(arg0) ? templateLiteralToTokens(arg0, config) : { path: [arg0] }

            const selectorFn = j.arrowFunctionExpression(
              [j.identifier('$')],
              tokensToSelector(tokens.path, j)
            )

            const newArgs: TFunctionArg[] = [selectorFn]
            const opts: { [x: string]: unknown } = {}
            let spreads: any[] = []

            if (typeof tokens.ns === 'string') {
              // #66 https://github.com/ahrjarrett/i18next-selector/issues/66
              opts.ns = j.literal(tokens.ns)
            }

            /** positional defaultValue (string) */
            if (isStringLiteralNode(arg1)) opts.defaultValue = arg1

            const userDefinedOptionsObject = [arg1, arg2].find(a => a && a.type === 'ObjectExpression')
            if (userDefinedOptionsObject) {
              userDefinedOptionsObject.properties.forEach(prop => {
                if (isSpreadElement(prop)) {
                  spreads.push(prop)
                }
                else if (has('key')(prop) && has('value')(prop)) {
                  const { key, value } = prop
                  if (has('name', (name) => typeof name === 'string')(key)) {
                    opts[key.name] = value
                  } else if (has('value', (value) => typeof value === 'string')(key)) {
                    opts[key.value] = value
                  }
                }
              })
            }

            const hasOpts = Object.keys(opts).length > 0
            const arg1IsPointer = isIdentifierNode(arg1) || isMemberExpressionNode(arg1)
            const arg2IsPointer = isIdentifierNode(arg2) || isMemberExpressionNode(arg2)

            if (arg1IsPointer) {
              if (hasOpts) {
                newArgs.push(
                  j.objectExpression([
                    ...spreads,
                    j.spreadElement(arg1),
                    ...Object.entries(opts).map(
                      ([k, v]) => j.property('init', j.identifier(k), v as never)
                    ),
                  ])
                )
              } else {
                newArgs.push(arg1)
              }
            } else if (arg2IsPointer && hasOpts) {
              newArgs.push(
                j.objectExpression([
                  ...spreads,
                  j.spreadElement(arg2),
                  ...Object.entries(opts).map(
                    ([k, v]) => j.property('init', j.identifier(k), v as never)
                  )
                ])
              )
            } else if (hasOpts) {
              newArgs.push(
                j.objectExpression([
                  ...spreads,
                  ...Object.entries(opts).map(
                    ([k, v]) => j.property('init', j.identifier(k), v as never)
                  )
                ])
              )
            } else if (spreads.length > 0) {
              newArgs.push(
                j.objectExpression([
                  ...spreads,
                ])
              )
            }

            node.arguments = newArgs
            /** return so we don't fall through and start evaluating other branches */
            return
          }
        })

      if (!isStringLiteralNode(arg0) || typeof arg0.value !== 'string') return

      const { ns, path } = separateNamespaceFromPath(arg0.value, config)
      const selectorFn = keyToSelector(path, j, config)
      const newArgs: TFunctionArg[] = [selectorFn]
      const opts: { [x: string]: unknown } = {}
      let spreads: any[] = []

      if (ns && !('ns' in opts)) opts.ns = j.literal(ns)

      const userDefinedOptionsObject = [arg1, arg2].find(isObjectExpressionNode)
      if (userDefinedOptionsObject) {
        userDefinedOptionsObject.properties.forEach(prop => {
          if (isSpreadElement(prop)) {
            spreads.push(prop)
          }
          else if (has('key')(prop) && has('value')(prop)) {
            const { key, value } = prop
            if (has('name', (name) => typeof name === 'string')(key)) {
              opts[key.name] = value
            } else if (has('value', (value) => typeof value === 'string')(key)) {
              opts[key.value] = value
            }
          }
        })
      }

      if (isStringLiteralNode(arg1)) opts.defaultValue = arg1

      const hasOpts = Object.keys(opts).length > 0
      const arg1IsPointer = isIdentifierNode(arg1) || isMemberExpressionNode(arg1)
      const arg2IsPointer = isIdentifierNode(arg2) || isMemberExpressionNode(arg2)

      if (arg1IsPointer) {
        if (hasOpts) {
          newArgs.push(
            j.objectExpression([
              ...spreads,
              j.spreadElement(arg1),
              ...Object.entries(opts).map(
                ([k, v]) => j.property('init', j.identifier(k), v as never)
              )
            ])
          )
        } else {
          newArgs.push(arg1)
        }
      } else if (arg2IsPointer && hasOpts) {
        newArgs.push(
          j.objectExpression([
            ...spreads,
            j.spreadElement(arg2),
            ...Object.entries(opts).map(
              ([k, v]) => j.property('init', j.identifier(k), v as never)
            )
          ])
        )
      } else if (hasOpts) {
        newArgs.push(
          j.objectExpression([
            ...spreads,
            ...Object.entries(opts).map(
              ([k, v]) => j.property('init', j.identifier(k), v as never)
            )
          ])
        )
      }

      node.arguments = newArgs
    })

  return root.toSource()
}

export default transform
