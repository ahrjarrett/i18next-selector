import * as vi from 'vitest'
import { applyTransform } from 'jscodeshift/src/testUtils.js'

import { transform } from '@i18next-codemod'

const module = { default: transform, parser: 'ts' as const }
const options = {}

vi.describe('〖⛳️〗‹‹‹ ❲i18next-codemod❳', () => {

  vi.describe('〖⛳️〗‹‹ ❲t❳', () => {
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
      ).toMatchInlineSnapshot
        (`
        "import { t } from "i18next"

        t($ => $.abc.def.ghi)

        t($ => $.abc.def.ghi, {
          ns: "ns1"
        })

        t($ => $.abc.def.ghi, {
          ns: "bob"
        })

        t($ => $.abc["^~ !"].ghi)

        t($ => $.abc.def.ghi, {
          defaultValue: "default value"
        })

        t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          ns: "ns1"
        })

        t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          val: "some val",
          ns: "ns1"
        })

        function createTranslation1(key: string) { return t($ => $.abc[key].ghi); }

        function createTranslation3(key: string) { return t($ => $[key]); }"
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
            `i18next.t("abc.^~ !.ghi")`,
            ``,
            `i18next.t("abc.def.ghi", "default value")`,
            ``,
            `i18next.t("abc.def.ghi", "default value", { ns: "ns1" })`,
            ``,
            `i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })`,
            ``,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import i18next from "i18next"

        i18next.t($ => $.abc.def.ghi)

        i18next.t($ => $.abc.def.ghi, {
          ns: "ns1"
        })

        i18next.t($ => $.abc.def.ghi, {
          ns: "bob"
        })

        i18next.t($ => $.abc["^~ !"].ghi)

        i18next.t($ => $.abc.def.ghi, {
          defaultValue: "default value"
        })

        i18next.t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          ns: "ns1"
        })

        i18next.t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          val: "some val",
          ns: "ns1"
        })"
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
            `i18next.t("abc.^~ !.ghi")`,
            ``,
            `i18next.t("abc.def.ghi", "default value")`,
            ``,
            `i18next.t("abc.def.ghi", "default value", { ns: "ns1" })`,
            ``,
            `i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })`,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import * as i18next from "i18next"

        i18next.t($ => $.abc.def.ghi)

        i18next.t($ => $.abc.def.ghi, {
          ns: "ns1"
        })

        i18next.t($ => $.abc.def.ghi, {
          ns: "bob"
        })

        i18next.t($ => $.abc["^~ !"].ghi)

        i18next.t($ => $.abc.def.ghi, {
          defaultValue: "default value"
        })

        i18next.t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          ns: "ns1"
        })

        i18next.t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          val: "some val",
          ns: "ns1"
        })"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: handles `defaultValue` permutations', () => {

      /**
       * TODO
       * - [ ]: Look into removing the added new lines
       * 
       * Apparently the newlines are added to properties that span multiple lines
       * This appears to be by design in the recast package (which jscodeshift uses
       * under the hood)
       *
       * Issue: https://github.com/benjamn/recast/pull/353
       */

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
            `t("abc.^~ !.ghi")`,
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
      ).toMatchInlineSnapshot
        (`
        "import { t } from "i18next"

        t($ => $.abc.def)

        t($ => $.abc.def, {
          defaultValue: t($ => $.ghi.jkl)
        })

        t($ => $.abc.def, {
          defaultValue: t($ => $.ghi.jkl, {
            defaultValue: t($ => $.mno.pqr)
          })
        })

        t($ => $.abc.def, {
          ns: "ns1"
        })

        t($ => $.abc["^~ !"].ghi)

        t($ => $.abc.def, {
          ns: "ns1",

          defaultValue: t($ => $.ghi.jkl, {
            ns: "ns2",

            defaultValue: t($ => $.mno.pqr, {
              ns: "ns3"
            })
          })
        })

        t($ => $.abc.def, {
          ns: "ns1",

          defaultValue: t($ => $.ghi.jkl, {
            defaultValue: t($ => $.mno.pqr, {
              ns: "ns2"
            })
          })
        })

        t($ => $.abc.def, {
          defaultValue: t($ => $.ghi.jkl, {
            defaultValue: 'some default value'
          })
        })

        t($ => $.abc.def, {
          ns: "ns1",

          defaultValue: t($ => $.ghi.jkl, {
            defaultValue: t($ => $.mno.pqr, {
              ns: "ns2",
              defaultValue: 'some default value'
            })
          })
        })

        t($ => $.abc.def, {
          ns: "ns1",

          defaultValue: t($ => $.ghi.jkl, {
            defaultValue: t($ => $.mno.pqr, {
              ns: "ns2",
              defaultValue: 'some default value'
            })
          })
        })

        t($ => $.abc.def, {
          ns: "ns1",

          defaultValue: t($ => $.ghi.jkl, {
            defaultValue: t($ => $.mno.pqr, {
              ns: "ns2",
              defaultValue: 'some default value'
            })
          }),

          val: 'some val'
        })

        t($ => $.abc.def, {
          defaultValue: t($ => $.ghi.jkl, {
            defaultValue: t($ => $.mno.pqr, {
              defaultValue: 'some default value'
            })
          }),

          val: 'some val'
        })"
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
            `t("abc.^~ !.ghi")`,
            ``,
            `t("abc.def.ghi", "default value")`,
            ``,
            `t("abc.def.ghi", "default value", { ns: "ns1" })`,
            ``,
            `t("ns1:abc.def.ghi", "default value", { val: "some val" })`,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "function t(x: string, y?: unknown, z?: unknown) { return x }

        t("abc.def.ghi")

        t("ns1:abc.def.ghi")

        t("bob:abc.def.ghi")

        t("abc.^~ !.ghi")

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
            `t("abc.^~ !.ghi")`,
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

        t("abc.^~ !.ghi")

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
            `i18next.t("abc.^~ !.ghi")`,
            ``,
            `i18next.t("abc.def.ghi", "default value")`,
            ``,
            `i18next.t("abc.def.ghi", "default value", { ns: "ns1" })`,
            ``,
            `i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })`
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import i18next from "not-i18next"

        i18next.t("abc.def.ghi")

        i18next.t("ns1:abc.def.ghi")

        i18next.t("bob:abc.def.ghi")

        i18next.t("abc.^~ !.ghi")

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
            `i18next.t("abc.^~ !.ghi")`,
            ``,
            `i18next.t("abc.def.ghi", "default value")`,
            ``,
            `i18next.t("abc.def.ghi", "default value", { ns: "ns1" })`,
            ``,
            `i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })`
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import * as i18next from "not-i18next"

        i18next.t("abc.def.ghi")

        i18next.t("ns1:abc.def.ghi")

        i18next.t("bob:abc.def.ghi")

        i18next.t("abc.^~ !.ghi")

        i18next.t("abc.def.ghi", "default value")

        i18next.t("abc.def.ghi", "default value", { ns: "ns1" })

        i18next.t("ns1:abc.def.ghi", "default value", { val: "some val" })"
      `)
    })
  })

  vi.describe('〖⛳️〗‹‹‹ ❲useTranslation❳', () => {

    vi.it('〖⛳️〗› ❲transform❳: it applies transformation when `useTranslation` and `t` are destructured', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const { t } = useTranslation()`,
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
            `t("ns1:abc.def.ghi", "default value", { val: "some val" })`
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const { t } = useTranslation()

        t($ => $.abc.def.ghi)

        t($ => $.abc.def.ghi, {
          ns: "ns1"
        })

        t($ => $.abc.def.ghi, {
          ns: "bob"
        })

        t($ => $.abc["^~ !"].ghi)

        t($ => $.abc.def.ghi, {
          defaultValue: "default value"
        })

        t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          ns: "ns1"
        })

        t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          val: "some val",
          ns: "ns1"
        })"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it applies transformation when `t` is renamed when pulled off of `useTranslation`', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const T = useTranslation().t`,
            ``,
            `T("abc.def.ghi")`,
            ``,
            `T("ns1:abc.def.ghi")`,
            ``,
            `T("bob:abc.def.ghi")`,
            ``,
            `T("abc.^~ !.ghi")`,
            ``,
            `T("abc.def.ghi", "default value")`,
            ``,
            `T("abc.def.ghi", "default value", { ns: "ns1" })`,
            ``,
            `T("ns1:abc.def.ghi", "default value", { val: "some val" })`
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const T = useTranslation().t

        T($ => $.abc.def.ghi)

        T($ => $.abc.def.ghi, {
          ns: "ns1"
        })

        T($ => $.abc.def.ghi, {
          ns: "bob"
        })

        T($ => $.abc["^~ !"].ghi)

        T($ => $.abc.def.ghi, {
          defaultValue: "default value"
        })

        T($ => $.abc.def.ghi, {
          defaultValue: "default value",
          ns: "ns1"
        })

        T($ => $.abc.def.ghi, {
          defaultValue: "default value",
          val: "some val",
          ns: "ns1"
        })"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it applies transformation when `useTranslation` is aliased', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation as useT } from "react-i18next"`,
            ``,
            `const t = useT().t`,
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
            `t("ns1:abc.def.ghi", "default value", { val: "some val" })`
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation as useT } from "react-i18next"

        const t = useT().t

        t($ => $.abc.def.ghi)

        t($ => $.abc.def.ghi, {
          ns: "ns1"
        })

        t($ => $.abc.def.ghi, {
          ns: "bob"
        })

        t($ => $.abc["^~ !"].ghi)

        t($ => $.abc.def.ghi, {
          defaultValue: "default value"
        })

        t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          ns: "ns1"
        })

        t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          val: "some val",
          ns: "ns1"
        })"
      `)
    })

  })

  vi.describe('〖⛳️〗‹‹‹ ❲useTranslation❳', () => {

    vi.it('〖⛳️〗› ❲transform❳: it applies transformation when `t` is renamed when pulled off of `useTranslation`', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const T = useTranslation().t`,
            ``,
            `T("abc.def.ghi")`,
            ``,
            `T("ns1:abc.def.ghi")`,
            ``,
            `T("bob:abc.def.ghi")`,
            ``,
            `T("abc.^~ !.ghi")`,
            ``,
            `T("abc.def.ghi", "default value")`,
            ``,
            `T("abc.def.ghi", "default value", { ns: "ns1" })`,
            ``,
            `T("ns1:abc.def.ghi", "default value", { val: "some val" })`
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const T = useTranslation().t

        T($ => $.abc.def.ghi)

        T($ => $.abc.def.ghi, {
          ns: "ns1"
        })

        T($ => $.abc.def.ghi, {
          ns: "bob"
        })

        T($ => $.abc["^~ !"].ghi)

        T($ => $.abc.def.ghi, {
          defaultValue: "default value"
        })

        T($ => $.abc.def.ghi, {
          defaultValue: "default value",
          ns: "ns1"
        })

        T($ => $.abc.def.ghi, {
          defaultValue: "default value",
          val: "some val",
          ns: "ns1"
        })"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it applies transformation when `useTranslation` is aliased', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation as useT } from "react-i18next"`,
            ``,
            `const t = useT().t`,
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
            `t("ns1:abc.def.ghi", "default value", { val: "some val" })`
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation as useT } from "react-i18next"

        const t = useT().t

        t($ => $.abc.def.ghi)

        t($ => $.abc.def.ghi, {
          ns: "ns1"
        })

        t($ => $.abc.def.ghi, {
          ns: "bob"
        })

        t($ => $.abc["^~ !"].ghi)

        t($ => $.abc.def.ghi, {
          defaultValue: "default value"
        })

        t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          ns: "ns1"
        })

        t($ => $.abc.def.ghi, {
          defaultValue: "default value",
          val: "some val",
          ns: "ns1"
        })"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it preserves options object is a pointer and passed as the 2nd arg', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const { t } = useTranslation("ns")`,
            ``,
            `const i18nextOptions = {}`,
            ``,
            `t("abc.def.ghi", i18nextOptions)`,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const { t } = useTranslation("ns")

        const i18nextOptions = {}

        t($ => $.abc.def.ghi, i18nextOptions)"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it preserves options object is a pointer, is passed as the 2nd arg, and has computed properties', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const { t } = useTranslation("ns")`,
            ``,
            `const i18nextOptions = {}`,
            ``,
            `t("ns:abc.def.ghi", i18nextOptions)`,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const { t } = useTranslation("ns")

        const i18nextOptions = {}

        t($ => $.abc.def.ghi, {
          ...i18nextOptions,
          ns: "ns"
        })"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it preserves options object is a pointer and passed as the 3rd arg', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const { t } = useTranslation("ns")`,
            ``,
            `const i18nextOptions = {}`,
            ``,
            `t("abc.def.ghi", "some fallback value", i18nextOptions)`,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const { t } = useTranslation("ns")

        const i18nextOptions = {}

        t($ => $.abc.def.ghi, {
          ...i18nextOptions,
          defaultValue: "some fallback value"
        })"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it preserves options object is a pointer and passed as the 2nd arg in a nested call', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const { t } = useTranslation("ns")`,
            ``,
            `const i18nextOptions = {}`,
            ``,
            `t("abc.def.ghi", { defaultValue: t("jkl.mno.pqr", i18nextOptions) })`,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const { t } = useTranslation("ns")

        const i18nextOptions = {}

        t($ => $.abc.def.ghi, {
          defaultValue: t($ => $.jkl.mno.pqr, i18nextOptions)
        })"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it preserves options object is a pointer, is passed as the 2nd arg, and has computed properties in a nested call', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const { t } = useTranslation("ns")`,
            ``,
            `const i18nextOptions = {}`,
            ``,
            `t("abc.def.ghi", { defaultValue: t("ns:jkl.mno.pqr", i18nextOptions) })`,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const { t } = useTranslation("ns")

        const i18nextOptions = {}

        t($ => $.abc.def.ghi, {
          defaultValue: t($ => $.jkl.mno.pqr, {
            ...i18nextOptions,
            ns: "ns"
          })
        })"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it preserves options object is a pointer and is passed as the 3rd arg in a nested call', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const { t } = useTranslation("ns")`,
            ``,
            `const i18nextOptions = {}`,
            ``,
            `t("abc.def.ghi", { defaultValue: t("ns:jkl.mno.pqr", "some default value", i18nextOptions) })`,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const { t } = useTranslation("ns")

        const i18nextOptions = {}

        t($ => $.abc.def.ghi, {
          defaultValue: t($ => $.jkl.mno.pqr, {
            ...i18nextOptions,
            defaultValue: "some default value",
            ns: "ns"
          })
        })"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it does not apply selector to the namespace passed to `useTranslation`', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const { t } = useTranslation("ns")`,
            ``,
            `t("abc.def.ghi")`,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const { t } = useTranslation("ns")

        t($ => $.abc.def.ghi)"
      `)
    })

    vi.it('〖⛳️〗› ❲transform❳: it supports inline ternaries', () => {
      vi.expect(
        applyTransform(module, options, {
          path: '',
          source: [
            `import { useTranslation } from "react-i18next"`,
            ``,
            `const { t } = useTranslation("ns")`,
            ``,
            `const condition = Math.random() > 0.5`,
            ``,
            `t(condition ? "abc.def.ghi" : "jkl.mno.pqr")`,
          ].join('\r')
        })
      ).toMatchInlineSnapshot
        (`
        "import { useTranslation } from "react-i18next"

        const { t } = useTranslation("ns")

        const condition = Math.random() > 0.5

        t($ => condition ? $.abc.def.ghi : $.jkl.mno.pqr)"
      `)
    })

  })

})
