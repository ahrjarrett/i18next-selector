import * as vi from 'vitest'
import * as path from 'node:path'
import * as fs from 'node:fs'

import {
  groupPluralKeys,
  parse,
  transformToJson,
  transformToTypeScript,
  writeFromSource,
} from '@i18next-selector/vite-plugin'

const defaultOptions = { contextSeparator: '_', pluralSeparator: '_' }

const DIR_PATH = path.join(path.resolve(), 'packages', 'vite-plugin', 'test', '__generated__')

const PATH = {
  targetFile: path.join(DIR_PATH, 'writeFromSource.get.ts')
}

const input = {
  beverage: 'beverage',
  'beverage|beer': 'beer',
  tea_one: 'a cuppa tea and a lie down',
  tea_other: '{{count}} cups of tea and a big sleep',
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
      'espresso|cappuccino_other': '{{count}} dry cappuccinos',
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
      (`"{ "beverage": "beverage","beverage|beer": "beer","tea": "a cuppa tea and a lie down" | "{{count}} cups of tea and a big sleep","dessert|cake": "a nice cake","dessert|muffin": "a nice muffin" | "{{count}} nice muffins","coffee": { "drip": { "black": "a strong cup of black coffee" },"bar": { "shot": "a shot of espresso","espresso|americano": "a hot americano","espresso|latte": "a foamy latte" | "{{count}} foamy lattes","espresso|cappuccino": "a dry cappuccino" | "{{count}} dry cappuccinos" } },"sodas": { "coca_cola": { "coke": "a can of coke","coke|diet": "a can of diet coke" | "{{count}} cans of diet coke" },"faygo": { "purple": "purple faygo","orange": "one orange faygo" | "{{count}} orange faygo" } },"interpolation": { "val": "Interpolated {{val}}" },"array": ["element one",{ "elementTwo": "element two" },{ "elementThree": [{ "nestedElementThree": "element three" }] }] }"`)

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
            "espresso|cappuccino": ""a dry cappuccino" | "{{count}} dry cappuccinos"",
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
        "tea": ""a cuppa tea and a lie down" | "{{count}} cups of tea and a big sleep"",
      }
    `)
  })

  vi.it('〖⛳️〗› ❲transformToTypeScript❳', () => {
    vi.expect(transformToTypeScript(input, defaultOptions)).toMatchInlineSnapshot
      (`
      "export declare const resources: {
        beverage: "beverage";
        "beverage|beer": "beer";
        tea: "a cuppa tea and a lie down" | "{{count}} cups of tea and a big sleep";
        "dessert|cake": "a nice cake";
        "dessert|muffin": "a nice muffin" | "{{count}} nice muffins";
        coffee: {
          drip: { black: "a strong cup of black coffee" };
          bar: {
            shot: "a shot of espresso";
            "espresso|americano": "a hot americano";
            "espresso|latte": "a foamy latte" | "{{count}} foamy lattes";
            "espresso|cappuccino": "a dry cappuccino" | "{{count}} dry cappuccinos";
          };
        };
        sodas: {
          coca_cola: {
            coke: "a can of coke";
            "coke|diet": "a can of diet coke" | "{{count}} cans of diet coke";
          };
          faygo: {
            purple: "purple faygo";
            orange: "one orange faygo" | "{{count}} orange faygo";
          };
        };
        interpolation: { val: "Interpolated {{val}}" };
        array: [
          "element one",
          { elementTwo: "element two" },
          { elementThree: [{ nestedElementThree: "element three" }] },
        ];
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
})
