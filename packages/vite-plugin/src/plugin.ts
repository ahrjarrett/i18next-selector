import type { TOptions } from 'i18next'
import type { Plugin } from 'vite'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import ts from 'typescript'
import { Json } from '@traversable/json'

import { defaultOptions, PLUGIN_HEADER } from './constants.js'
import { groupTypeScriptPluralKeys } from './group-keys-ts.js'
import { groupJsonPluralKeys } from './group-keys-json.js'
import { foldWithIndex } from './functor.js'
import { walk } from './walk.js'
import type { Either, transform } from './utils.js'
import { mergeJsdocs, isRight, isLeft, isJsonFile, isTsFile } from './utils.js'

interface SourceToTargetMap {
  sourceFile: string
  targetFile: string
}

export function parseJson(
  x: Json,
  $: transform.Options
): string | readonly Json[] | { [x: string]: Either<string[], Json> }
export function parseJson(x: Json, $: transform.Options) {
  return unparseJson(Json.fold((x) => {
    switch (true) {
      default: return x satisfies never
      case Json.isScalar(x): return typeof x === 'string' ? `"${x}"` : String(x)
      case Json.isArray(x): return x
      case Json.isObject(x): {
        return groupJsonPluralKeys(Object.entries(x), $)
      }
    }
  })(x))
}

export function unparseJson(xs: unknown) {
  return Json.fold((x) => {
    switch (true) {
      default: return x
      case isRight(x): return x.right
      case isLeft(x): {
        if (Json.isArray(x.left)) return x.left.join(' | ')
        else {
          const msg = '\n\r'
            + PLUGIN_HEADER
            + '\n\r\
          \'unparse\' received a left value that wasn\'t an array of string.\n\r'
          console.error(
            msg + '\n\r\
            If the value logged below is in fact, an array of strings, this is probably a bug.\
            Value:\n\r',
            x.left,
          )
          throw Error(msg)
        }
      }
    }
  })(xs as never)
}

export function stringifyJson(xs: unknown): string {
  return Json.foldWithIndex<string>((xs, { depth }) => {
    const OFFSET = '  '.repeat(depth)
    const JOIN = `,\n  ${OFFSET}`
    switch (true) {
      default: return xs satisfies never
      case Json.isScalar(xs): return String(xs)
      case Json.isArray(xs): {
        return xs.length === 0 ? `[]` : ''
          + '['
          + '\n'
          + OFFSET
          + xs.map((x, i) => `${i === 0 ? '  ' : ''}${x}`).join(JOIN)
          + '\n'
          + OFFSET
          + ']'
      }
      case Json.isObject(xs): {
        const entries = Object.entries(xs)
        return entries.length === 0 ? `{}` : ''
          + '{'
          + '\n'
          + OFFSET
          + Object.entries(xs).map(([k, v], i) => `${i === 0 ? '  ' : ''}"${k}": ${v}`).join(JOIN)
          + '\n'
          + OFFSET
          + '}'
      }
    }
  })(xs as never, { depth: 0, path: [] })
}

export function stringifyTypeScript(xs: unknown) {
  return foldWithIndex((xs, { depth }) => {
    const OFFSET = '  '.repeat(depth)
    const JOIN = `,\n  ${OFFSET}`
    switch (true) {
      default: return xs satisfies never
      case Json.isScalar(xs): return String(xs)
      case Json.isArray(xs): {
        return `[${xs.join(',')}]`
      }
      case Json.isObject(xs): {
        const entries = Object.entries(xs)
        return entries.length === 0 ? `{}` : ''
          + '{'
          + Object.values(xs).map((x, i) => {
            const LOCAL_OFFSET = `${OFFSET}  `
            if (isRight(x)) {
              const { jsdocs, key, value } = x.right
              return ''
                + mergeJsdocs(jsdocs, LOCAL_OFFSET)
                + OFFSET
                + `${key}: ${value}`
              // + `${i === 0 ? '  ' : ''}${key}: ${value}`
            } else {
              const { jsdocs, key, value } = x.left
              return ''
                + mergeJsdocs(jsdocs, LOCAL_OFFSET)
                + OFFSET
                + `${i === 0 ? '  ' : ''}${key}: ${value.join(' | ')}`
            }
          }).join(JOIN)
          + '\n'
          + OFFSET
          + '}'
      }
    }
  })(xs as never, { depth: 0 })
}

export function transformJsonToJsonString(json: { [x: string]: Json } | readonly Json[] | string, options?: transform.Options): string {
  const config = {
    pluralSeparator: options?.pluralSeparator || defaultOptions.pluralSeparator,
  } satisfies TOptions

  if (typeof json !== 'string') return stringifyJson(parseJson(json, config))
  else {
    try { return transformJsonToJsonString(JSON.parse(json)) }
    catch (e) {
      const msg = '\n\r'
        + PLUGIN_HEADER
        + '\n\r\
      \'transformToJson\' received a string, but failed to parse the string as JSON.\n\r'
      console.error(
        msg,
        'Here\'s the error we got:\n\r',
        e,
      )
      throw Error(msg)
    }
  }
}

const isTransformableNode = (x: ts.Node) =>
  ts.isStringLiteral(x)
  || ts.isArrayLiteralExpression(x)
  || ts.isPropertyAssignment(x)
  || ts.isObjectLiteralExpression(x)

