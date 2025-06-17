# i18next-codemod

This is the jscodeshift codemod that accompanies (this PR)[https://github.com/i18next/i18next/pull/2322], 
which adds a "selector" API to i18next.

The goals of the PR are to:

1. increase IDE performance for TypeScript users with large translation sets
2. decrease the occurence of OOM (out-of-memory) errors when using i18next with tools such as `@typescript-eslint`
3. improve DX by supporting "go-to definition", allowing users to quickly find, navigate, and troubleshoot their translations
4. preserve JSDoc annotations at the call-site, making translations easier to understand and share
