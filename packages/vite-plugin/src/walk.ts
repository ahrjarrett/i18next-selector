import * as fs from 'node:fs'
import * as path from 'node:path'

export function walk(rootPath: string, options?: walk.Options): string[]
export function walk(
  rootPath: string, {
    ignorePaths = walk.defaults.ignorePaths,
    match = walk.defaults.match,
  }: walk.Options = walk.defaults
): readonly string[] {
  const go
    : (parentPath: string, acc: readonly string[]) => readonly string[]
    = (parentPath, acc) => fs
      .readdirSync(parentPath, { withFileTypes: true })
      .flatMap((dirent) => {
        const absolutePath = path.join(parentPath, dirent.name)
        switch (true) {
          case ignorePaths.some((pattern) => absolutePath.includes(pattern)): return acc
          case dirent.isFile(): return match(absolutePath) ? acc.concat(absolutePath) : acc
          case dirent.isDirectory(): return go(absolutePath, acc)
          case dirent.isSymbolicLink(): return go(absolutePath, acc)
          default: return acc
        }
      })

  return go(rootPath, [])
}

walk.defaults = {
  ignorePaths: [],
  match: () => true,
} satisfies Required<walk.Options>

export declare namespace walk {
  type Options = {
    ignorePaths?: readonly string[]
    match?(filePath: string): boolean
  }
}

// export function walk(rootPath: string, options?: walk.Options): string[]
// export function walk(
//   rootPath: string, {
//     ignorePaths = walk.defaults.ignorePaths,
//     match = walk.defaults.match,
//   }: walk.Options = walk.defaults
// ): readonly string[] {
//   const go
//     : (parentPath: string, acc: readonly string[]) => readonly string[]
//     = (parentPath, acc) => fs
//       .readdirSync(parentPath, { withFileTypes: true })
//       .flatMap((dirent) => {
//         const absolutePath = path.join(parentPath, dirent.name)
//         switch (true) {
//           case ignorePaths.some((pattern) => absolutePath.includes(pattern)): return acc
//           case dirent.isFile(): return match(absolutePath) ? acc.concat(absolutePath) : acc
//           case dirent.isDirectory(): return go(absolutePath, acc)
//           case dirent.isSymbolicLink(): return go(absolutePath, acc)
//           default: return acc
//         }
//       })

//   return go(rootPath, [])
// }

// walk.defaults = {
//   ignorePaths: [],
//   match: () => true,
// } satisfies Required<walk.Options>

// export declare namespace walk {
//   type Options = {
//     ignorePaths?: readonly string[]
//     match?(filePath: string): boolean
//   }
// }