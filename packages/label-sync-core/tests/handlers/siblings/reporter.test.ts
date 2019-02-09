import {
  SiblingSyncReport,
  createTerminalReport,
} from '../../../src/handlers/siblings'

describe('sibling sync reporter', () => {
  test('generates correct empty report', async () => {
    const report: SiblingSyncReport = {
      options: { dryRun: true },
      repository: {
        name: 'label-sync',
        owner: {
          login: 'maticzav',
        },
        full_name: 'maticzav/label-sync',
      },
      issues: [],
      manifest: {
        'bug/no-reproduction': {
          label: {
            color: 'f266f4',
            default: false,
            description: '',
            name: 'bug/no-reproduction',
          },
          siblings: ['kind/bug', 'good-first-issue'],
        },
        'kind/bug': {
          label: {
            color: '333333',
            default: false,
            description: '',
            name: 'kind/bug',
          },
          siblings: ['bug/no-reproduction'],
        },
        'good-first-issue': {
          label: {
            color: '333333',
            default: false,
            description: '',
            name: 'good-first-issue',
          },
          siblings: [],
        },
      },
    }

    expect(createTerminalReport(report)).toMatchSnapshot()
  })

  test('correctly generates report', async () => {
    const report: SiblingSyncReport = {
      options: { dryRun: false },
      repository: {
        name: 'label-sync',
        owner: {
          login: 'maticzav',
        },
        full_name: 'maticzav/label-sync',
      },
      issues: [
        {
          issue: {
            body: 'Not so serious issue.',
            id: 1123,
            labels: [
              {
                color: '333333',
                default: false,
                description: '',
                name: 'bug/no-reproduction',
              },
            ],
            number: 5,
            state: '',
            title: 'Another Issue Title',
          },
          siblings: [
            {
              color: 'f266f4',
              default: false,
              description: '',
              name: 'basic',
            },
            {
              color: '333333',
              default: false,
              description: '',
              name: 'kind/bug',
            },
          ],
        },
      ],
      manifest: {
        'bug/no-reproduction': {
          label: {
            color: 'f266f4',
            default: false,
            description: '',
            name: 'bug/no-reproduction',
          },
          siblings: ['kind/bug', 'good-first-issue'],
        },
        'kind/bug': {
          label: {
            color: '333333',
            default: false,
            description: '',
            name: 'kind/bug',
          },
          siblings: ['bug/no-reproduction'],
        },
        'good-first-issue': {
          label: {
            color: '333333',
            default: false,
            description: '',
            name: 'good-first-issue',
          },
          siblings: [],
        },
      },
    }

    expect(createTerminalReport(report)).toMatchSnapshot()
  })
})
