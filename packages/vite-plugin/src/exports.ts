export {
  i18nextVitePlugin,
  tsFileToDeclarationFile,
  jsonFileToDeclarationFile,
} from './plugin.js'
export {
  groupPluralKeys,
  parse,
  stringify,
  transformToJson,
  transformToTypeScript,
} from './transform.js'
export { transformTypeScriptAstToString } from './transform-ts.js'
export { groupTypeScriptPluralKeys } from './group-keys-ts.js'
export {
  writeFromAsyncSource,
  writeFromFile,
  writeFromSource,
} from './write.js'
