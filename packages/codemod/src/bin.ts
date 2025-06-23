#!/usr/bin/env pnpm dlx tsx
import * as path from 'node:path'
import yargs from 'yargs'
import { execSync } from 'node:child_process'

import { run } from 'jscodeshift/src/Runner.js'

type Default<T> = T | (string & {})

interface Options {
  nsSeparator?: Default<':'>
  keySeparator?: Default<'.'>
  sourceDir?: Default<'./'>
}

const [CMD_PATH, SCRIPT_PATH, ...args] = process.argv
const DIR_NAME = path.dirname(SCRIPT_PATH)
const TRANSFORM_PATH = path.resolve(DIR_NAME, 'transform.ts')

const transformPath = path.resolve('transform.ts')

const defaultOptions = {}

const parsedOptions = yargs(args)
  .scriptName('i18next-selector-codemod')
  .parse() as Record<string, string | undefined>

const defaults = {
  nsSeparator: ':',
  keySeparator: '.',
  sourceDir: './',
} as const satisfies Required<Options>


function main() {
  const config = {
    keySeparator: parsedOptions.keySeparator || defaults.nsSeparator,
    nsSeparator: parsedOptions.nsSeparator || defaults.nsSeparator,
    sourceDir: parsedOptions._?.[0] || defaults.sourceDir,
  } satisfies Required<Options>

  // const TRANSFORM_PATH = `${CMD_PATH}/node_modules/@i18next-selector/codemod/dist/cjs/transform.js`

  const CMD = `npx jscodeshift --parser=tsx -t="${TRANSFORM_PATH}" --nsSeparator="${config.nsSeparator}" --keySeparator="${config.keySeparator}" ${config.sourceDir}`

  console.log('DIR_PATH', path.resolve(DIR_NAME, 'transform.ts'))
  console.log('CMD', CMD)

  execSync(CMD, { stdio: 'inherit' })

  // console.log('sourceDir', config.sourceDir)
  // console.log('DIR_NAME', DIR_NAME)

  // pnpm dlx jscodeshift --parser=tsx --no-babel -t src/migrate-i18next.cjs src

  // console.group('\n\n\rpackages/codemod/src/bin.ts', '\n\n\r')
  // console.debug('\n\n\rpath.resolve()', path.resolve(), '\n\r')
  // console.debug('\n\n\rpath.resolve("transform.ts")', path.resolve('transform.ts'), '\n\r')
  // console.debug('\n\n\rprocess.argv', process.argv, '\n\r')
  // console.groupEnd()
}

void main()
