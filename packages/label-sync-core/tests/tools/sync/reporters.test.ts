import { generateSyncReport } from '../src/reporters'

describe('Reporters', () => {
  test('correctly build report for organization sync', async () => {
    const report = generateSyncReport({
      config: {},
      options: {
        githubToken: '',
        dryRun: true,
      },
      successes: [
        {
          name: 'github-labels',
          config: {
            labels: {
              test: {
                description: 'description',
                color: '123fff',
              },
              bug: {
                description: 'description',
                color: '123fff',
              },
            },
          },
          additions: [
            {
              name: 'test',
              description: 'description-test',
              color: '123fff',
              default: false,
            },
            {
              name: 'simple',
              description: '',
              color: '123fff',
              default: false,
            },
          ],
          updates: [
            {
              name: 'bug',
              description: 'description',
              color: '123fff',
              default: false,
            },
          ],
          removals: [
            {
              name: 'enchantment',
              description: 'description',
              color: '123fff',
              default: false,
            },
          ],
        },
        {
          name: 'graphql-shield',
          config: {
            strict: true,
            labels: {
              test: {
                description: 'description',
                color: '123fff',
              },
              bug: {
                description: 'description',
                color: '123fff',
              },
            },
          },
          additions: [
            {
              name: 'test',
              description: 'description',
              color: '123fff',
              default: false,
            },
          ],
          updates: [
            {
              name: 'bug',
              description: 'description',
              color: '123fff',
              default: false,
            },
          ],
          removals: [
            {
              name: 'enchantment',
              description: 'description',
              color: '123fff',
              default: false,
            },
          ],
        },
        {
          name: 'github-labels',
          config: {
            labels: {
              test: {
                description: 'description',
                color: '123fff',
              },
              bug: {
                description: 'description',
                color: '123fff',
              },
            },
          },
          additions: [],
          updates: [],
          removals: [],
        },
        {
          name: 'github-labels',
          config: {
            labels: {
              test: {
                description: 'description',
                color: '123fff',
              },
              bug: {
                description: 'description',
                color: '123fff',
              },
            },
          },
          additions: [
            {
              name: 'test',
              description: 'description',
              color: '123fff',
              default: false,
            },
            {
              name: 'test',
              description: 'description',
              color: '123fff',
              default: false,
            },
          ],
          updates: [],
          removals: [],
        },
      ],
      errors: [
        {
          name: 'github-labels',
          config: {
            labels: {
              test: {
                description: 'description',
                color: '123fff',
              },
              bug: {
                description: 'description',
                color: '123fff',
              },
            },
          },
          message: 'Something horrific has occured.',
        },
      ],
    } as SyncReport)

    expect(report).toMatchSnapshot()
  })

  test('correctly builds empty organization sync report', async () => {
    const report = generateSyncReport({
      config: {},
      options: {
        githubToken: '',
        dryRun: true,
      },
      successes: [],
      errors: [],
      configs: [],
    })

    expect(report).toMatchSnapshot()
  })
})
