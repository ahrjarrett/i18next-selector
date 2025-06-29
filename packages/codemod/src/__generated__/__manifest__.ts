export default {
  "name": "@i18next-selector/codemod",
  "type": "module",
  "version": "0.0.10",
  "private": false,
  "description": "",
  "license": "MIT",
  "bin": {
    "i18next-selector-codemod": "./src/bin.ts"
  },
  "@i18next-selector": {
    "generateExports": {
      "include": ["**/*.ts"]
    },
    "generateIndex": {
      "include": ["**/*.ts"]
    }
  },
  "publishConfig": {
    "access": "public",
    "directory": "dist",
    "registry": "https://registry.npmjs.org"
  },
  "scripts": {
    "bench": "echo NOTHING TO BENCH",
    "build": "pnpm build:esm && pnpm build:cjs && pnpm build:annotate",
    "build:annotate": "babel build --plugins annotate-pure-calls --out-dir build --source-maps",
    "build:esm": "tsc -b tsconfig.build.json",
    "build:cjs": "babel build/esm --plugins @babel/transform-export-namespace-from --plugins @babel/transform-modules-commonjs --out-dir build/cjs --source-maps",
    "build:dist": "chmod +x dist/dist/cjs/bin.js",
    "check": "tsc -b tsconfig.json",
    "clean": "pnpm run \"/^clean:.*/\"",
    "clean:build": "rm -rf .tsbuildinfo dist build",
    "clean:deps": "rm -rf node_modules",
    "test": "vitest"
  },
  "devDependencies": {
    "@prettier/sync": "^0.5.5",
    "@types/jscodeshift": "^17.3.0",
    "ast-types": "0.16.1"
  },
  "dependencies": {
    "@effect/cli": "^0.66.1",
    "@effect/platform": "^0.87.1",
    "@effect/platform-node": "^0.88.3",
    "@effect/printer": "^0.44.10",
    "@effect/printer-ansi": "^0.44.10",
    "@effect/schema": "^0.75.5",
    "@effect/typeclass": "^0.35.10",
    "effect": "^3.16.10",
    "jscodeshift": "^17.3.0"
  }
} as const