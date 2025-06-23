<br>
<h1 align="center">@i18next-selector/codemod</h1>
<br>

### Installation

To install the codemod, copy/paste the appropriate install script for your package manager:

```base
// if you use pnpm:
$ pnpm add -D @i18next-selector/codemod

// if you use npm:
$ npm i -D @i18next-selector/codemod

// if you use yarn:
$ yarn add -D @i18next-selector/codemod
```

### Usage

To apply the codemod, `cd` into the directory where your `node_modules` is installed, then copy/modify one of the scripts below.

**Note:** due to a difficulties with getting `jscodeshift` to work with the `bin` field in the library's package.json, you'll need to use the more verbose `node_modules` path below, at least for now.

If you know how to fix this, PRs are welcome! :)

```bash
$ ./node_modules/@i18next-selector/codemod/dist/cjs/bin.js ./src

# if you've configured i18next to use a custom `nsSeparator` or `keySeparator`, pass them as flags:
$ ./node_modules/@i18next-selector/codemod/dist/cjs/bin.js --nsSeparator="::" --keySeparator="..." ./src
```

### Limitations
