import * as vi from 'vitest'
import { applyTransform } from 'jscodeshift/src/testUtils.js'

import { transform } from '@i18next-codemod'

const module = { default: transform, parser: 'ts' as const }
const options = {}

vi.describe('〖⛳️〗‹‹‹ ❲i18next-codemod❳', () => {
  vi.it('〖⛳️〗› ❲transform❳: it applies transformation when `t` is a named import', () => {
    vi.expect(
      applyTransform(module, options, {
        path: '',
        source: [
          `import { t } from "i18next"`,
          ``,
          `t("abc.def.ghi")`,
          ``,
          `t("ns1:abc.def.ghi")`,
          ``,
          `t("bob:abc.def.ghi")`,
          ``,
          `t("abc.^~ !.ghi")`,
          ``,
          `t("abc.def.ghi", "default value")`,
          ``,
          `t("abc.def.ghi", "default value", { ns: "ns1" })`,
          ``,
          `t("ns1:abc.def.ghi", "default value", { val: "some val" })`,
          ``,
          `function createTranslation1(key: string) { return t(\`abc.\${key}.ghi\`) }`,
          ``,
          `function createTranslation3(key: string) { return t(key) }`,
          /** 
           * TODO: 
           * @example
           * `function createTranslation2(key: string) { return t('abc.' + key + '.ghi') }`
           */
        ].join('\r')
      })
    ).toMatchInlineSnapshot(`
      "import { t } from 'i18next';

      t($ => $.abc.def.ghi);

      t($ => $.abc.def.ghi, {
        ns: 'ns1',
      });

      t($ => $.abc.def.ghi, {
        ns: 'bob',
      });

      t($ => $.abc['^~ !'].ghi);

      t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
      });

      t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        ns: 'ns1',
      });

      t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        val: 'some val',
        ns: 'ns1',
      });

      function createTranslation1(key: string) {
        return t($ => $.abc[key].ghi);
      }

      function createTranslation3(key: string) {
        return t($ => $[key]);
      }"
    `)
  })

  vi.it('〖⛳️〗› ❲transform❳: it applies transformation when `i18next` is used as a default import', () => {
    vi.expect(
      applyTransform(module, options, {
        path: '',
        source: [
          `import i18next from "i18next"`,
          ``,
          `i18next.t("abc.def.ghi")`,
          ``,
          `i18next.t("ns1:abc.def.ghi")`,
          ``,
          `i18next.t("bob:abc.def.ghi")`,
          ``,
          `i18next.t("abc.def.ghi", "default value")`,
          ``,
          `i18next.t("abc.def.ghi", "default value", { ns: "ns1" })`,
          ``,
          `i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })`,
          ``,
        ].join('\r')
      })
    ).toMatchInlineSnapshot(`
      "import i18next from 'i18next';

      i18next.t($ => $.abc.def.ghi);

      i18next.t($ => $.abc.def.ghi, {
        ns: 'ns1',
      });

      i18next.t($ => $.abc.def.ghi, {
        ns: 'bob',
      });

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
      });

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        ns: 'ns1',
      });

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        val: 'some val',
        ns: 'ns1',
      });"
    `)
  })

  vi.it('〖⛳️〗› ❲transform❳: it applies transformation when `i18next` is a namespace import', () => {
    vi.expect(
      applyTransform(
        module, options, {
        path: '',
        source: [
          `import * as i18next from "i18next"`,
          ``,
          `i18next.t("abc.def.ghi")`,
          ``,
          `i18next.t("ns1:abc.def.ghi")`,
          ``,
          `i18next.t("bob:abc.def.ghi")`,
          ``,
          `i18next.t("abc.def.ghi", "default value")`,
          ``,
          `i18next.t("abc.def.ghi", "default value", { ns: "ns1" })`,
          ``,
          `i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })`,
        ].join('\r')
      })
    ).toMatchInlineSnapshot(`
      "import * as i18next from 'i18next';

      i18next.t($ => $.abc.def.ghi);

      i18next.t($ => $.abc.def.ghi, {
        ns: 'ns1',
      });

      i18next.t($ => $.abc.def.ghi, {
        ns: 'bob',
      });

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
      });

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        ns: 'ns1',
      });

      i18next.t($ => $.abc.def.ghi, {
        defaultValue: 'default value',
        val: 'some val',
        ns: 'ns1',
      });"
    `)
  })

  vi.it('〖⛳️〗› ❲transform❳: handles `defaultValue` permutations', () => {
    vi.expect(
      applyTransform(module, options, {
        path: '',
        source: [
          `import { t } from "i18next"`,
          ``,
          `t(["abc.def"])`,
          ``,
          `t(['abc.def', 'ghi.jkl'])`,
          ``,
          `t(['abc.def', 'ghi.jkl', 'mno.pqr'])`,
          ``,
          `t(['ns1:abc.def'])`,
          ``,
          `t(['ns1:abc.def', 'ns2:ghi.jkl', 'ns3:mno.pqr'])`,
          ``,
          `t(['ns1:abc.def', 'ghi.jkl', 'ns2:mno.pqr'])`,
          ``,
          `t(['abc.def', 'ghi.jkl'], { defaultValue: 'some default value' })`,
          ``,
          `t(['ns1:abc.def', 'ghi.jkl', 'ns2:mno.pqr'], { defaultValue: 'some default value' })`,
          ``,
          `t(['ns1:abc.def', 'ghi.jkl', 'ns2:mno.pqr'], 'some default value')`,
          ``,
          `t(['ns1:abc.def', 'ghi.jkl', 'ns2:mno.pqr'], 'some default value', { val: 'some val' })`,
          ``,
          `t(['abc.def', 'ghi.jkl', 'mno.pqr'], 'some default value', { val: 'some val' })`,
        ].join('\r')
      })
    ).toMatchInlineSnapshot(`
      "import { t } from 'i18next';

      t($ => $.abc.def);

      t($ => $.abc.def, {
        defaultValue: t($ => $.ghi.jkl),
      });

      t($ => $.abc.def, {
        defaultValue: t($ => $.ghi.jkl, {
          defaultValue: t($ => $.mno.pqr),
        }),
      });

      t($ => $.abc.def, {
        ns: 'ns1',
      });

      t($ => $.abc.def, {
        ns: 'ns1',

        defaultValue: t($ => $.ghi.jkl, {
          ns: 'ns2',

          defaultValue: t($ => $.mno.pqr, {
            ns: 'ns3',
          }),
        }),
      });

      t($ => $.abc.def, {
        ns: 'ns1',

        defaultValue: t($ => $.ghi.jkl, {
          defaultValue: t($ => $.mno.pqr, {
            ns: 'ns2',
          }),
        }),
      });

      t($ => $.abc.def, {
        defaultValue: t($ => $.ghi.jkl, {
          defaultValue: 'some default value',
        }),
      });

      t($ => $.abc.def, {
        ns: 'ns1',

        defaultValue: t($ => $.ghi.jkl, {
          defaultValue: t($ => $.mno.pqr, {
            ns: 'ns2',
            defaultValue: 'some default value',
          }),
        }),
      });

      t($ => $.abc.def, {
        ns: 'ns1',

        defaultValue: t($ => $.ghi.jkl, {
          defaultValue: t($ => $.mno.pqr, {
            ns: 'ns2',
            defaultValue: 'some default value',
          }),
        }),
      });

      t($ => $.abc.def, {
        ns: 'ns1',

        defaultValue: t($ => $.ghi.jkl, {
          defaultValue: t($ => $.mno.pqr, {
            ns: 'ns2',
            defaultValue: 'some default value',
          }),
        }),

        val: 'some val',
      });

      t($ => $.abc.def, {
        defaultValue: t($ => $.ghi.jkl, {
          defaultValue: t($ => $.mno.pqr, {
            defaultValue: 'some default value',
          }),
        }),

        val: 'some val',
      });"
    `)
  })

  vi.it('〖⛳️〗› ❲transform❳: it does not apply transformation when `t` is a local function', () => {
    vi.expect(
      applyTransform(module, options, {
        path: '',
        source: [
          `function t(x: string, y?: unknown, z?: unknown) { return x }`,
          ``,
          `t("abc.def.ghi")`,
          ``,
          `t("ns1:abc.def.ghi")`,
          ``,
          `t("bob:abc.def.ghi")`,
          ``,
          `t("abc.def.ghi", "default value")`,
          ``,
          `t("abc.def.ghi", "default value", { ns: "ns1" })`,
          ``,
          `t("ns1:abc.def.ghi", "default value", { val: "some val" })`,
        ].join('\r')
      })
    ).toMatchInlineSnapshot(`
      "function t(x: string, y?: unknown, z?: unknown) { return x }

      t("abc.def.ghi")

      t("ns1:abc.def.ghi")

      t("bob:abc.def.ghi")

      t("abc.def.ghi", "default value")

      t("abc.def.ghi", "default value", { ns: "ns1" })

      t("ns1:abc.def.ghi", "default value", { val: "some val" })"
    `)
  })

  vi.it('〖⛳️〗› ❲transform❳: it does not apply transformation when `t` is a named import from somewhere besides `i18next`', () => {
    vi.expect(
      applyTransform(module, options, {
        path: '',
        source: [
          `import { t } from "not-i18next"`,
          ``,
          `t("abc.def.ghi")`,
          ``,
          `t("ns1:abc.def.ghi")`,
          ``,
          `t("bob:abc.def.ghi")`,
          ``,
          `t("abc.def.ghi", "default value")`,
          ``,
          `t("abc.def.ghi", "default value", { ns: "ns1" })`,
          ``,
          `t("ns1:abc.def.ghi", "default value", { val: "some val" })`,
        ].join('\r')
      })
    ).toMatchInlineSnapshot(`
      "import { t } from "not-i18next"

      t("abc.def.ghi")

      t("ns1:abc.def.ghi")

      t("bob:abc.def.ghi")

      t("abc.def.ghi", "default value")

      t("abc.def.ghi", "default value", { ns: "ns1" })

      t("ns1:abc.def.ghi", "default value", { val: "some val" })"
    `)
  })

  vi.it('〖⛳️〗› ❲transform❳: it does not apply transformation when `i18next` is a default import from somewhere besides `i18next`', () => {
    vi.expect(
      applyTransform(module, options, {
        path: '',
        source: [
          `import i18next from "not-i18next"`,
          ``,
          `i18next.t("abc.def.ghi")`,
          ``,
          `i18next.t("ns1:abc.def.ghi")`,
          ``,
          `i18next.t("bob:abc.def.ghi")`,
          ``,
          `i18next.t("abc.def.ghi", "default value")`,
          ``,
          `i18next.t("abc.def.ghi", "default value", { ns: "ns1" })`,
          ``,
          `i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })`
        ].join('\r')
      })
    ).toMatchInlineSnapshot(`
      "import i18next from "not-i18next"

      i18next.t("abc.def.ghi")

      i18next.t("ns1:abc.def.ghi")

      i18next.t("bob:abc.def.ghi")

      i18next.t("abc.def.ghi", "default value")

      i18next.t("abc.def.ghi", "default value", { ns: "ns1" })

      i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })"
    `)
  })

  vi.it('〖⛳️〗› ❲transform❳: it does not apply transformation when `i18next` is a namespace import from somewhere besides `i18next`', () => {
    vi.expect(
      applyTransform(module, options, {
        path: '',
        source: [
          `import * as i18next from "not-i18next"`,
          ``,
          `i18next.t("abc.def.ghi")`,
          ``,
          `i18next.t("ns1:abc.def.ghi")`,
          ``,
          `i18next.t("bob:abc.def.ghi")`,
          ``,
          `i18next.t("abc.def.ghi", "default value")`,
          ``,
          `i18next.t("abc.def.ghi", "default value", { ns: "ns1" })`,
          ``,
          `i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })`
        ].join('\r')
      })
    ).toMatchInlineSnapshot(`
      "import * as i18next from "not-i18next"

      i18next.t("abc.def.ghi")

      i18next.t("ns1:abc.def.ghi")

      i18next.t("bob:abc.def.ghi")

      i18next.t("abc.def.ghi", "default value")

      i18next.t("abc.def.ghi", "default value", { ns: "ns1" })

      i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })"
    `)
  })

})
