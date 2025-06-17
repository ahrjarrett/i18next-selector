import * as vi from 'vitest'
import { transform } from '@i18next-codemod'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { applyTransform } from 'jscodeshift/src/testUtils.js'

const PATH = {
  transformer: path.join(path.resolve(), 'packages', 'i18next-codemod', 'src', 'transform.ts'),
  source1: path.join(path.resolve(), 'packages', 'i18next-codemod', 'test', 'sourceFile-1.ts'),
  source2: path.join(path.resolve(), 'packages', 'i18next-codemod', 'test', 'sourceFile-2.ts'),
  source3: path.join(path.resolve(), 'packages', 'i18next-codemod', 'test', 'sourceFile-3.ts'),
  source4: path.join(path.resolve(), 'packages', 'i18next-codemod', 'test', 'sourceFile-4.ts'),
  source5: path.join(path.resolve(), 'packages', 'i18next-codemod', 'test', 'sourceFile-5.ts'),
  source6: path.join(path.resolve(), 'packages', 'i18next-codemod', 'test', 'sourceFile-6.ts'),
}

const CODE = {
  transformer: fs.readFileSync(PATH.transformer).toString('utf8'),
  source1: fs.readFileSync(PATH.source1).toString('utf8'),
  source2: fs.readFileSync(PATH.source2).toString('utf8'),
  source3: fs.readFileSync(PATH.source3).toString('utf8'),
  source4: fs.readFileSync(PATH.source4).toString('utf8'),
  source5: fs.readFileSync(PATH.source5).toString('utf8'),
  source6: fs.readFileSync(PATH.source6).toString('utf8'),
}

vi.describe('〖⛳️〗‹‹‹ ❲i18next-codemod❳', () => {
  vi.it('〖⛳️〗› ❲transform❳', () => {

    vi.expect(
      applyTransform({ default: transform, parser: 'ts' }, {}, { path: PATH.source1, source: CODE.source1 })
    ).toMatchInlineSnapshot(`
      "import { t } from 'i18next'

      t($ => $.abc.def.ghi)

      t($ => $.abc.def.ghi, {
        ns: 'ns1'
      })

      t($ => $.abc.def.ghi, {
        ns: 'bob'
      })

      t($ => $.abc.def.ghi, {
        defaultValue: 'default value'
      })

      t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        ns: 'ns1'
      })

      t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        val: 'some val',
        ns: 'ns1'
      })"
    `)

    vi.expect(
      applyTransform({ default: transform, parser: 'ts' }, {}, { path: PATH.source2, source: CODE.source2 })
    ).toMatchInlineSnapshot(`
      "import i18next from 'i18next'

      i18next.t($ => $.abc.def.ghi)

      i18next.t($ => $.abc.def.ghi, {
        ns: 'ns1'
      })

      i18next.t($ => $.abc.def.ghi, {
        ns: 'bob'
      })

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value'
      })

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        ns: 'ns1'
      })

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        val: 'some val',
        ns: 'ns1'
      })"
    `)

    vi.expect(
      applyTransform({ default: transform, parser: 'ts' }, {}, { path: PATH.source3, source: CODE.source3 })
    ).toMatchInlineSnapshot(`
      "import * as i18next from 'i18next'

      i18next.t($ => $.abc.def.ghi)

      i18next.t($ => $.abc.def.ghi, {
        ns: 'ns1'
      })

      i18next.t($ => $.abc.def.ghi, {
        ns: 'bob'
      })

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value'
      })

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        ns: 'ns1'
      })

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        val: 'some val',
        ns: 'ns1'
      })"
    `)

    vi.expect(
      applyTransform({ default: transform, parser: 'ts' }, {}, { path: PATH.source4, source: CODE.source4 })
    ).toMatchInlineSnapshot(`
      "function t(x: string, y?: unknown, z?: unknown) {
        return x
      }

      t('abc.def.ghi')

      t('ns1:abc.def.ghi')

      t('bob:abc.def.ghi')

      t('abc.def.ghi', 'default value')

      t('abc.def.ghi', 'default value', { ns: 'ns1' })

      t('ns1:abc.def.ghi', 'default value', { val: 'some val' })"
    `)

    vi.expect(
      applyTransform({ default: transform, parser: 'ts' }, {}, { path: PATH.source5, source: CODE.source5 })
    ).toMatchInlineSnapshot(`
      "import { t } from './dummy-t.js'

      t('abc.def.ghi')

      t('ns1:abc.def.ghi')

      t('bob:abc.def.ghi')

      t('abc.def.ghi', 'default value')

      t('abc.def.ghi', 'default value', { ns: 'ns1' })

      t('ns1:abc.def.ghi', 'default value', { val: 'some val' })"
    `)

    vi.expect(
      applyTransform({ default: transform, parser: 'ts' }, {}, { path: PATH.source6, source: CODE.source6 })
    ).toMatchInlineSnapshot(`
      "import * as i18next from './dummy-t.js'

      i18next.t('abc.def.ghi')

      i18next.t('ns1:abc.def.ghi')

      i18next.t('bob:abc.def.ghi')

      i18next.t('abc.def.ghi', 'default value')

      i18next.t('abc.def.ghi', 'default value', { ns: 'ns1' })

      i18next.t('ns1:abc.def.ghi', 'default value', { val: 'some val' })"
    `)

  })
})

