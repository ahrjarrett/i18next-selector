export default {
  "name": "shadow-i18next",
  "type": "module",
  "version": "0.0.0",
  "private": true,
  "description": "",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/ahrjarrett/i18next-selector.git",
    "directory": "packages/"
  },
  "bugs": {
    "url": "https://github.com/ahrjarrett/i18next-selector/issues",
    "email": "ahrjarrett@gmail.com"
  },
  "@i18next-selector": {
    "generateExports": { "include": ["**/*.ts"] },
    "generateIndex": { "include": ["**/*.ts"] }
  },
  "publishConfig": { "access": "private" },
  "scripts": {
    "bench": "echo NOTHING TO BENCH",
    "build": "pnpm build:esm && pnpm build:cjs && pnpm build:annotate",
    "build:annotate": "babel build --plugins annotate-pure-calls --out-dir build --source-maps",
    "build:esm": "tsc -b tsconfig.build.json",
    "build:cjs": "babel build/esm --plugins @babel/transform-export-namespace-from --plugins @babel/transform-modules-commonjs --out-dir build/cjs --source-maps",
    "check": "tsc -b tsconfig.json",
    "clean": "pnpm run \"/^clean:.*/\"",
    "clean:build": "rm -rf .tsbuildinfo dist build",
    "clean:deps": "rm -rf node_modules",
    "test": "vitest"
  },
  "peerDependencies": {},
  "devDependencies": {}
} as const