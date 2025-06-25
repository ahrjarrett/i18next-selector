import * as vi from 'vitest'
import * as path from 'node:path'
import * as fs from 'node:fs'

import {
  i18nextVitePlugin,
  tsFileToDeclarationFile,
} from '@i18next-selector/vite-plugin'

import input_01 from './input-01.js'

const defaultOptions = { contextSeparator: '_', pluralSeparator: '_' }

const DIR_PATH = path.join(path.resolve(), 'packages', 'vite-plugin', 'test')

const mappings = {
  sourceFile: path.join(DIR_PATH, '__generated__', 'input-01.ts'),
  targetFile: path.join(DIR_PATH, '__generated__', 'tsFileToDeclarationFile-01.generated.ts'),
}

vi.describe('〖⛳️〗‹‹‹ ❲@i18next-selector/vite-plugin❳', () => {
  vi.it('〖⛳️〗› ❲i18nextVitePlugin❳', () => {
    vi.expect(tsFileToDeclarationFile(mappings, {})).toMatchInlineSnapshot
      (`""`)
  })
})
