import { main } from '../'

import * as labels from '../labels'
import * as handlers from '../handlers'
import * as reporters from '../reporters'

describe('Main', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    delete process.env.GITHUB_TOKEN
  })

  test('calls correct functions', async () => {
    // Set ENVVAR
    process.env.GITHUB_TOKEN = 'token'

    /**
     * Mocks
     */
    const getRepositoriesFromConfigurationMock = jest
      .spyOn(labels, 'getRepositoriesFromConfiguration')
      .mockReturnValue([
        {
          name: 'prisma/github-labels',
          config: {
            labels: {
              test: {
                description: 'Testing sync.',
                color: '#123456',
              },
            },
          },
        },
        {
          name: 'prisma/graphql-binding',
          config: {
            labels: {
              test: {
                description: 'Testing sync.',
                color: '#123456',
              },
            },
          },
        },
        {
          name: 'prisma/prisma-binding',
          config: {
            labels: {
              test: {
                description: 'Testing sync.',
                color: '#123456',
              },
            },
          },
        },
      ])
    const handleRepositoryMock = jest
      .spyOn(handlers, 'handleRepository')
      .mockResolvedValue({
        name: 'prisma/github-labels',
        configuration: {
          labels: {
            test: {
              description: 'Testing sync.',
              color: '#123456',
            },
          },
          strict: true,
        },
        additions: [],
        updates: [],
        removals: [],
      })
    const generateSyncReportMock = jest
      .spyOn(reporters, 'generateSyncReport')
      .mockReturnValue('pass')

    /**
     * Execution
     */

    const res = await main({} as any)

    /**
     * Tests
     */

    expect(getRepositoriesFromConfigurationMock).toHaveBeenCalledTimes(1)
    expect(handleRepositoryMock).toHaveBeenCalledTimes(3)
    expect(generateSyncReportMock).toHaveBeenCalledTimes(1)
    expect(res).toBe('pass')

    /**
     * Clearings
     */

    getRepositoriesFromConfigurationMock.mockRestore()
    handleRepositoryMock.mockRestore()
    generateSyncReportMock.mockRestore()
  })

  test('throws on missing GITHUB_TOKEN', async () => {
    const res = main({
      'prisma/github-labels': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
      },
    })

    await expect(res).rejects.toThrow('Missing Github configuration!')
  })
})
