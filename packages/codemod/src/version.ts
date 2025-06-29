import pkg from './__generated__/__manifest__.js'
export const VERSION = `${pkg.name}@${pkg.version}` as const
export type VERSION = typeof VERSION

export const PKG_VERSION = pkg.version
export const PKG_NAME = pkg.name
