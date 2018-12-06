import { generateSyncReport } from '../'
import { SyncReport } from '../handlers'

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
                color: 'color',
              },
              bug: {
                description: 'description',
                color: 'color',
              },
            },
          },
          additions: [
            {
              name: 'test',
              description: 'description-test',
              color: 'color',
              default: false,
            },
          ],
          updates: [
            {
              name: 'bug',
              description: 'description',
              color: 'color',
              default: false,
            },
          ],
          removals: [
            {
              name: 'enchantment',
              description: 'description',
              color: 'color',
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
                color: 'color',
              },
              bug: {
                description: 'description',
                color: 'color',
              },
            },
          },
          additions: [
            {
              name: 'test',
              description: 'description',
              color: 'color',
              default: false,
            },
          ],
          updates: [
            {
              name: 'bug',
              description: 'description',
              color: 'color',
              default: false,
            },
          ],
          removals: [
            {
              name: 'enchantment',
              description: 'description',
              color: 'color',
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
                color: 'color',
              },
              bug: {
                description: 'description',
                color: 'color',
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
                color: 'color',
              },
              bug: {
                description: 'description',
                color: 'color',
              },
            },
          },
          additions: [
            {
              name: 'test',
              description: 'description',
              color: 'color',
              default: false,
            },
            {
              name: 'test',
              description: 'description',
              color: 'color',
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
                color: 'color',
              },
              bug: {
                description: 'description',
                color: 'color',
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
    })

    expect(report).toMatchSnapshot()
  })
})