export function transformTypeScriptAst(
  x: ts.Node,
  options: transform.Options
): unknown {
  function go(x: ts.Node, offset: number): any {
    switch (true) {
      case ts.isStringLiteral(x): return x.getText()
      case ts.isArrayLiteralExpression(x): return x
        .getChildren()[1]
        .getChildren()
        .filter(isTransformableNode)
        .map((_) => go(_, offset + 2))
      case ts.isPropertyAssignment(x): {
        const children = x.getChildren()
        const jsdoc = children.find(ts.isJSDoc)?.getText() ?? null
        const key = children.find(ts.isIdentifier)?.escapedText
        const valueIndex = children.findIndex(ts.isColonToken) + 1
        const value = go(children[valueIndex], offset)
        return { jsdoc, key, value }
      }
      case ts.isObjectLiteralExpression(x):
        return groupTypeScriptPluralKeys(
          x.properties.map((_) => go(_, offset + 2)),
          options
        )
      default: return x
    }
  }

  return go(x, 0)
}

export function jsonFileToDeclarationFile(
  mapping: SourceToTargetMap,
  options?: transform.Options
) {
  const sourceFile = fs.readFileSync(mapping.sourceFile).toString('utf8')
  return `export declare const resources: ${transformJsonToJsonString(sourceFile, options)}`
}

export function tsFileToDeclarationFile(
  mapping: SourceToTargetMap,
  options: transform.Options
) {
  const program = ts.createProgram([mapping.sourceFile], {})
  program.getTypeChecker()

  const sourceFile = program.getSourceFile(mapping.sourceFile)
  if (!sourceFile) return ''
  const variableStatements = sourceFile.statements.filter(ts.isVariableStatement)
  const defaultExport = sourceFile.statements.find(ts.isExportAssignment)

  // if (sourceFile && ts.isAsExpression(sourceFile)) {
  //   console.log('\n\n\nsourceFile', sourceFile, '\n\n\n')
  // }

  if (defaultExport) {
    console.log('here')
    if (ts.isAsExpression(defaultExport.expression)) {
      console.log('\n\n\ndefaultExport is as const expression', defaultExport?.expression, '\n\n\n')
    } else if (ts.isObjectLiteralExpression(defaultExport.expression)) {
      const BODY = stringifyTypeScript(
        transformTypeScriptAst(
          defaultExport.expression,
          options
        )
      )
      return ''
        + 'declare const defaultExport: '
        + BODY
        + '\n\rexport default defaultExport'
    }
  } else if (variableStatements.length > 0) {
    console.log('\n\n\nvariableStatements', variableStatements, '\n\n\n')
  }

  // if (sourceFile && ts.isSourceFile(sourceFile)) {
  //   // console.log('\n\n\nsourceFile', sourceFile, '\n\n\n')
  //   console.log('\n\n\ndefaultExport.expression is ObjectLiteralExpression', ts.isObjectLiteralExpression(defaultExport?.expression), '\n\n\n')
  // }

  return ''
}

function log(...args: any[]) {
  console.debug(`${PLUGIN_HEADER}\n\r`, ...args, '\n\r')
}

function getMappings(sourceDir: string): SourceToTargetMap[] {
  return walk(sourceDir, { match: (path) => isJsonFile(path) || isTsFile(path) })
    .map((sourceFile) => {
      const dirname = path.dirname(sourceFile)
      const split = sourceFile.split('/')
      const filename = split[split.length - 1]
      const targetFile = path.join(
        dirname,
        isJsonFile(filename)
          ? filename.slice(0, -'.json'.length).concat('.d.ts')
          : isTsFile(filename)
            ? filename.slice(0, -'.ts'.length).concat('.d.ts')
            : filename.concat('.d.ts')
      )
      return {
        sourceFile,
        targetFile,
      }
    })
}

export declare namespace i18nextVitePlugin {
  type Options = {
    sourceDir: string
    formatCmd?: string
    i18nextConfig?: TOptions
    timeout?: number
    silent?: boolean
  }
}

export function i18nextVitePlugin({
  sourceDir,
  i18nextConfig,
  formatCmd,
  silent = false,
  timeout = 300,
}: i18nextVitePlugin.Options): Plugin {
  let throttled = false
  const mappings = getMappings(sourceDir)
  const config = {
    ...i18nextConfig,
  } satisfies transform.Options

  return {
    name: 'vite-i18next-plugin',
    async buildStart() {
      mappings.forEach((m) => {
        const FILE_TYPE = isJsonFile(m.sourceFile) ? 'JSON' : 'TS'
        if (!silent) log(`source file detected: ${m.sourceFile}`)
        fs.writeFileSync(
          m.targetFile,
          FILE_TYPE === 'JSON'
            ? jsonFileToDeclarationFile(m, config)
            : tsFileToDeclarationFile(m, config)
        )
        if (formatCmd) execSync(formatCmd)
      })
    },
    configureServer({ watcher }) {
      mappings.forEach((m) => {
        watcher.add(m.sourceFile)
        watcher.on('change', async (file) => {
          if (file === m.sourceFile) {
            const FILE_TYPE = isJsonFile(file) ? 'JSON' : 'TS'
            if (!silent) log(`change detected: ${m.sourceFile}`)
            fs.writeFileSync(
              m.targetFile,
              FILE_TYPE === 'JSON'
                ? jsonFileToDeclarationFile(m, config)
                : tsFileToDeclarationFile(m, config)
            )
            if (formatCmd) execSync(formatCmd)
          }
        })
      })
    },
    handleHotUpdate({ file, server }) {
      if (throttled) return
      throttled = true
      setTimeout(() => throttled = false, timeout)
      const m = mappings.find(({ sourceFile }) => file === sourceFile)
      if (m) {
        if (!silent) log(`change detected: ${m.sourceFile}`)
        server.hot.send({ type: 'full-reload' })
      }
    }
  }
}
