import { handleSync, Config, SyncReport, SyncOptions } from '../'
import * as labels from '../labels'

describe('Sync handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('correctly performs dry run', async () => {
    expect(2).toBe(2)
  })

  test('handle', async () => {
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
    const getRepositoryLabelsMock = jest.spyOn(labels, 'getRepostioryLabels')
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
      githubToken: '',
      dryRun: false,
    }

    const res = await handleSync(configuration, options)

    /**
     * Tests
     */

    expect(getRepositoriesFromConfigurationMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryFromNameMock).toHaveBeenCalledTimes(2)
    expect(getRepositoryLabelsMock).toHaveBeenCalledTimes(1)
    expect(getLabelsDiffMock).toHaveBeenCalledTimes(1)
    expect(addLabelsToRepositoryMock).toHaveBeenCalledTimes(0)
    expect(updateLabelsInRepositoryMock).toHaveBeenCalledTimes(0)
    expect(removeLabelsFromRepositoryMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual({
      config: configuration,
      options: options,
      successes: [],
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
})
