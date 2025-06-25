import ts from 'typescript'

import type { transform } from './utils.js'
import { groupTypeScriptPluralKeys } from './group-keys-ts.js'

export function transformTypeScriptAstToString(
  x: ts.Node,
  options: transform.Options
) {
  function go(x: ts.Node, offset: number = 0): any {
    switch (true) {
      case ts.isStringLiteral(x): return x.getText()
      case ts.isPropertyAssignment(x): {
        const children = x.getChildren()
        const jsdoc = children.find(ts.isJSDoc)?.getText() ?? null
        const key = children.find(ts.isIdentifier)?.escapedText
        const valueIndex = children.findIndex(ts.isColonToken) + 1
        const value = go(children[valueIndex])
        return { jsdoc, key, value }
      }
      case ts.isObjectLiteralExpression(x):
        return groupTypeScriptPluralKeys(
          x.properties.map(go, offset + 2),
          options
        )
      default: return x
    }
  }

  return go(x, 0)
}