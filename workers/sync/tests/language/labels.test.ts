import { LabelSyncReport } from '../../src/handlers/labels'
import { generateHumanReadablePRReport, generateHumanReadableCommitReport } from '../../src/language/labels'

/* Data */
const reportOne: LabelSyncReport[] = [
  /* Success */
  {
    status: 'Success',
    owner: 'maticzav',
    repo: 'success',
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
    config: {
      labels: {}, // not used in report generation
      config: {
        removeUnconfiguredLabels: true,
      },
    },
  },
  /* Failure */
  {
    status: 'Failure',
    owner: 'maticzav',
    repo: 'failure',
    message: `Couldn't make a diff of labels.`,
    config: {
      labels: {}, // not used in report generation
      config: {
        removeUnconfiguredLabels: false,
      },
    },
  },

  /* Unconfigured strict setting suggestion. (no removed labels) */
  {
    status: 'Success',
    owner: 'maticzav',
    repo: 'unconfigured',
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
    config: {
      labels: {}, // not used in report generation
      config: {
        removeUnconfiguredLabels: false,
      },
    },
  },
  /* Unconfigured labels */
  {
    status: 'Success',
    owner: 'maticzav',
    repo: 'unconfigured-nonstrict',
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
    config: {
      labels: {}, // not used in report generation
      config: {
        removeUnconfiguredLabels: false,
      },
    },
  },
]

const reportTwo: LabelSyncReport[] = [
  ...reportOne,
  /* Unchanged */
  {
    status: 'Success',
    owner: 'maticzav',
    repo: 'unchanged',
    additions: [],
    updates: [],
    removals: [],
    aliases: [],
    config: {
      labels: {}, // not used in report generation
      config: {
        removeUnconfiguredLabels: false,
      },
    },
  },
]

/* Tests */

describe('language:', () => {
  for (const report of [reportOne, reportTwo]) {
    test('PR report', () => {
      expect(generateHumanReadablePRReport(report)).toMatchSnapshot()
    })

    test('Commit report', () => {
      expect(generateHumanReadableCommitReport(report)).toMatchSnapshot()
    })
  }
})
