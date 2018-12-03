import { handleRepository } from '../handlers'
import * as labels from '../labels'

describe('Repository handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    delete process.env.GITHUB_TOKEN
  })

  test('handles the repository correctly', async () => {
    // Set ENVVAR
    process.env.GITHUB_TOKEN = 'token'

    /**
     * Mocks
     */
    const getRepositoryFromNameMock = jest.spyOn(
      labels,
      'getRepositoryFromName',
    )
    const getRepositoryLabelsMock = jest
      .spyOn(labels, 'getRepostioryLabels')
      .mockResolvedValue([])
    const getLabelsDiffMock = jest
      .spyOn(labels, 'getLabelsDiff')
      .mockReturnValue({
        add: [
          {
            name: 'label-add',
            description: '',
            color: 'label-color',
            default: false,
          },
        ],
        update: [
          {
            name: 'label-update',
            description: '',
            color: 'label-color',
            default: false,
          },
        ],
        remove: [
          {
            name: 'label-remove',
            description: '',
            color: 'label-color',
            default: false,
          },
        ],
      })
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

    const res = await handleRepository({} as any, 'prisma/github-labels', {
      labels: {
        test: {
          description: 'Testing sync.',
          color: '#123456',
        },
      },
    })

    /**
     * Tests
     */

    expect(getRepositoryFromNameMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryLabelsMock).toHaveBeenCalledTimes(1)
    expect(getLabelsDiffMock).toHaveBeenCalledTimes(1)
    expect(addLabelsToRepositoryMock).toHaveBeenCalledTimes(1)
    expect(updateLabelsInRepositoryMock).toHaveBeenCalledTimes(1)
    expect(removeLabelsFromRepositoryMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual({
      name: 'prisma/github-labels',
      configuration: {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
      },
      additions: [],
      updates: [],
      removals: [],
    })

    /**
     * Clearings
     */

    getRepositoryFromNameMock.mockRestore()
    getRepositoryLabelsMock.mockRestore()
    getLabelsDiffMock.mockRestore()
    addLabelsToRepositoryMock.mockRestore()
    updateLabelsInRepositoryMock.mockRestore()
    removeLabelsFromRepositoryMock.mockRestore()
  })

  test('throws on wrong repository name', async () => {
    const res = handleRepository({} as any, 'github-labels', {
      labels: {
        test: {
          description: 'Testing sync.',
          color: '#123456',
        },
      },
    })

    await expect(res).rejects.toThrow(
      'Cannot decode the provided repository name github-labels',
    )
  })
})
