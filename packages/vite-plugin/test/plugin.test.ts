import * as vi from 'vitest'
import * as path from 'node:path'
import prettier from '@prettier/sync'
import {
  tsFileToDeclarationFile,
  jsonFileToDeclarationFile,
  yamlFileToDeclarationFile,
} from '@i18next-selector/vite-plugin'

const format = (src: string) => prettier.format(src, { parser: 'typescript', semi: false })

const defaultOptions = { contextSeparator: '_', pluralSeparator: '_' }

const DIR_PATH = path.join(path.resolve(), 'packages', 'vite-plugin', 'test')

vi.describe('〖⛳️〗‹‹‹ ❲@i18next-selector/vite-plugin❳', () => {
  vi.it('〖⛳️〗› ❲i18nextVitePlugin❳', () => {
    vi.expect(
      tsFileToDeclarationFile({
        sourceFile: path.join(DIR_PATH, '__generated__', 'input-01.ts'),
        targetFile: path.join(DIR_PATH, '__generated__', 'input-01.d.ts'),
      }, defaultOptions)
    ).toMatchInlineSnapshot
      (`""`)
  })

  vi.it('〖⛳️〗› ❲jsonFileToDeclarationFile❳: generates valid d.ts with special characters', () => {
    vi.expect(format(
      jsonFileToDeclarationFile({
        sourceFile: path.join(DIR_PATH, 'special-chars-input.json'),
        targetFile: path.join(DIR_PATH, '__generated__', 'special-chars-input.d.ts')
      }, defaultOptions)
    )).toMatchInlineSnapshot
      (`
      "export declare const resources: {
        'title with "quotes"': 'Hello "world"'
        "key\\nwith\\nnewlines": "Value\\nwith\\nnewlines"
        unicode: "Café 🚀 你好"
        backslashes: "Path\\\\to\\\\file"
        mixed: 'Quote "test" with\\nnewline and \\\\backslash'
        simple: "Normal text"
      }
      "
    `)
  })

  vi.it('〖⛳️〗› ❲yamlFileToDeclarationFile❳: generates valid d.ts from yaml (though conversion to json)', () => {
    vi.expect(format(
      yamlFileToDeclarationFile({
        sourceFile: path.join(DIR_PATH, 'yaml_input.yaml'),
        targetFile: path.join(DIR_PATH, '__generated__', 'yaml_input.d.ts')
      }, defaultOptions)
    )).toMatchInlineSnapshot
      (`
      "export declare const resources: { ok: "Ok"; main: { hello: "Hello world" } }
      "
    `)
  })
})
