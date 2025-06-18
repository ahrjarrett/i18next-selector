# i18next-codemod

This is the jscodeshift codemod that accompanies [this PR](https://github.com/i18next/i18next/pull/2322), which adds a "selector" API to i18next.

## Goals

The goals of the PR are to:

1. increase IDE performance for TypeScript users with large translation sets
2. decrease the occurence of OOM (out-of-memory) errors when using i18next with tools such as `@typescript-eslint`
3. improve DX by supporting "go-to definition", allowing users to quickly find, navigate, and troubleshoot their translations
4. preserve JSDoc annotations at the call-site, making translations easier to understand and share

To see how the codemod behaves, check out the [tests](https://github.com/ahrjarrett/i18next-codemod/blob/main/packages/i18next-codemod/test/transform.test.ts).

## Todos

1. Finish review process for [this PR](https://github.com/i18next/i18next/pull/2322)
2. 
3. Add parameter for users to provide a path to their `i18next` config file
   - This would allow the codemod to adapt to options such as `nsSeparator` and `keySeparator`
4. Use [`fast-check`](https://github.com/dubzzz/fast-check) to make the test suite more robust
   - That way we get all the bugs out of the way _before_ publishing, rather than having to fix bugs for users over time
5. Add GitHub Actions to CI/CD pipeline to handle:
   1. package publishing 
   2. build artifacts for ESM/CJS
6. Add support for `react-i18next`
7. Add support for making translations "zero-cost"
   - Propose adding a configuration option that opts out of _all_ type-level transformations when using the selector API
   - Publish a [Vite plugin](https://vite.dev/guide/api-plugin) that creates a copy of user translations on build, which
    would users to pre-compile translations into the format TypeScript expects
   - Doing this would allow `i18next` to support translations for TypeScript users at any scale, and would bring allocations
    down to almost zero


Hi ChatGPT,

I'd like to make another update.

Currently, users are able to provide an array of keys. We need the codemod to be able to handle these cases by creating nested calls to the `t` function in the `defaultValue` option when a user passes an array of keys.

Here's an example with 1 key:

```typescript
//  before:
import { t } from 'i18next'
t(['abc.def'])

//  after:
import { t } from 'i18next'
t($ => $.abc.def)
```

Here's an example with 2 keys:

```typescript
//  before:
import { t } from 'i18next'
t(['abc.def', 'ghi.jkl'])

//  after:
import { t } from 'i18next'
t($ => $.abc.def, { defaultValue: t($ => $.ghi.jkl) })
```

Here's an example with 3 keys:

```typescript
//  before:
import { t } from 'i18next'
t(['abc.def', 'ghi.jkl', 'mno.pqr'])

//  after:
import { t } from 'i18next'
t($ => $.abc.def, { defaultValue: t($ => $.ghi.jkl, { defaultValue: t($ => $.mno.pqr) }) })
```

If any path includes a namespace (separated by a colon), the namespace portion of the path should still be moved to that selector's options object, under that 'ns' key.

Here's an example with 1 key:

```typescript
//  before:
import { t } from 'i18next'
t(['ns1:abc.def'])

//  after:
import { t } from 'i18next'
t($ => $.abc.def, { ns: 'ns1' })
```

Here's an example with 2 keys:

```typescript
//  before:
import { t } from 'i18next'
t(['ns1:abc.def', 'ns2:ghi.jkl'])

//  after:
import { t } from 'i18next'
t($ => $.abc.def, { ns: 'ns1', defaultValue: t($ => $.ghi.jkl, { ns: 'ns2' }) })
```

Here's an example with 3 keys, where only 2 of the keys have namespaces:

```typescript
//  before:
import { t } from 'i18next'
t(['ns1:abc.def', 'ghi.jkl', 'ns2:mno.pqr'])

//  after:
import { t } from 'i18next'
t($ => $.abc.def, { ns: 'ns1', defaultValue: t($ => $.ghi.jkl, defaultValue: t($ => $.mno.pqr, { ns: 'ns2' })) })
```

If the user provided an array of keys _and_ a default value, the default value should be moved to the options object of the last selector's options object, like this:

```typescript
//  before:
import { t } from 'i18next'
t(['abc.def', 'ghi.jkl'], { defaultValue: 'some default value' })

//  after:
import { t } from 'i18next'
t($ => $.abc.def, { defaultValue: t($ => $.ghi.jkl, { defaultValue: 'some default value' }) })
```

Here's an example with everything mixed together:

```typescript
//  before:
import { t } from 'i18next'
t(['ns1:abc.def', 'ghi.jkl', 'ns2:mno.pqr'], { defaultValue: 'some default value' })

//  after:
import { t } from 'i18next'
t($ => $.abc.def, { ns: 'ns1', defaultValue: t($ => $.ghi.jkl, { defaultValue: t($ => $.mno.pqr, { ns: 'ns2', defaultValue: 'some default value' }) }) })
```
