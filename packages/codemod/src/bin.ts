#!/usr/bin/env npx tsx
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { Command, Prompt } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"

const PKG_NAME = 'i18next-selector-codemod'
const PKG_VERSION = '0.0.3'

type Options = {
  paths: string[]
  dryrun: boolean
  keySeparator: string
  nsSeparator: string
  ignorePattern?: string
}

const booleanChoices = [
  { title: 'true', value: true },
  { title: 'false', value: false },
] as const

const defaults = {
  paths: ['./src'],
  dryrun: false,
  keySeparator: '.',
  nsSeparator: ':',
} as const satisfies Options

const [, SCRIPT_PATH] = process.argv
const DIST_PATH = path.join(path.dirname(SCRIPT_PATH), '..', PKG_NAME, 'dist')
const TRANSFORM_PATH = path.join(path.resolve(DIST_PATH), 'cjs', 'transform.js')

const paths = Prompt.list({
  message: `Directories to modify (default: '${defaults.paths.join(' ')}')`,
  delimiter: ' ',
})

const keySeparator = Prompt.text({
  message: `i18next key separator? (default: '${defaults.keySeparator}')`,
})

const nsSeparator = Prompt.text({
  message: `Namespace separator? (default: '${defaults.nsSeparator}')`,
})

const ignorePattern = Prompt.text({
  message: `Ignore pattern (.gitignore style)?`,
})

const dryrun = Prompt.select({
  message: `Dry run? (default: ${defaults.dryrun})`,
  choices: [...booleanChoices].reverse(),
})

const command = Command.prompt(
  'Configure i18next-selector codemod',
  Prompt.all([paths, keySeparator, nsSeparator, dryrun, ignorePattern]),
  ([paths, keySeparator, nsSeparator, dryrun, ignorePattern]) =>
    run({ paths, keySeparator, nsSeparator, dryrun, ignorePattern })
)

function run({ paths, keySeparator, nsSeparator, dryrun, ignorePattern }: Options) {
  const PATHS = paths.length === 1 && paths[0].trim() === '' ? defaults.paths : paths
  const CMD = [
    'npx jscodeshift',
    `--transform="${TRANSFORM_PATH}"`,
    ...(dryrun ? [`--dry=true`] : []),
    `--ignore-pattern="**/node_modules/**"`,
    `--ignore-pattern="*.d.ts"`,
    ...ignorePattern === undefined ? [] : [`--ignore-pattern="${ignorePattern}"`],
    `--keySeparator=${keySeparator || defaults.keySeparator}`,
    `--nsSeparator=${nsSeparator || defaults.nsSeparator}`,
    `--parser=tsx`,
    `${PATHS.join(' ')}`
  ].join(' ')

  console.log('Executing:\n\r', CMD)

  return Effect.sync(() => execSync(CMD, { stdio: 'inherit' }))
}

const main = Command.run(command, {
  name: PKG_NAME,
  version: `v${PKG_VERSION}` as const,
})

void main(process.argv).pipe(
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
