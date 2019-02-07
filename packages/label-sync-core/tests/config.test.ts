import * as config from '../src/config'

describe('getRepositoriesFromConfiguration', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('finds configuration', async () => {
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
        config: {
          labels: { test: { color: '#123456', description: 'Testing sync.' } },
          strict: false,
        },
        repository: {
          full_name: 'prisma/github-labels',
          name: 'github-labels',
          owner: { login: 'prisma' },
        },
        status: 'ok',
      },
    ])
  })
  test('errors on invalid', async () => {
    expect(
      config.getRepositoriesFromConfiguration({
        'github-labels': {
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
        config: {
          labels: { test: { color: '#123456', description: 'Testing sync.' } },
        },
        message: 'Cannot decode the provided repository name github-labels',
        status: 'err',
      },
    ])
  })
})
