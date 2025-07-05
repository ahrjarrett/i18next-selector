<br>
<h1 align="center">i18next-selector-codemod</h1>
<br>

<div align="center">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/i18next-selector-codemod?style=flat-square&logo=npm&label=npm&color=blue">
  &nbsp;
  <img alt="Static Badge" src="https://img.shields.io/badge/license-MIT-a094a2?style=flat-square">
  &nbsp;
  <img alt="npm" src="https://img.shields.io/npm/dt/i18next-selector-codemod?style=flat-square">
  &nbsp;
</div>

<br>
<br>

`i18next-selector-codemod` exists to make the migration to using the i18next [selector API](https://github.com/i18next/i18next/pull/2322) smooth and relatively painless for TypeScript users.

## Usage

`cd` into the root directory of your project (wherever your `node_modules` folder is located) and run:

```shell
$ npx i18next-selector-codemod
```

The CLI will guide you through a series of prompts, and then will either show you the set of changes that would be made (if `dryrun` is selected), or will apply the changes across the directories you specified.

Here's a quick demo:

![i18next-selector-codemod demo](https://github.com/ahrjarrett/i18next-selector/blob/main/bin/assets/i18next-selector-codemod.gif)

Here's [the diff](https://github.com/electricitymaps/electricitymaps-contrib/pull/8239) it created when applied to the `electricitymaps-contrib` codebase.

## What it will change

The following is a partial list of the transformations that `i18next-selector-codemod` is capable of applying on your behalf:

```typescript
import { t } from "i18next"

// Before:
t("abc.def.ghi")
// After:
t($ => $.abc.def.ghi)

// Before:
t("ns1:abc.def.ghi")
// After:
t($ => $.abc.def.ghi, { ns: "ns1" })

// Before:
t("abc.^~ !.ghi")
// After:
t($ => $.abc["^~ !"].ghi)

// Before:
t("abc.def.ghi", "default value")
// After:
t($ => $.abc.def.ghi, { defaultValue: "default value" })

// Before:
function doStuff(key: string) { return t(key) }
// After:
function doStuff(key: string) { return t($ => $[key]) }

// Before:
t(['abc.def', 'ghi.jkl'])
// After:
t($ => $.abc.def, { defaultValue: t($ => $.ghi.jkl) })

const condition = Math.random() > 0.5

// Before:
t(condition ? 'abc.def.ghi' : 'jkl.mno.pqr')
// After:
t($ => condition ? $.abc.def.ghi : $.jkl.mno.pqr)
```

It also works with `react-i18next`:

```typescript
import { useTranslation } from "react-i18next"

function MyComponent() {
  // You can destructure `t`
  const { t } = useTranslation()
  // You can access it directly and name it something else:
  const T = useTranslation().t

  return <>
    {/* Before: */}
    <p>{t('abc.def.ghi')}</p>
    {/* After: */}
    <p>{t($ => $.abc.def.ghi)}</p>

    {/* Before: */}
    <p>{T('abc.def.ghi')}</p>
    {/* After: */}
    <p>{T($ => $.abc.def.ghi)}</p>
  </>
}
```

Support for [`Trans`](https://react.i18next.com/latest/trans-component) and [`Translation`](https://react.i18next.com/latest/translation-render-prop) are in progress.

For a more comprehensive list, refer to the [test suite](https://github.com/ahrjarrett/i18next-selector/blob/main/packages/codemod/test/transform.test.ts).

## Limitations

Below is a partial list of transformations that, for one reason or another, `i18next-selector-codemod` is not capable of automating:

```typescript
function doStuff(key: string) {
  return t('abc.' + key + '.ghi') 
  //       ^^^^^^^^^^^^^^^^^^^^^
  // the AST for this syntax is quite complicated to
  // handle reliably, so this code will not be transformed
}

function doAbstractStuff(t: TFunction) {
  //                     ^^^^^^^^^^^^
  // passing around a reference to `t` makes it hard for 
  // the codemod to be sure where `t` came from, so this
  // code will not be transfomed
  return t('key')
}
```

Also, as mentioned above, we're still working on adding support for [`Trans`](https://react.i18next.com/latest/trans-component) and [`Translation`](https://react.i18next.com/latest/translation-render-prop).
