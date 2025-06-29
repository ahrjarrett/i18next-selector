#!/usr/bin/env pnpm dlx tsx
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { Command, Prompt } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { PKG_NAME, PKG_VERSION } from './version.js'

type Options = {
  paths: string[]
  parser: 'tsx' | 'ts'
  keySeparator: string
  nsSeparator: string
}

const parserChoices = [
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

const DIST_PATH = path.join(
  path.dirname(SCRIPT_PATH),
  '..',
  PKG_NAME,
  'dist',
)

const TRANSFORM_PATH = path.resolve(DIST_PATH, 'esm', 'transform.js')

const paths = Prompt.list({
  message: `Which directories would you like to apply the codemod to (separated by commas)?`,
  default: defaults.paths.join(','),
})

const parser = Prompt.select({
  message: 'Which parser do you want to use?',
  choices: parserChoices,
})

const keySeparator = Prompt.text({
  message: 'i18next key separator?',
  default: defaults.keySeparator,
})

const nsSeparator = Prompt.text({
  message: 'Namespace separator?',
  default: defaults.nsSeparator,
})

const command = Command.prompt(
  'Configure i18next-selector codemod',
  Prompt.all([paths, parser, keySeparator, nsSeparator]),
  ([paths, parser, keySeparator, nsSeparator]) =>
    Effect.sync(main({ paths, parser, keySeparator, nsSeparator }))
)

const cli = Command.run(command, {
  name: PKG_NAME,
  version: `v${PKG_VERSION}` as const,
})

cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)

function main({ paths, parser, nsSeparator, keySeparator }: Options) {
  return () => {
    const CMD = [
      'npx jscodeshift',
      `-t="${TRANSFORM_PATH}"`,
      '--no-babel',
      `--parser=${parser}`,
      `--nsSeparator="${nsSeparator}"`,
      `--keySeparator="${keySeparator}"`,
      `${paths.join(', ')}`
    ].join(' ')

    console.log('CMD', CMD)

    execSync(CMD, { stdio: 'inherit' })
  }
}

// Prepare and run the CLI application
// cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)

// Command.prompt(
//   "New workspace",
//   Prompt.all([pkgName, env, localDeps, visibility]),
//   ([pkgName, env, localDeps, private_]) =>
//     Effect.sync(() => main({ pkgName, env, localDeps, private: private_, dryRun: false })
//     ))

// import { run } from 'jscodeshift/src/Runner.js'

// type Default<T> = T | (string & {})

// interface Options {
//   nsSeparator?: Default<':'>
//   keySeparator?: Default<'.'>
//   sourceDir?: Default<'./'>
// }


// const parsedOptions = yargs(args)
//   .scriptName('i18next-selector-codemod')
//   .parse() as Record<string, string | undefined>

// const defaults = {
//   nsSeparator: ':',
//   keySeparator: '.',
//   sourceDir: './',
// } as const satisfies Required<Options>

// function main() {
//   const config = {
//     keySeparator: parsedOptions.keySeparator || defaults.nsSeparator,
//     nsSeparator: parsedOptions.nsSeparator || defaults.nsSeparator,
//     sourceDir: parsedOptions._?.[0] || defaults.sourceDir,
//   } satisfies Required<Options>

//   const CMD = `npx jscodeshift --parser=tsx --no-babel -t="${TRANSFORM_PATH}" --nsSeparator="${config.nsSeparator}" --keySeparator="${config.keySeparator}" ${config.sourceDir}`

//   console.log('CMD', CMD)

//   execSync(CMD, { stdio: 'inherit' })
// }

// void main()
