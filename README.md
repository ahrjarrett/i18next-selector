<br>
<h1 align="center">@i18next-selector</h1>
<br>

<p align="center">This repo contains packages that support <a href="https://github.com/i18next/i18next/pull/2322" target="_blank">this PR</a>, which adds a <em>selector API</em> to i18next.</p>

<br>

## Goals

This project provides tools to support users that are going to, or have already, transitioned to `i18next`'s selector API.

- allow `i18next` to support TypeScript users with arbitrarily large translation dictionaries
- make `i18next` more memory-efficient for all TypeScript users, regardless of the size of their translation dictionaries

To accomplish this, we identified the following tasks:

- [x] fix TypeScript performance by "doing less": instead, _use the platform_ and leverage built-in IDE support for auto-completion
- [x] fix OOM (out-of-memory) errors by fixing the number of TS compiler allocations
- [x] improve DX by supporting "go-to definition", allowing users to quickly find, navigate, and troubleshoot their translations
- [x] preserve JSDoc annotations at the call-site, making translations easier to understand and share

## Packages

### [i18next-selector-codemod](https://github.com/ahrjarrett/i18next-selector/tree/main/packages/codemod)

<div>
  <img alt="NPM Version" src="https://img.shields.io/npm/v/i18next-selector-codemod?style=flat-square&logo=npm&label=npm&color=blue">
  &nbsp;
  <img alt="Static Badge" src="https://img.shields.io/badge/license-MIT-a094a2?style=flat-square">
  &nbsp;
  <img alt="npm" src="https://img.shields.io/npm/dt/i18next-selector-codemod?style=flat-square">
  &nbsp;
</div>

The `i18next-selector-codemod` makes migrating to the selector API easy.

To see the full set of transformations it will make on your behalf, check out the [tests](https://github.com/ahrjarrett/@i18next-selector/blob/main/packages/codemod/test/transform.test.ts).

#### Usage

```bash
$ npx i18next-selector-codemod
```

For more detailed usage instructions, refer to the [package README](https://github.com/ahrjarrett/i18next-selector/blob/main/packages/codemod/README.md).

#### Demo

![i18next-selector-codemod demo](https://github.com/ahrjarrett/i18next-selector/blob/main/bin/assets/i18next-selector-codemod.gif)

### [@i18next-selector/vite-plugin](https://github.com/ahrjarrett/i18next-selector/tree/main/packages/vite-plugin)

<div>
  <img alt="NPM Version" src="https://img.shields.io/npm/v/%40i18next-selector%2Fvite-plugin?style=flat-square&logo=npm&label=npm&color=blue">
  &nbsp;
  <img alt="Static Badge" src="https://img.shields.io/badge/license-MIT-a094a2?style=flat-square">
  &nbsp;
  <img alt="npm" src="https://img.shields.io/npm/dt/@i18next-selector/vite-plugin?style=flat-square">
  &nbsp;
</div>

To get the most out of the selector API, we recommend users use the `enableSelector: "optimize"` setting.

`enableSelector: "optimize"` tells `i18next` not to perform any of the fancy key-transformations that make using the library computationally expensive.

However, turning off those transformations makes `i18next` less ergonomic for users that rely heavily on features like [pluralization](https://www.i18next.com/translation-function/plurals).

To fix this, you can use the `@i18next-selector/vite-plugin`, which hooks into Vite's [hot module replacement](https://vite.dev/guide/api-hmr) API to apply the key transformations automatically when translation dictionaries are edited.

#### Usage

To use the plugin, simply configure the plugin to point to the directory where your local translations live.

The plugin will transform any `.json` or `.ts` files into `.d.ts` files, and works with arbitrarily nested dictionaries, and arbitrarily nested directory structure.

#### Demo

- `.ts` files

![i18next-selector-vite-plugin: typescriptdemo](https://github.com/ahrjarrett/i18next-selector/blob/main/bin/assets/i18next-selector-vite-plugin-ts.gif)

- `.json` files

![i18next-selector-vite-plugin: json demo](https://github.com/ahrjarrett/i18next-selector/blob/main/bin/assets/i18next-selector-vite-plugin-json.gif)

- `.yaml` files

![18next-selector-vite-plugin: yaml demo](https://github.com/ahrjarrett/i18next-selector/blob/main/bin/assets/i18next-selector-vite-plugin-yaml.gif)
