import { LabelSyncReport } from '../../src/handlers/labels'
import { generateHumanReadableReport } from '../../src/language/labels'
import { writeFileSync } from 'fs'

describe('language:', () => {
  test('correctly generates human readable report', () => {
    const reports: LabelSyncReport[] = [
      {
        status: 'Failure',
        owner: 'maticzav',
        repo: 'failure',
        message: `Couldn't make a diff of labels.`,
        config: {
          labels: {
            'bug/0': {
              color: 'ff',
            },
            'bug/1': {
              color: '00',
            },
            'bug/2': {
              color: '33',
            },
          },
          config: {
            removeUnconfiguredLabels: false,
          },
        },
      },
      {
        status: 'Success',
        owner: 'maticzav',
        repo: 'changed',
        additions: [
          {
            name: 'addition/uno',
            color: '#ee263c',
            default: false,
          },
          {
            name: 'addition/due',
            color: '#ee263c',
            default: false,
          },
        ],
        updates: [
          {
            name: 'update/ena',
            color: '#aa123c',
            default: false,
          },
          {
            old_name: 'update/two',
            name: 'update/dva',
            color: '#aa123c',
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
            old_name: 'label/alias',
            name: 'label/new-alias',
            color: '#ee263c',
            default: false,
          },
          {
            old_name: 'label/aliases',
            name: 'label/new-second',
            color: '#ee263c',
            default: false,
          },
        ],
        config: {
          labels: {
            'bug/0': {
              color: 'ff',
            },
            'bug/1': {
              color: '00',
            },
            'bug/2': {
              color: '33',
            },
          },
          config: {
            removeUnconfiguredLabels: true,
          },
        },
      },
      {
        status: 'Success',
        owner: 'maticzav',
        repo: 'changed',
        additions: [
          {
            name: 'addition/uno',
            color: '#ee263c',
            default: false,
          },
          {
            name: 'addition/due',
            color: '#ee263c',
            default: false,
          },
        ],
        updates: [
          {
            name: 'update/ena',
            color: '#aa123c',
            default: false,
          },
          {
            old_name: 'update/two',
            name: 'update/dva',
            color: '#aa123c',
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
        aliases: [],
        config: {
          labels: {
            'bug/0': {
              color: 'ff',
            },
            'bug/1': {
              color: '00',
            },
            'bug/2': {
              color: '33',
            },
          },
          config: {
            removeUnconfiguredLabels: false,
          },
        },
      },
      {
        status: 'Success',
        owner: 'maticzav',
        repo: 'changed',
        additions: [
          {
            name: 'addition/uno',
            color: '#ee263c',
            default: false,
          },
          {
            name: 'addition/due',
            color: '#ee263c',
            default: false,
          },
        ],
        updates: [],
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
        aliases: [],
        config: {
          labels: {
            'bug/0': {
              color: 'ff',
            },
            'bug/1': {
              color: '00',
            },
            'bug/2': {
              color: '33',
            },
          },
          config: {
            removeUnconfiguredLabels: false,
          },
        },
      },
      {
        status: 'Success',
        owner: 'maticzav',
        repo: 'changed',
        additions: [
          {
            name: 'addition/uno',
            color: '#ee263c',
            default: false,
          },
        ],
        updates: [
          {
            name: 'update/ena',
            color: '#aa123c',
            default: false,
          },
        ],
        removals: [
          {
            name: 'removal/one',
            color: '#aa123c',
            default: false,
          },
        ],
        aliases: [
          {
            old_name: 'label/alias',
            name: 'label/new-alias',
            color: '#ee263c',
            default: false,
          },
        ],
        config: {
          labels: {
            'bug/0': {
              color: 'ff',
            },
            'bug/1': {
              color: '00',
            },
            'bug/2': {
              color: '33',
            },
          },
          config: {
            removeUnconfiguredLabels: true,
          },
        },
      },
      {
        status: 'Success',
        owner: 'maticzav',
        repo: 'unchanged',
        additions: [],
        updates: [],
        removals: [],
        aliases: [],
        config: {
          labels: {
            'bug/0': {
              color: 'ff',
            },
          },
          config: {
            removeUnconfiguredLabels: true,
          },
        },
      },
      {
        status: 'Success',
        owner: 'maticzav',
        repo: 'removals',
        additions: [],
        updates: [],
        removals: [
          {
            name: 'bug/3',
            color: '#ee263c',
            default: false,
          },
        ],
        aliases: [],
        config: {
          labels: {
            'bug/0': {
              color: 'ff',
            },
          },
          config: {
            removeUnconfiguredLabels: true,
          },
        },
      },
    ]

    writeFileSync(`${__dirname}/test.md`, generateHumanReadableReport(reports))
    expect(generateHumanReadableReport(reports)).toMatchSnapshot()
  })
})
