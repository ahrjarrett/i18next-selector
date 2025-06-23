#!/usr/bin/env pnpm dlx tsx

import * as path from 'node:path'
import { run } from 'jscodeshift/src/Runner.js'

import type { Options } from './transform.js'

const transformPath = path.resolve('transform.ts')

const defaultOptions = {}

function main() {
  console.group('\n\n\rpackages/codemod/src/bin.ts', '\n\n\r')
  console.debug('\n\n\rpath.resolve()', path.resolve(), '\n\r')
  console.debug('\n\n\rpath.resolve("transform.ts")', path.resolve('transform.ts'), '\n\r')
  console.debug('\n\n\rprocess.argv', process.argv, '\n\r')
  console.groupEnd()
}

void main()
