import * as vi from 'vitest'
import pkg from '../package.json' with { type: 'json' }
import { VERSION } from '@i18next-selector/shadow-i18next'

vi.describe('〖⛳️〗‹‹‹ ❲@i18next-selector/shadow-i18next❳', () => {
  vi.it('〖⛳️〗› ❲VERSION❳', () => {
    const expected = `${pkg.name}@${pkg.version}`
    vi.assert.equal(VERSION, expected)
  })
})
