import * as vi from 'vitest'
import * as path from 'node:path'
import * as fs from 'node:fs'
import prettier from '@prettier/sync'

import {
  groupPluralKeys,
  parse,
  transformToJson,
  transformToTypeScript,
  writeFromSource,
} from '@i18next-selector/vite-plugin'

const format = (src: string) => prettier.format(src, { parser: 'typescript' })

const defaultOptions = { contextSeparator: '_', pluralSeparator: '_' }

const DIR_PATH = path.join(path.resolve(), 'packages', 'vite-plugin', 'test', '__generated__')

const PATH = {
  targetFile: path.join(DIR_PATH, 'writeFromSource.generated.ts')
}

const input = {
  beverage: 'beverage',
  'beverage|beer': 'beer',
  tea_one: 'a cuppa tea and a lie down',
  tea_two: 'two cups of tea',
  tea_other: '{{count}} cups of tea and a big sleep',
  tea_many: 'many cups of tea',
  'dessert|cake': 'a nice cake',
  'dessert|muffin_one': 'a nice muffin',
  'dessert|muffin_other': '{{count}} nice muffins',
  coffee: {
    drip: {
      black: 'a strong cup of black coffee',
    },
    bar: {
      shot: 'a shot of espresso',
      'espresso|americano': 'a hot americano',
      'espresso|latte_one': 'a foamy latte',
      'espresso|latte_other': '{{count}} foamy lattes',
      'espresso|cappuccino_one': 'a dry cappuccino',
      'espresso|cappuccino_two': 'two dry cappuccinos',
      'espresso|cappuccino_other': '{{count}} dry cappuccinos',
      'espresso|cappuccino_many': 'many dry cappuccinos',
    },
  },
  sodas: {
    coca_cola: {
      coke: 'a can of coke',
      'coke|diet_one': 'a can of diet coke',
      'coke|diet_other': '{{count}} cans of diet coke',
    },
    faygo: {
      purple: 'purple faygo',
      orange_one: 'one orange faygo',
      orange_other: '{{count}} orange faygo',
    },
  },
  interpolation: {
    val: 'Interpolated {{val}}',
  },
  array: [
    'element one',
    {
      elementTwo: 'element two',
    },
    {
      elementThree: [
        {
          nestedElementThree: 'element three',
        },
      ]
    },
  ]
}

