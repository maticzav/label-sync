import { handleSync, Config, SyncReport, SyncOptions } from '../'
import * as labels from '../labels'

describe('Sync handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('correctly performs dry run', async () => {
    /**
     * Mocks
     */
    const getRepositoriesFromConfigurationMock = jest.spyOn(
      labels,
      'getRepositoriesFromConfiguration',
    )
    const getRepositoryFromNameMock = jest.spyOn(
      labels,
      'getRepositoryFromName',
    )
    const getRepositoryLabelsMock = jest
      .spyOn(labels, 'getRepostioryLabels')
      .mockResolvedValue([])
    const getLabelsDiffMock = jest.spyOn(labels, 'getLabelsDiff')
    const addLabelsToRepositoryMock = jest.spyOn(
      labels,
      'addLabelsToRepository',
    )

    const updateLabelsInRepositoryMock = jest.spyOn(
      labels,
      'updateLabelsInRepository',
    )

    const removeLabelsFromRepositoryMock = jest.spyOn(
      labels,
      'removeLabelsFromRepository',
    )

    /**
     * Execution
     */
    const configuration: Config = {
      'prisma/github-labels': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
      },
      'prisma/prisma-binding': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
        strict: true,
      },
      'wrong-name': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
      },
    }

    const options: SyncOptions = {
      githubToken: 'token',
      dryRun: true,
    }

    const res = await handleSync(configuration, options)

    /**
     * Tests
     */

    expect(getRepositoriesFromConfigurationMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryFromNameMock).toHaveBeenCalledTimes(3)
    expect(getRepositoryLabelsMock).toHaveBeenCalledTimes(2)
    expect(getLabelsDiffMock).toHaveBeenCalledTimes(2)
    expect(addLabelsToRepositoryMock).toHaveBeenCalledTimes(0)
    expect(updateLabelsInRepositoryMock).toHaveBeenCalledTimes(0)
    expect(removeLabelsFromRepositoryMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual({
      config: configuration,
      options: options,
      successes: [
        {
          name: 'prisma/github-labels',
          config: {
            labels: {
              test: {
                color: '#123456',
                description: 'Testing sync.',
              },
            },
            strict: false,
          },
          additions: [
            {
              color: '#123456',
              default: false,
              description: 'Testing sync.',
              name: 'test',
            },
          ],
          removals: [],
          updates: [],
        },
        {
          name: 'prisma/prisma-binding',
          config: {
            labels: {
              test: {
                color: '#123456',
                description: 'Testing sync.',
              },
            },
            strict: true,
          },
          additions: [
            {
              color: '#123456',
              default: false,
              description: 'Testing sync.',
              name: 'test',
            },
          ],
          removals: [],
          updates: [],
        },
      ],
      errors: [
        {
          config: {
            labels: {
              test: {
                color: '#123456',
                description: 'Testing sync.',
              },
            },
            strict: false,
          },
          message: 'Cannot decode the provided repository name wrong-name',
          name: 'wrong-name',
        },
      ],
    } as SyncReport)

    /**
     * Clearings
     */

    getRepositoriesFromConfigurationMock.mockRestore()
    getRepositoryFromNameMock.mockRestore()
    getRepositoryLabelsMock.mockRestore()
    getLabelsDiffMock.mockRestore()
    addLabelsToRepositoryMock.mockRestore()
    updateLabelsInRepositoryMock.mockRestore()
    removeLabelsFromRepositoryMock.mockRestore()
  })

  test('correctly handles sync', async () => {
    /**
     * Mocks
     */
    const getRepositoriesFromConfigurationMock = jest.spyOn(
      labels,
      'getRepositoriesFromConfiguration',
    )
    const getRepositoryFromNameMock = jest.spyOn(
      labels,
      'getRepositoryFromName',
    )
    const getRepositoryLabelsMock = jest
      .spyOn(labels, 'getRepostioryLabels')
      .mockResolvedValue([])
    const getLabelsDiffMock = jest.spyOn(labels, 'getLabelsDiff')
    const addLabelsToRepositoryMock = jest
      .spyOn(labels, 'addLabelsToRepository')
      .mockResolvedValue([])
    const updateLabelsInRepositoryMock = jest
      .spyOn(labels, 'updateLabelsInRepository')
      .mockResolvedValue([])
    const removeLabelsFromRepositoryMock = jest
      .spyOn(labels, 'removeLabelsFromRepository')
      .mockResolvedValue([])

    /**
     * Execution
     */
    const configuration: Config = {
      'prisma/github-labels': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
      },
      'prisma/prisma-binding': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
        strict: true,
      },
      'wrong-name': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
      },
    }

    const options: SyncOptions = {
      githubToken: 'token',
      dryRun: false,
    }

    const res = await handleSync(configuration, options)

    /**
     * Tests
     */

    expect(getRepositoriesFromConfigurationMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryFromNameMock).toHaveBeenCalledTimes(3)
    expect(getRepositoryLabelsMock).toHaveBeenCalledTimes(2)
    expect(getLabelsDiffMock).toHaveBeenCalledTimes(2)
    expect(addLabelsToRepositoryMock).toHaveBeenCalledTimes(2)
    expect(updateLabelsInRepositoryMock).toHaveBeenCalledTimes(2)
    expect(removeLabelsFromRepositoryMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual({
      config: configuration,
      options: options,
      successes: [
        {
          name: 'prisma/github-labels',
          config: {
            labels: {
              test: {
                color: '#123456',
                description: 'Testing sync.',
              },
            },
            strict: false,
          },
          additions: [],
          removals: [],
          updates: [],
        },
        {
          name: 'prisma/prisma-binding',
          config: {
            labels: {
              test: {
                color: '#123456',
                description: 'Testing sync.',
              },
            },
            strict: true,
          },
          additions: [],
          removals: [],
          updates: [],
        },
      ],
      errors: [
        {
          config: {
            labels: {
              test: {
                color: '#123456',
                description: 'Testing sync.',
              },
            },
            strict: false,
          },
          message: 'Cannot decode the provided repository name wrong-name',
          name: 'wrong-name',
        },
      ],
    } as SyncReport)

    /**
     * Clearings
     */

    getRepositoriesFromConfigurationMock.mockRestore()
    getRepositoryFromNameMock.mockRestore()
    getRepositoryLabelsMock.mockRestore()
    getLabelsDiffMock.mockRestore()
    addLabelsToRepositoryMock.mockRestore()
    updateLabelsInRepositoryMock.mockRestore()
    removeLabelsFromRepositoryMock.mockRestore()
  })

  test('correctly reports non-strict repositories with deletions', async () => {
    /**
     * Mocks
     */
    const getRepositoriesFromConfigurationMock = jest.spyOn(
      labels,
      'getRepositoriesFromConfiguration',
    )
    const getRepositoryFromNameMock = jest.spyOn(
      labels,
      'getRepositoryFromName',
    )
    const getRepositoryLabelsMock = jest
      .spyOn(labels, 'getRepostioryLabels')
      .mockResolvedValue([
        {
          name: 'label-name',
          description: '',
          color: 'label-color',
          default: false,
        },
      ])
    const getLabelsDiffMock = jest.spyOn(labels, 'getLabelsDiff')
    const addLabelsToRepositoryMock = jest
      .spyOn(labels, 'addLabelsToRepository')
      .mockResolvedValue([])
    const updateLabelsInRepositoryMock = jest
      .spyOn(labels, 'updateLabelsInRepository')
      .mockResolvedValue([])
    const removeLabelsFromRepositoryMock = jest
      .spyOn(labels, 'removeLabelsFromRepository')
      .mockResolvedValue([])

    /**
     * Execution
     */
    const configuration: Config = {
      'prisma/github-labels': {
        labels: {},
      },
    }

    const options: SyncOptions = {
      githubToken: 'token',
      dryRun: false,
    }

    const res = await handleSync(configuration, options)

    /**
     * Tests
     */

    expect(getRepositoriesFromConfigurationMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryFromNameMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryLabelsMock).toHaveBeenCalledTimes(1)
    expect(getLabelsDiffMock).toHaveBeenCalledTimes(1)
    expect(addLabelsToRepositoryMock).toHaveBeenCalledTimes(1)
    expect(updateLabelsInRepositoryMock).toHaveBeenCalledTimes(1)
    expect(removeLabelsFromRepositoryMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual({
      config: configuration,
      options: options,
      successes: [
        {
          name: 'prisma/github-labels',
          config: {
            labels: {},
            strict: false,
          },
          additions: [],
          removals: [
            {
              name: 'label-name',
              description: '',
              color: 'label-color',
              default: false,
            },
          ],
          updates: [],
        },
      ],
      errors: [],
    } as SyncReport)

    /**
     * Clearings
     */

    getRepositoriesFromConfigurationMock.mockRestore()
    getRepositoryFromNameMock.mockRestore()
    getRepositoryLabelsMock.mockRestore()
    getLabelsDiffMock.mockRestore()
    addLabelsToRepositoryMock.mockRestore()
    updateLabelsInRepositoryMock.mockRestore()
    removeLabelsFromRepositoryMock.mockRestore()
  })

  test('correctly handles errors in repository sync', async () => {
    /**
     * Mocks
     */
    const getRepositoriesFromConfigurationMock = jest.spyOn(
      labels,
      'getRepositoriesFromConfiguration',
    )
    const getRepositoryFromNameMock = jest.spyOn(
      labels,
      'getRepositoryFromName',
    )
    const getRepositoryLabelsMock = jest
      .spyOn(labels, 'getRepostioryLabels')
      .mockResolvedValue([])
    const getLabelsDiffMock = jest.spyOn(labels, 'getLabelsDiff')
    const addLabelsToRepositoryMock = jest
      .spyOn(labels, 'addLabelsToRepository')
      .mockImplementation(() => {
        throw new Error('pass-error')
      })
    const updateLabelsInRepositoryMock = jest
      .spyOn(labels, 'updateLabelsInRepository')
      .mockImplementation(labels => Promise.resolve(labels))
    const removeLabelsFromRepositoryMock = jest
      .spyOn(labels, 'removeLabelsFromRepository')
      .mockImplementation(labels => Promise.resolve(labels))

    /**
     * Execution
     */
    const configuration: Config = {
      'prisma/github-labels': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
      },
      'prisma/prisma-binding': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
        strict: true,
      },
      'wrong-name': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
      },
    }

    const options: SyncOptions = {
      githubToken: 'token',
      dryRun: false,
    }

    const res = await handleSync(configuration, options)

    /**
     * Tests
     */

    expect(getRepositoriesFromConfigurationMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryFromNameMock).toHaveBeenCalledTimes(3)
    expect(getRepositoryLabelsMock).toHaveBeenCalledTimes(2)
    expect(getLabelsDiffMock).toHaveBeenCalledTimes(2)
    expect(addLabelsToRepositoryMock).toHaveBeenCalledTimes(2)
    expect(updateLabelsInRepositoryMock).toHaveBeenCalledTimes(0)
    expect(removeLabelsFromRepositoryMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual({
      config: configuration,
      options: options,
      successes: [],
      errors: [
        {
          name: 'prisma/github-labels',
          config: {
            labels: {
              test: {
                color: '#123456',
                description: 'Testing sync.',
              },
            },
            strict: false,
          },
          message: 'pass-error',
        },
        {
          name: 'prisma/prisma-binding',
          config: {
            labels: {
              test: {
                color: '#123456',
                description: 'Testing sync.',
              },
            },
            strict: true,
          },
          message: 'pass-error',
        },
        {
          config: {
            labels: {
              test: {
                color: '#123456',
                description: 'Testing sync.',
              },
            },
            strict: false,
          },
          message: 'Cannot decode the provided repository name wrong-name',
          name: 'wrong-name',
        },
      ],
    } as SyncReport)

    /**
     * Clearings
     */

    getRepositoriesFromConfigurationMock.mockRestore()
    getRepositoryFromNameMock.mockRestore()
    getRepositoryLabelsMock.mockRestore()
    getLabelsDiffMock.mockRestore()
    addLabelsToRepositoryMock.mockRestore()
    updateLabelsInRepositoryMock.mockRestore()
    removeLabelsFromRepositoryMock.mockRestore()
  })
})
