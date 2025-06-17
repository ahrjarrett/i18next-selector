#!/usr/bin/env pnpm dlx tsx
import * as fs from 'node:fs'
import { flow } from 'effect'
import { apply, pipe } from 'effect/Function'
import { Draw, Print, run, tap, topological } from './util.js'
import { PATH, PATTERN, REG_EXP, RELATIVE_PATH } from './constants.js'
import type { SideEffect, Matcher } from './types.js'

const createChartMatcher
  : (chart: string) => Matcher
  = (chart) => ({
    needle: REG_EXP.DependencyGraph,
    replacement: PATTERN.ChartReplacement(chart),
  })

const createChangelogsMatcher
  : (list: string) => Matcher
  = (list) => ({
    needle: REG_EXP.PackageList,
    replacement: PATTERN.ListReplacement(list),
  })

const mapFile
  : (fn: (file: string) => string) => (filepath: string) => SideEffect
  = (fn) => (filepath) => () => pipe(
    fs.readFileSync(filepath).toString('utf8'),
    fn,
    (content) => fs.writeFileSync(filepath, content),
  )

const write
  : (m: Matcher) => (filepath: string) => SideEffect
  = (m) =>
    mapFile(file => file.replace(m.needle, m.replacement))

const writeChart: (chart: string) => SideEffect = flow(
  createChartMatcher,
  write,
  apply(PATH.readme),
)

const writeChangelogs: (list: string) => SideEffect = flow(
  createChangelogsMatcher,
  write,
  apply(PATH.readme),
)
