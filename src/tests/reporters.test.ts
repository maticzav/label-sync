import { generateSyncReport } from '../reporters'

describe('Reporters', () => {
  test('correctly build report for organization sync', async () => {
    const report = generateSyncReport([
      {
        name: 'github-labels',
        configuration: {
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
        name: 'graphql-shield',
        configuration: {
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
        configuration: {
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
    ])

    expect(report).toMatchSnapshot()
  })
})
