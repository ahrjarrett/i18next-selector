# @i18next-selector/vite-plugin

This plugin exists to help simplify the migration to using the i18next [selector API](https://github.com/i18next/i18next/pull/2322) for TypeScript users.

## What it does

`@i18next-selector/vite-plugin` exists for users with large translation sets who want to use `i18next`'s `enableSelector` option in `"optimize"` mode.

With `enableSelector: "optimize"`, you reduce the number of allocations the TypeScript compiler needs to create by ~1,700x. 

That means you will never have to worry about IDE sluggishness or running into OOM issues in your CI/CD pipeline again.

But if you're using `i18next` to handle pluralization for you, with `"optimize"`, you'll still need to manually choose the appropriate pluralization.

This is annoying and error prone, so `@i18next-selector/vite-plugin` takes care of generating the appropriate pluralization keys for you.

## Demo

- `.ts` files

![i18next-selector-vite-plugin TS demo](https://github.com/ahrjarrett/i18next-selector/blob/main/bin/assets/i18next-selector-vite-plugin-ts.gif)

- `.json` files

![i18next-selector-vite-plugin JSON demo](https://github.com/ahrjarrett/i18next-selector/blob/main/bin/assets/i18next-selector-vite-plugin-json.gif)

## Installation

npm users:

```shell
$ npm i -D @i18next-selector/vite-plugin
```

yarn users:

```shell
$ yarn add -D @i18next-selector/vite-plugin
```

pnpm users:

```shell
$ pnpm add -D @i18next-selector/vite-plugin
```

## Usage

In your vite config file, import the `i18nextVitePlugin` from `"@i18next-selector/vite-plugin"`.

Add a new entry to your `config.plugins` array, and call `i18nextVitePlugin` with your configuration.
The plugin will automatically read your locales from `sourceDir`, and generate the corresponding `.d.ts`
files in the same directory.

The plugin works with hot module reloading, so you can edit your translations and see them update
in real-time, without having to reload your browser tab.

### Example Configuration

```typescript
// vite.config.ts
import type { UserConfig } from 'vite'
import { i18nextVitePlugin } from "@i18next-selector/vite-plugin"

export default {
  plugins: [
    i18nextVitePlugin({
      // required:
      sourceDir: Locales.sourceDir,
      // optional:
      formatCmd: "yarn format:write" 
      silent: true, // default: false
    })
  ]
} satisfies UserConfig
```
