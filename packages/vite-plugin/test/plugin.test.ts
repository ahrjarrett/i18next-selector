import * as vi from 'vitest'
import * as path from 'node:path'
import * as fs from 'node:fs'

import {
  i18nextVitePlugin,
  tsFileToDeclarationFile,
} from '@i18next-selector/vite-plugin'

// Import the function for E2E testing
import { jsonFileToDeclarationFile } from '../src/plugin.js'

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

  vi.it('〖⛳️〗› ❲jsonFileToDeclarationFile❳: generates valid d.ts with special characters', () => {
    const mappings = {
      sourceFile: path.join(DIR_PATH, 'special-chars-input.json'),
      targetFile: path.join(DIR_PATH, '__generated__', 'special-chars-input.d.ts')
    }

    vi.expect(jsonFileToDeclarationFile(mappings, defaultOptions)).toMatchInlineSnapshot(`"export declare const resources: {  "title with \\"quotes\\"": "Hello \\"world\\"","key\\nwith\\nnewlines": "Value\\nwith\\nnewlines","unicode": "Café 🚀 你好","backslashes": "Path\\\\to\\\\file","mixed": "Quote \\"test\\" with\\nnewline and \\\\backslash","simple": "Normal text"}"`)
  })
})