vi.describe('〖⛳️〗‹‹‹ ❲@i18next-selector/vite-plugin❳', () => {
  vi.it('〖⛳️〗› ❲groupPluralKeys❳: handles empty case', () => {
    vi.expect(groupPluralKeys([], defaultOptions)).toMatchInlineSnapshot
      (`{}`)
  })

  vi.it('〖⛳️〗› ❲groupPluralKeys❳: leaves unpluralized keys alone', () => {
    vi.expect(
      groupPluralKeys(
        [
          ['tea', 'some tea'],
          ['beverage', 'any beverage'],
        ],
        defaultOptions
      )
    ).toMatchInlineSnapshot
      (`
      {
        "beverage": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Right),
          "right": "any beverage",
        },
        "tea": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Right),
          "right": "some tea",
        },
      }
    `)
  })

  vi.it('〖⛳️〗› ❲groupPluralKeys❳: groups pluralized keys when they share the same unpluralized value', () => {
    vi.expect(
      groupPluralKeys(
        [
          ['tea_one', 'one cup of tea'],
          ['tea_other', '{{count}} cups of tea'],
        ],
        defaultOptions
      )
    ).toMatchInlineSnapshot
      (`
      {
        "tea": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Left),
          "left": [
            "one cup of tea",
            "{{count}} cups of tea",
          ],
        },
      }
    `)
  })


  vi.it('〖⛳️〗› ❲groupPluralKeys❳: leaves entries with non-scalar values alone', () => {
    vi.expect(
      groupPluralKeys(
        [
          ['tea_one', []],
          ['tea_other', {}],
        ],
        defaultOptions
      )
    ).toMatchInlineSnapshot
      (`
      {
        "tea_one": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Right),
          "right": [],
        },
        "tea_other": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Right),
          "right": {},
        },
      }
    `)
  })

  vi.it('〖⛳️〗› ❲groupPluralKeys❳: groups pluralized keys when they share the same unpluralized value', () => {
    vi.expect(
      groupPluralKeys(
        [
          ['soda', 'one cup of tea'],
          ['beverage', '{{count}} cups of tea'],
        ],
        defaultOptions
      )
    ).toMatchInlineSnapshot
      (`
      {
        "beverage": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Right),
          "right": "{{count}} cups of tea",
        },
        "soda": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Right),
          "right": "one cup of tea",
        },
      }
    `)

  })

  vi.it('〖⛳️〗› ❲groupPluralKeys❳: "integration" tests', () => {
    vi.expect(
      groupPluralKeys(
        [

          ['shot', 'a shot of espresso'],
          ['espresso|americano', 'a hot americano'],
          ['espresso|latte_one', 'a foamy latte'],
          ['espresso|latte_other', '{{count}} foamy lattes'],
          ['espresso|cappuccino_one', 'a dry cappuccino'],
          ['espresso|cappuccino_other', '{{count}} dry cappuccinos'],
          ['some object', { a: 'hey', b: 'ho', c: 'let\'s go' }],
        ],
        defaultOptions
      )
    ).toMatchInlineSnapshot
      (`
      {
        "espresso|americano": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Right),
          "right": "a hot americano",
        },
        "espresso|cappuccino": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Left),
          "left": [
            "a dry cappuccino",
            "{{count}} dry cappuccinos",
          ],
        },
        "espresso|latte": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Left),
          "left": [
            "a foamy latte",
            "{{count}} foamy lattes",
          ],
        },
        "shot": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Right),
          "right": "a shot of espresso",
        },
        "some object": {
          "_tag": Symbol(@i18next-selector/vite-plugin/Right),
          "right": {
            "a": "hey",
            "b": "ho",
            "c": "let's go",
          },
        },
      }
    `)
  })

  vi.it('〖⛳️〗› ❲transformToJson❳', () => {

    vi.expect(
      transformToJson(input, defaultOptions)
    ).toMatchInlineSnapshot
      (`"{ "beverage": "beverage","beverage|beer": "beer","tea": "a cuppa tea and a lie down" | "two cups of tea" | "{{count}} cups of tea and a big sleep" | "many cups of tea","dessert|cake": "a nice cake","dessert|muffin": "a nice muffin" | "{{count}} nice muffins","coffee": { "drip": { "black": "a strong cup of black coffee" },"bar": { "shot": "a shot of espresso","espresso|americano": "a hot americano","espresso|latte": "a foamy latte" | "{{count}} foamy lattes","espresso|cappuccino": "a dry cappuccino" | "two dry cappuccinos" | "{{count}} dry cappuccinos" | "many dry cappuccinos" } },"sodas": { "coca_cola": { "coke": "a can of coke","coke|diet": "a can of diet coke" | "{{count}} cans of diet coke" },"faygo": { "purple": "purple faygo","orange": "one orange faygo" | "{{count}} orange faygo" } },"interpolation": { "val": "Interpolated {{val}}" },"array": ["element one",{ "elementTwo": "element two" },{ "elementThree": [{ "nestedElementThree": "element three" }] }] }"`)

  })

  vi.it('〖⛳️〗› ❲parse❳', () => {
    vi.expect(parse(input, defaultOptions)).toMatchInlineSnapshot
      (`
      {
        "array": [
          ""element one"",
          {
            "elementTwo": ""element two"",
          },
          {
            "elementThree": [
              {
                "nestedElementThree": ""element three"",
              },
            ],
          },
        ],
        "beverage": ""beverage"",
        "beverage|beer": ""beer"",
        "coffee": {
          "bar": {
            "espresso|americano": ""a hot americano"",
            "espresso|cappuccino": ""a dry cappuccino" | "two dry cappuccinos" | "{{count}} dry cappuccinos" | "many dry cappuccinos"",
            "espresso|latte": ""a foamy latte" | "{{count}} foamy lattes"",
            "shot": ""a shot of espresso"",
          },
          "drip": {
            "black": ""a strong cup of black coffee"",
          },
        },
        "dessert|cake": ""a nice cake"",
        "dessert|muffin": ""a nice muffin" | "{{count}} nice muffins"",
        "interpolation": {
          "val": ""Interpolated {{val}}"",
        },
        "sodas": {
          "coca_cola": {
            "coke": ""a can of coke"",
            "coke|diet": ""a can of diet coke" | "{{count}} cans of diet coke"",
          },
          "faygo": {
            "orange": ""one orange faygo" | "{{count}} orange faygo"",
            "purple": ""purple faygo"",
          },
        },
        "tea": ""a cuppa tea and a lie down" | "two cups of tea" | "{{count}} cups of tea and a big sleep" | "many cups of tea"",
      }
    `)
  })

  vi.it('〖⛳️〗› ❲transformToTypeScript❳', () => {
    vi.expect(transformToTypeScript(input, defaultOptions)).toMatchInlineSnapshot
      (`"export declare const resources: { "beverage": "beverage","beverage|beer": "beer","tea": "a cuppa tea and a lie down" | "two cups of tea" | "{{count}} cups of tea and a big sleep" | "many cups of tea","dessert|cake": "a nice cake","dessert|muffin": "a nice muffin" | "{{count}} nice muffins","coffee": { "drip": { "black": "a strong cup of black coffee" },"bar": { "shot": "a shot of espresso","espresso|americano": "a hot americano","espresso|latte": "a foamy latte" | "{{count}} foamy lattes","espresso|cappuccino": "a dry cappuccino" | "two dry cappuccinos" | "{{count}} dry cappuccinos" | "many dry cappuccinos" } },"sodas": { "coca_cola": { "coke": "a can of coke","coke|diet": "a can of diet coke" | "{{count}} cans of diet coke" },"faygo": { "purple": "purple faygo","orange": "one orange faygo" | "{{count}} orange faygo" } },"interpolation": { "val": "Interpolated {{val}}" },"array": ["element one",{ "elementTwo": "element two" },{ "elementThree": [{ "nestedElementThree": "element three" }] }] }"`)

    vi.expect.soft(format(
      transformToTypeScript({
        time: 'время',
        since: {
          now: 'прямо сейчас',
          ago: 'назад',
          'seconds##one': '{{count}} секунду',
          'seconds##few': '{{count}} секунды',
          'seconds##many': '{{count}} секунд',
          'minutes##one': '{{count}} минуту',
          'minutes##few': '{{count}} минуты',
          'minutes##many': '{{count}} минут',
          'hours##one': '{{count}} час',
          'hours##few': '{{count}} часа',
          'hours##many': '{{count}} часов',
          'days##one': '{{count}} день',
          'days##few': '{{count}} дня',
          'days##many': '{{count}} дней',
        },
      }, { pluralSeparator: '##' }
      )
    )).toMatchInlineSnapshot
      (`
      "export declare const resources: {
        time: "время";
        since: {
          now: "прямо сейчас";
          ago: "назад";
          seconds: "{{count}} секунду" | "{{count}} секунды" | "{{count}} секунд";
          minutes: "{{count}} минуту" | "{{count}} минуты" | "{{count}} минут";
          hours: "{{count}} час" | "{{count}} часа" | "{{count}} часов";
          days: "{{count}} день" | "{{count}} дня" | "{{count}} дней";
        };
      };
      "
    `)
  })

  vi.it('〖⛳️〗› ❲writeFromSource❳', () => {
    if (!fs.existsSync(DIR_PATH)) fs.mkdirSync(DIR_PATH)

    const write = writeFromSource({
      source: input,
      targetFile: PATH.targetFile,
    })

    write()
  })

  vi.it('〖⛳️〗› ❲transformToTypeScript❳: handles special characters correctly', () => {
    const inputWithSpecialChars = {
      doubleQuotes: 'Hello "world"',
      backslashes: 'Path\\to\\file',
      newlines: 'Line 1\nLine 2',
      unicode: 'Café 🚀 你好',
      mixed: 'Quote "test" with\nnewline and \\backslash',
      'key with "quotes"': 'value with "quotes"',
      'key with\nnewlines': 'value with\nnewlines'
    }

    const result = transformToTypeScript(inputWithSpecialChars, defaultOptions)
    
    // Verify the result is valid TypeScript and properly escaped
    vi.expect(result).toContain('"Hello \\"world\\""')
    vi.expect(result).toContain('"Path\\\\to\\\\file"')
    vi.expect(result).toContain('"Line 1\\nLine 2"')
    vi.expect(result).toContain('"Café 🚀 你好"')
    vi.expect(result).toContain('"Quote \\"test\\" with\\nnewline and \\\\backslash"')
    vi.expect(result).toContain('"key with \\"quotes\\"":')
    vi.expect(result).toContain('"key with\\nnewlines":')
  })

  vi.it('〖⛳️〗› ❲parse❳: handles special characters in values', () => {
    const inputWithSpecialChars = {
      quotes: 'Say "hello"',
      escapes: 'Tab\tand\nnewline'
    }

    const result = parse(inputWithSpecialChars, defaultOptions)
    
    vi.expect(result).toEqual({
      quotes: '"Say \\"hello\\""',
      escapes: '"Tab\\tand\\nnewline"'
    })
  })
})
