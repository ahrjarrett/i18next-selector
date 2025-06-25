export default {
  "name": "@i18next-selector/vite-plugin",
  "type": "module",
  "version": "0.0.3",
  "private": false,
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
    "check": "tsc -b tsconfig.json",
    "clean": "pnpm run \"/^clean:.*/\"",
    "clean:build": "rm -rf .tsbuildinfo dist build",
    "clean:deps": "rm -rf node_modules",
    "test": "vitest"
  },
  "devDependencies": {
    "vite": "^6.3.5"
  },
  "dependencies": {
    "@traversable/json": "^0.0.26",
    "@traversable/registry": "^0.0.25"
  },
  "peerDependencies": {
    "vite": "6 - 7"
  },
  "peerDependenciesMeta": {
    "vite": {
      "optional": false
    }
  }
} as const