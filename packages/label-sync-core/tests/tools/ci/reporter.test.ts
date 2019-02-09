import { SyncReport, createTerminalReport } from '../../../src/tools/ci'

describe('ci sync reporter', () => {
  test('correctly creates a report', async () => {
    const report: SyncReport = {
      config: {
        'maticzav/label-sync': { labels: { basic: '123123' }, strict: false },
        'maticzav/graphql-shield': {
          labels: {
            basic: '234234',
            'kind/bug': {
              color: 'ff0000',
              siblings: ['bug/0-no-reproduction'],
            },
            'bug/0-no-reproduction': {
              color: '00ff00',
              description: 'No reproduction available.',
            },
          },
          strict: false,
        },
      },
      options: { dryRun: false },
      syncs: [
        {
          status: 'success',
          repository: {
            owner: { login: 'maticzav' },
            name: 'label-sync',
            full_name: 'maticzav/label-sync',
          },
          config: { strict: false, labels: { basic: '123123' } },
          manifest: {
            basic: {
              label: {
                name: 'basic',
                color: 'f266f4',
                description: '',
                default: false,
              },
              siblings: [],
            },
            'bug/no-reproduction': {
              label: {
                name: 'bug/no-reproduction',
                color: '333333',
                description: '',
                default: false,
              },
              siblings: [],
            },
            'kind/bug': {
              label: {
                name: 'kind/bug',
                color: '333333',
                description: '',
                default: false,
              },
              siblings: [],
            },
          },
          labels: {
            repository: {
              owner: { login: 'maticzav' },
              name: 'label-sync',
              full_name: 'maticzav/label-sync',
            },
            config: { strict: false, labels: { basic: '123123' } },
            options: { dryRun: false },
            additions: [],
            updates: [
              {
                default: false,
                name: 'basic',
                description: '',
                color: '123123',
              },
            ],
            removals: [
              {
                name: 'bug/no-reproduction',
                color: '333333',
                description: '',
                default: false,
              },
              {
                name: 'kind/bug',
                color: '333333',
                description: '',
                default: false,
              },
            ],
          },
          siblings: {
            repository: {
              owner: { login: 'maticzav' },
              name: 'label-sync',
              full_name: 'maticzav/label-sync',
            },
            manifest: {
              basic: {
                label: {
                  name: 'basic',
                  color: 'f266f4',
                  description: '',
                  default: false,
                },
                siblings: [],
              },
              'bug/no-reproduction': {
                label: {
                  name: 'bug/no-reproduction',
                  color: '333333',
                  description: '',
                  default: false,
                },
                siblings: [],
              },
              'kind/bug': {
                label: {
                  name: 'kind/bug',
                  color: '333333',
                  description: '',
                  default: false,
                },
                siblings: [],
              },
            },
            options: { dryRun: false },
            issues: [
              {
                issue: {
                  id: 1421,
                  title: 'Issue Title',
                  body: 'Very serious issue.',
                  state: '',
                  labels: [
                    {
                      name: 'bug/no-reproduction',
                      color: '333333',
                      description: '',
                      default: false,
                    },
                    {
                      name: 'basic',
                      color: 'f266f4',
                      description: '',
                      default: false,
                    },
                    {
                      name: 'kind/bug',
                      color: '333333',
                      description: '',
                      default: false,
                    },
                  ],
                  number: 1,
                },
                siblings: [],
              },
              {
                issue: {
                  id: 1123,
                  title: 'Another Issue Title',
                  body: 'Not so serious issue.',
                  state: '',
                  labels: [
                    {
                      name: 'bug/no-reproduction',
                      color: '333333',
                      description: '',
                      default: false,
                    },
                    {
                      name: 'basic',
                      color: 'f266f4',
                      description: '',
                      default: false,
                    },
                    {
                      name: 'kind/bug',
                      color: '333333',
                      description: '',
                      default: false,
                    },
                  ],
                  number: 5,
                },
                siblings: [],
              },
            ],
          },
        },
        {
          config: {
            labels: {
              basic: '123123',
              complex: {
                color: '321321',
                siblings: ['doesntexist', 'kind/missing'],
              },
            },
            strict: true,
          },
          message:
            'Error generating manifest: Labels doesntexist, kind/missing are not defined',
          repository: {
            full_name: 'maticzav/label-sync',
            name: 'label-sync',
            owner: { login: 'maticzav' },
          },
          status: 'error',
        },
      ],
      configErrors: [
        {
          message: 'Cannot decode the provided repository name label-sync',
          repository: 'label-sync',
        },
      ],
    }

    expect(createTerminalReport(report)).toMatchSnapshot()
  })

  test('correctly creates an empty report', async () => {
    const report: SyncReport = {
      config: {
        'maticzav/label-sync': { labels: { basic: '123123' }, strict: false },
        'maticzav/graphql-shield': {
          labels: {
            basic: '234234',
            'kind/bug': {
              color: 'ff0000',
              siblings: ['bug/0-no-reproduction'],
            },
            'bug/0-no-reproduction': {
              color: '00ff00',
              description: 'No reproduction available.',
            },
          },
          strict: false,
        },
      },
      options: { dryRun: false },
      syncs: [],
      configErrors: [],
    }

    expect(createTerminalReport(report)).toMatchSnapshot()
  })
})
