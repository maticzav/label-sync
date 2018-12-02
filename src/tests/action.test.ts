import * as path from 'path'
import * as action from '../action'
import * as labels from '../'

describe('Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    delete process.env.GITHUB_TOKEN
    delete process.env.GITHUB_WORKSPACE
    delete process.env.GITHUB_HOME
    delete process.env.GITHUB_REPOSITORY
    delete process.env.GITHUB_EVENT_NAME
    delete process.env.GITHUB_REF
  })

  /**
   * Config check.
   */

  test('throws on missing credentials', async () => {
    await expect(action.main()).rejects.toThrow('Missing Github configuration!')
  })

  test('fails if no configuration found', async () => {
    // Set ENVVAR
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_WORKSPACE = '/not_found'
    process.env.GITHUB_HOME = 'home'
    process.env.GITHUB_REPOSITORY = 'prisma/github-labels'
    process.env.GITHUB_EVENT_NAME = 'event'
    process.env.GITHUB_REF = 'ref'

    await expect(action.main()).rejects.toThrow('No configuration file found!')
  })

  test('fails if repository name malformed', async () => {
    // Set ENVVAR
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_WORKSPACE = path.resolve(__dirname, './__fixtures__/')
    process.env.GITHUB_HOME = 'home'
    process.env.GITHUB_REPOSITORY = 'prisma'
    process.env.GITHUB_EVENT_NAME = 'event'
    process.env.GITHUB_REF = 'ref'

    await expect(action.main()).rejects.toThrow(
      'Cannot decode the provided repository name.',
    )
  })

  /**
   * Labels, Sync
   */
  test('calls correct functions in normal mode', async () => {
    // Set ENVVAR
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_WORKSPACE = 'workspace'
    process.env.GITHUB_HOME = 'home'
    process.env.GITHUB_REPOSITORY = 'prisma/github-labels'
    process.env.GITHUB_EVENT_NAME = 'event'
    process.env.GITHUB_REF = 'ref'

    /**
     * Mocks
     */
    const getGithubLabelsConfigurationMock = jest
      .spyOn(labels, 'getGithubLabelsConfiguration')
      .mockReturnValue({
        strict: false,
        labels: {},
      })
    const getGithubLabelsFromConfigurationMock = jest
      .spyOn(labels, 'getGithubLabelsFromConfiguration')
      .mockReturnValue([])
    const getRepositoryFromNameMock = jest
      .spyOn(labels, 'getRepositoryFromName')
      .mockReturnValue({
        owner: 'prisma-prisma',
        repo: 'github',
      })
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
      .mockImplementation(() => Promise.resolve())
    const updateLabelsInRepositoryMock = jest
      .spyOn(labels, 'updateLabelsInRepository')
      .mockImplementation(() => Promise.resolve())
    const removeLabelsFromRepositoryMock = jest
      .spyOn(labels, 'removeLabelsFromRepository')
      .mockImplementation(() => Promise.resolve())

    /**
     * Execution
     */

    const res = await action.main()

    /**
     * Tests
     */

    expect(getGithubLabelsConfigurationMock).toHaveBeenCalledTimes(1)
    expect(getGithubLabelsFromConfigurationMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryFromNameMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryLabelsMock).toHaveBeenCalledTimes(1)
    expect(getLabelsDiffMock).toHaveBeenCalledTimes(1)
    expect(addLabelsToRepositoryMock).toHaveBeenCalledTimes(1)
    expect(updateLabelsInRepositoryMock).toHaveBeenCalledTimes(1)
    expect(removeLabelsFromRepositoryMock).toHaveBeenCalledTimes(0)
    expect(res).toBe(true)

    /**
     * Clearings
     */

    getGithubLabelsConfigurationMock.mockRestore()
    getGithubLabelsFromConfigurationMock.mockRestore()
    getRepositoryFromNameMock.mockRestore()
    getRepositoryLabelsMock.mockRestore()
    getLabelsDiffMock.mockRestore()
    addLabelsToRepositoryMock.mockRestore()
    updateLabelsInRepositoryMock.mockRestore()
    removeLabelsFromRepositoryMock.mockRestore()
  })

  test('calls correct functions in strict mode', async () => {
    // Set ENVVAR
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_WORKSPACE = 'workspace'
    process.env.GITHUB_HOME = 'home'
    process.env.GITHUB_REPOSITORY = 'prisma/github-labels'
    process.env.GITHUB_EVENT_NAME = 'event'
    process.env.GITHUB_REF = 'ref'

    /**
     * Mocks
     */
    const getGithubLabelsConfigurationMock = jest
      .spyOn(labels, 'getGithubLabelsConfiguration')
      .mockReturnValue({
        strict: true,
        labels: {},
      })
    const getGithubLabelsFromConfigurationMock = jest
      .spyOn(labels, 'getGithubLabelsFromConfiguration')
      .mockReturnValue([])
    const getRepositoryFromNameMock = jest
      .spyOn(labels, 'getRepositoryFromName')
      .mockReturnValue({
        owner: 'prisma-prisma',
        repo: 'github',
      })
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
      .mockImplementation(() => Promise.resolve())
    const updateLabelsInRepositoryMock = jest
      .spyOn(labels, 'updateLabelsInRepository')
      .mockImplementation(() => Promise.resolve())
    const removeLabelsFromRepositoryMock = jest
      .spyOn(labels, 'removeLabelsFromRepository')
      .mockImplementation(() => Promise.resolve())

    /**
     * Execution
     */

    const res = await action.main()

    /**
     * Tests
     */

    expect(getGithubLabelsConfigurationMock).toHaveBeenCalledTimes(1)
    expect(getGithubLabelsFromConfigurationMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryFromNameMock).toHaveBeenCalledTimes(1)
    expect(getRepositoryLabelsMock).toHaveBeenCalledTimes(1)
    expect(getLabelsDiffMock).toHaveBeenCalledTimes(1)
    expect(addLabelsToRepositoryMock).toHaveBeenCalledTimes(1)
    expect(updateLabelsInRepositoryMock).toHaveBeenCalledTimes(1)
    expect(removeLabelsFromRepositoryMock).toHaveBeenCalledTimes(1)
    expect(res).toBe(true)

    /**
     * Clearings
     */

    getGithubLabelsConfigurationMock.mockRestore()
    getGithubLabelsFromConfigurationMock.mockRestore()
    getRepositoryFromNameMock.mockRestore()
    getRepositoryLabelsMock.mockRestore()
    getLabelsDiffMock.mockRestore()
    addLabelsToRepositoryMock.mockRestore()
    updateLabelsInRepositoryMock.mockRestore()
    removeLabelsFromRepositoryMock.mockRestore()
  })
})
