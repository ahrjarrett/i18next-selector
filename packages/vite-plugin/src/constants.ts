import type { transform } from './utils.js'

export const PLUGIN_HEADER = `[@i18next-selector/vite-plugin]:`

export const defaultOptions = {
  pluralSeparator: '_',
} satisfies transform.Options

export const pluralSuffixes = [
  'zero',
  'one',
  'two',
  'few',
  'many',
  'other',
]
