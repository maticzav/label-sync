import * as config from '../config'

describe('Configuration function', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  /**
   * getRepositoriesFromConfiguration
   */

  test('getRepositoriesFromConfiguration finds configuration', async () => {
    expect(
      config.getRepositoriesFromConfiguration({
        'prisma/github-labels': {
          labels: {
            test: {
              description: 'Testing sync.',
              color: '#123456',
            },
          },
        },
      }),
    ).toEqual([
      {
        name: 'prisma/github-labels',
        config: {
          labels: {
            test: {
              description: 'Testing sync.',
              color: '#123456',
            },
          },
          strict: false,
        },
      },
    ])
  })

  /**
   * getGithubLabelsFromRepositoryConfig
   */
  test('getGithubLabelsFromRepositoryConfig hydrates the labels correctly', async () => {
    expect(
      config.getGithubLabelsFromRepositoryConfig({
        strict: true,
        labels: {
          'label-name': 'label-color',
          'label-advanced': {
            description: 'label-advanced-description',
            color: 'label-advanced-color',
          },
        },
      }),
    ).toEqual([
      {
        name: 'label-name',
        description: '',
        color: 'label-color',
        default: false,
      },
      {
        name: 'label-advanced',
        description: 'label-advanced-description',
        color: 'label-advanced-color',
        default: false,
      },
    ])
  })
})
