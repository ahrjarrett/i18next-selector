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

const [SCRIPT_PATH, ...args] = process.argv
const DIR_NAME = path.dirname(SCRIPT_PATH)
const TRANSFORM_PATH = path.resolve(DIR_NAME, 'transform.js')

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

  const CMD = `npx jscodeshift --parser=tsx --no-babel -t="${TRANSFORM_PATH}" --nsSeparator="${config.nsSeparator}" --keySeparator="${config.keySeparator}" ${config.sourceDir}`

  console.log('CMD', CMD)

  execSync(CMD, { stdio: 'inherit' })
}

void main()
