import * as j from 'jscodeshift'
import { has } from './has.js'

type i18NextOptions =
  & { [x: string]: unknown }
  & {
    nsSeparator?: string
    keySeparator?: string
    defaultValue?: unknown
  }

const defaultOptions = {
  keySeparator: '.',
  nsSeparator: ':',
} satisfies Required<Omit<i18NextOptions, 'defaultValue'>>

function splitPath(
  key: string, {
    nsSeparator = defaultOptions.nsSeparator,
  }: i18NextOptions = defaultOptions
) {
  const [head, ...tail] = key.split(nsSeparator)
  if (tail.length === 0) return { ns: null, key: head }
  else return { ns: head, key: tail.join('') }
}

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

export function transform(file: j.FileInfo, api: j.API) {
  const j = api.jscodeshift
  const root = j(file.source)
  const i18nAliases = new Set()
  const tAliases = new Set()

  root
    .find(j.ImportDeclaration, { source: { value: 'i18next' } })
    .forEach(path => {
      /** TODO: remove nullish coalesce */
      path.node.specifiers!.forEach(spec => {
        switch (spec.type) {
          // import i18next from 'i18next'
          case 'ImportDefaultSpecifier':
          // import * as i18next from 'i18next'
          case 'ImportNamespaceSpecifier':
            i18nAliases.add(spec.local?.name)
            break
          // import { t } from 'i18next'
          case 'ImportSpecifier':
            if (spec.imported.name === 't') {
              tAliases.add(spec.local ? spec.local.name : 't')
            }
            break
        }
      })
    })

  if (i18nAliases.size === 0 && tAliases.size === 0) return file.source

  root
    .find(j.CallExpression)
    .filter(path => {
      const callee = path.node.callee
      return (
        callee.type === 'Identifier'
        && callee.name === 't'
      ) || (
          callee.type === 'MemberExpression'
          && has('name')(callee.property)
          && callee.property.name === 't'
        )
    })
    .forEach(path => {
      const [arg1, arg2, arg3] = path.node.arguments

      if (!arg1 || arg1.type !== 'StringLiteral' || typeof arg1.value !== 'string') return

      const { ns, key } = splitPath(arg1.value)
      const selector = keyToSelector(key, j)
      const newArgs: (j.ASTNode)[] = [selector]
      const options: i18NextOptions = {}

      /** Apply string literal default value as 2nd argument */
      if (arg2) {
        if (arg2.type === 'StringLiteral') {
          options.defaultValue = arg2
        } else if (arg2.type === 'ObjectExpression') {
          arg2.properties.forEach(prop => {
            if (has('key')(prop) && has('value')(prop)) {
              const { key, value } = prop
              if (has('name', (name) => typeof name === 'string')(key)) {
                options[key.name] = value
              } else if (has('value', (value) => typeof value === 'string')(prop.key)) {
                options[prop.key.value] = value
              } else { /** nothing to do here */ }
            } else { /** nothing to do here */ }
         })
        }
      }

      /** Handle the case where options is passed as the 3rd argument */
      if (arg3 && arg3.type === 'ObjectExpression') {
        arg3.properties.forEach(prop => {
          if (has('key')(prop) && has('value')(prop)) {
            const { key, value } = prop
            if (has('name', (name) => typeof name === 'string')(key)) {
              options[key.name] = value
            } else if (has('value', (value) => typeof value === 'string')(prop.key)) {
              options[prop.key.value] = value
            } else { /** nothing to do here */ }
          } else { /** nothing to do here */ }
        })
      }

      if (ns) 
        options.ns = j.literal(ns)

      /** Create options object, if any were passed */
      if (Object.keys(options).length > 0) {
        const objExpr = j.objectExpression(
          Object.entries(options).map(([key, value]) =>
            /** TODO: remove this type assertion */
            j.property('init', j.identifier(key), value as never)
          )
        )
        newArgs.push(objExpr)
      }
      /** TODO: remove this type assertion */
      path.node.arguments = newArgs as never
    })

  return root.toSource({ quote: 'single' })
}
