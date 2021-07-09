import * as sync from '../src/handlers/sync'
import * as language from '../src/language'

/* Data */
const reportOne: language.GenerateReportParams[] = [
  /* Success */
  {
    repo: 'success',
    changes: {
      additions: [
        {
          name: 'addition/one',
          color: '#ee263c',
          default: false,
        },
        {
          name: 'addition/two',
          color: '#ee263c',
          default: false,
        },
      ],
      updates: [
        {
          old_name: 'update/one',
          name: 'update/ena',
          color: '#FDE8E8',
          default: false,
        },
        {
          old_name: 'update/two',
          name: 'update/dve',
          old_color: '#bbbbbb',
          color: '#FDF6B2',
          default: false,
        },
        {
          old_name: 'update/three',
          name: 'update/tri',
          old_color: '#aa123d',
          color: '#E1EFFE',
          old_description: 'old',
          description: 'new',
          default: false,
        },
      ],
      removals: [
        {
          name: 'removal/one',
          color: '#aa123c',
          default: false,
        },
        {
          name: 'removal/two',
          color: '#aa123c',
          default: false,
        },
      ],
      aliases: [
        {
          old_name: 'label/old-first',
          name: 'label/alias',
          color: '#ee263c',
          default: false,
        },
        {
          old_name: 'label/old-second',
          name: 'label/alias',
          color: '#ee263c',
          default: false,
        },
      ],
    },
    config: {
      removeUnconfiguredLabels: true,
    },
  },
  /* Failure */
  {
    repo: 'failure',
    changes: null,
    config: {
      removeUnconfiguredLabels: false,
    },
  },

  /* Unconfigured strict setting suggestion. (no removed labels) */
  {
    repo: 'unconfigured',
    changes: {
      additions: [
        {
          name: 'addition',
          color: '#ee263c',
          default: false,
        },
      ],
      updates: [],
      removals: [],
      aliases: [],
    },
    config: {
      removeUnconfiguredLabels: false,
    },
  },
  /* Unconfigured labels */
  {
    repo: 'unconfigured-nonstrict',
    changes: {
      additions: [],
      updates: [],
      removals: [
        {
          name: 'unconfigured-one',
          color: '#ee263c',
          default: false,
        },
        {
          name: 'unconfigured-two',
          color: '#ee263c',
          default: false,
        },
      ],
      aliases: [],
    },
    config: {
      removeUnconfiguredLabels: false,
    },
  },
]

const reportTwo: language.GenerateReportParams[] = [
  ...reportOne,
  /* Unchanged */
  {
    repo: 'unchanged',
    changes: {
      additions: [],
      updates: [],
      removals: [],
      aliases: [],
    },
    config: {
      removeUnconfiguredLabels: false,
    },
  },
]

/* Tests */

describe('language', () => {
  test.concurrent.each([[reportOne], [reportTwo]])(
    'report matches snapshot',
    async (report) => {
      expect(language.generateReport(report)).toMatchSnapshot()
    },
  )
})

// MARK: - Utils

/**
 * Converts an object to a map.
 */
function objectToMap<V>(o: { [key: string]: V }): Map<string, V> {
  const map = new Map<string, V>()

  for (const key in o) {
    map.set(key, o[key])
  }

  return map
}
