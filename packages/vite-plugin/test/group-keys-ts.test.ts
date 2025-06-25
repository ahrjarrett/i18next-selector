import * as vi from 'vitest'
import { groupTypeScriptPluralKeys } from '@i18next-selector/vite-plugin'

vi.describe('〖⛳️〗‹‹‹ ❲@i18next-selector/vite-plugin❳', () => {
  vi.it('〖⛳️〗› ❲groupTypeScriptPluralKeys❳', () => {
    vi.expect(groupTypeScriptPluralKeys([], {})).toMatchInlineSnapshot
      (`{}`)
  })
})
