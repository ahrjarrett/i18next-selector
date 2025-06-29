#!/usr/bin/env pnpm dlx tsx
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { Command, Prompt } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { PKG_NAME, PKG_VERSION } from './version.js'

type Options = {
  paths: string[]
  parser: typeof parserChoices[number]['value']
  keySeparator: string
  nsSeparator: string
}

const parserChoices = [
  { title: 'both', value: 'both' },
  { title: 'tsx', value: 'tsx' },
  { title: 'ts', value: 'ts' },
] as const

const defaults = {
  paths: ['./src'],
  parser: parserChoices[0].value,
  keySeparator: '.',
  nsSeparator: ':',
} as const

const [, SCRIPT_PATH] = process.argv
const DIST_PATH = path.join(path.dirname(SCRIPT_PATH), '..', PKG_NAME, 'dist')
const TRANSFORM_PATH = path.join(path.resolve(DIST_PATH), 'cjs', 'transform.js')

const paths = Prompt.list({
  message: `Directories to modify (default: './src')`,
  default: defaults.paths.join(','),
})

const parser = Prompt.select({
  message: `File types to modify? (default: 'both')`,
  choices: parserChoices,
})

const keySeparator = Prompt.text({
  message: `i18next key separator? (default: '.'`,
  default: defaults.keySeparator,
})

const nsSeparator = Prompt.text({
  message: `Namespace separator? (default: ':')`,
  default: defaults.nsSeparator,
})

const command = Command.prompt(
  'Configure i18next-selector codemod',
  Prompt.all([paths, parser, keySeparator, nsSeparator]),
  ([paths, parser, keySeparator, nsSeparator]) =>
    run({ paths, parser, keySeparator, nsSeparator })
)

function run({ paths, parser, nsSeparator, keySeparator }: Options) {
  const CMD = [
    'npx jscodeshift',
    `-t="${TRANSFORM_PATH}"`,
    '--no-babel',
    `--parser=${parser || defaults.parser}`,
    `--nsSeparator="${nsSeparator || defaults.nsSeparator}"`,
    `--keySeparator="${keySeparator || defaults.keySeparator}"`,
    `${paths.length === 0 ? defaults.paths : paths.join(', ')}`
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
