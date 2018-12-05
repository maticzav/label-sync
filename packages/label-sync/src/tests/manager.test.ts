import * as path from 'path'
import { manage } from '../manager'

import * as config from '../config'
import * as labels from 'label-sync-core'

describe('manager', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.resetModules()

    delete process.env.GITHUB_TOKEN
    delete process.env.GITHUB_BRANCH
  })

  test('throws on missing GITHUB_TOKEN', async () => {
    process.env.GITHUB_BRANCH = 'branch'
    const res = await manage('path', { dryrun: false })
    expect(res).toEqual({
      status: 'err',
      message: 'Missing Github credentials!',
    })
  })

  test('throws on missing GITHUB_BRANCH', async () => {
    process.env.GITHUB_TOKEN = 'token'

    /**
     * Mocks
     */

    const generateConfigurationFromJSONLabelsConfigurationMock = jest
      .spyOn(config, 'generateConfigurationFromJSONLabelsConfiguration')
      .mockResolvedValue({ status: 'ok', config: {} })

    /**
     * Execution
     */

    const configPath = path.resolve(
      __dirname,
      './__fixtures__/labels.config.json',
    )

    const res = await manage(configPath, { dryrun: false })

    /**
     * Tests
     */

    expect(res).toEqual({
      status: 'err',
      message: 'Missing GITHUB_BRANCH environment variable.',
    })

    /**
     * Clearings
     */

    generateConfigurationFromJSONLabelsConfigurationMock.mockRestore()
  })

  test('excutes correctly with JS configuration', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */

    const getGithubLabelsJSConfigurationMock = jest
      .spyOn(config, 'getGithubLabelsJSConfiguration')
      .mockImplementation(() => ({}))
    const getGithubLabelsJSONConfigurationMock = jest.spyOn(
      config,
      'getGithubLabelsJSONConfiguration',
    )
    const generateConfigurationFromJSONLabelsConfigurationMock = jest.spyOn(
      config,
      'generateConfigurationFromJSONLabelsConfiguration',
    )
    const handleSyncMock = jest
      .spyOn(labels, 'handleSync')
      .mockImplementation(() => 'pass')
    const generateSyncReportMock = jest
      .spyOn(labels, 'generateSyncReport')
      .mockImplementation(() => 'pass')

    /**
     * Execution
     */

    const configPath = path.resolve(
      __dirname,
      './__fixtures__/labels.config.js',
    )

    const res = await manage(configPath, { dryrun: false })

    /**
     * Tests
     */

    expect(getGithubLabelsJSConfigurationMock).toBeCalledTimes(1)
    expect(getGithubLabelsJSONConfigurationMock).toBeCalledTimes(0)
    expect(
      generateConfigurationFromJSONLabelsConfigurationMock,
    ).toBeCalledTimes(0)
    expect(handleSyncMock).toBeCalledTimes(1)
    expect(generateSyncReportMock).toBeCalledTimes(1)
    expect(res).toEqual({ status: 'ok', report: 'pass', message: 'pass' })

    /**
     * Clearings
     */

    getGithubLabelsJSConfigurationMock.mockRestore()
    getGithubLabelsJSONConfigurationMock.mockRestore()
    generateConfigurationFromJSONLabelsConfigurationMock.mockRestore()
    handleSyncMock.mockRestore()
    generateSyncReportMock.mockRestore()
  })

  test('correctly determines dryrun option', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */

    const getGithubLabelsJSConfigurationMock = jest.spyOn(
      config,
      'getGithubLabelsJSConfiguration',
    )
    const getGithubLabelsJSONConfigurationMock = jest.spyOn(
      config,
      'getGithubLabelsJSONConfiguration',
    )
    const generateConfigurationFromJSONLabelsConfigurationMock = jest
      .spyOn(config, 'generateConfigurationFromJSONLabelsConfiguration')
      .mockResolvedValue({ status: 'ok', config: {} })
    const handleSyncMock = jest
      .spyOn(labels, 'handleSync')
      .mockImplementation(() => 'pass')
    const generateSyncReportMock = jest
      .spyOn(labels, 'generateSyncReport')
      .mockImplementation(() => 'pass')

    /**
     * Execution
     */

    const configPath = path.resolve(
      __dirname,
      './__fixtures__/labels.no-branch.config.json',
    )

    const res = await manage(configPath, {})

    /**
     * Tests
     */

    expect(getGithubLabelsJSConfigurationMock).toBeCalledTimes(0)
    expect(getGithubLabelsJSONConfigurationMock).toBeCalledTimes(1)
    expect(
      generateConfigurationFromJSONLabelsConfigurationMock,
    ).toBeCalledTimes(1)
    expect(handleSyncMock).toBeCalledTimes(1)
    expect(generateSyncReportMock).toBeCalledTimes(1)
    expect(handleSyncMock).toBeCalledWith(
      {},
      {
        githubToken: 'token',
        dryRun: false,
      },
    )
    expect(res).toEqual({ status: 'ok', report: 'pass', message: 'pass' })

    /**
     * Clearings
     */

    getGithubLabelsJSConfigurationMock.mockRestore()
    getGithubLabelsJSONConfigurationMock.mockRestore()
    generateConfigurationFromJSONLabelsConfigurationMock.mockRestore()
    handleSyncMock.mockRestore()
    generateSyncReportMock.mockRestore()
  })

  test('excutes correctly with JSON configuration', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */

    const getGithubLabelsJSConfigurationMock = jest.spyOn(
      config,
      'getGithubLabelsJSConfiguration',
    )
    const getGithubLabelsJSONConfigurationMock = jest
      .spyOn(config, 'getGithubLabelsJSONConfiguration')
      .mockImplementation(() => ({ labels: {}, publish: { branch: 'master' } }))
    const generateConfigurationFromJSONLabelsConfigurationMock = jest
      .spyOn(config, 'generateConfigurationFromJSONLabelsConfiguration')
      .mockResolvedValue({ status: 'ok', config: {} })
    const handleSyncMock = jest
      .spyOn(labels, 'handleSync')
      .mockImplementation(() => 'pass')
    const generateSyncReportMock = jest
      .spyOn(labels, 'generateSyncReport')
      .mockImplementation(() => 'pass')

    /**
     * Execution
     */

    const configPath = path.resolve(
      __dirname,
      './__fixtures__/labels.config.json',
    )

    const res = await manage(configPath, {})

    /**
     * Tests
     */

    expect(getGithubLabelsJSConfigurationMock).toBeCalledTimes(0)
    expect(getGithubLabelsJSONConfigurationMock).toBeCalledTimes(1)
    expect(
      generateConfigurationFromJSONLabelsConfigurationMock,
    ).toBeCalledTimes(1)
    expect(handleSyncMock).toBeCalledTimes(1)
    expect(generateSyncReportMock).toBeCalledTimes(1)
    expect(handleSyncMock).toBeCalledWith(
      {},
      { githubToken: 'token', dryRun: true },
    )
    expect(res).toEqual({ status: 'ok', report: 'pass', message: 'pass' })

    /**
     * Clearings
     */

    getGithubLabelsJSConfigurationMock.mockRestore()
    getGithubLabelsJSONConfigurationMock.mockRestore()
    generateConfigurationFromJSONLabelsConfigurationMock.mockRestore()
    handleSyncMock.mockRestore()
    generateSyncReportMock.mockRestore()
  })

  test('reports faulty JSON configuration path', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */

    const handleSyncMock = jest.spyOn(labels, 'handleSync')
    const generateSyncReportMock = jest.spyOn(labels, 'generateSyncReport')

    /**
     * Execution
     */

    const configPath = path.resolve(__dirname, './__fixtures__/labels.con.json')

    const res = await manage(configPath, { dryrun: false })

    /**
     * Tests
     */
    expect(handleSyncMock).toBeCalledTimes(0)
    expect(generateSyncReportMock).toBeCalledTimes(0)
    expect(res).toEqual({
      status: 'err',
      message: `Couldn't find a valid configuration file at ${configPath}`,
    })

    /**
     * Clearings
     */

    handleSyncMock.mockRestore()
    generateSyncReportMock.mockRestore()
  })

  test('reports faulty JSON configuration', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */
    const generateConfigurationFromJSONLabelsConfigurationMock = jest
      .spyOn(config, 'generateConfigurationFromJSONLabelsConfiguration')
      .mockResolvedValue({ status: 'err', message: 'pass' })
    const handleSyncMock = jest.spyOn(labels, 'handleSync')
    const generateSyncReportMock = jest.spyOn(labels, 'generateSyncReport')

    /**
     * Execution
     */

    const configPath = path.resolve(
      __dirname,
      './__fixtures__/labels.config.json',
    )

    const res = await manage(configPath, { dryrun: false })

    /**
     * Tests
     */

    expect(handleSyncMock).toBeCalledTimes(0)
    expect(generateSyncReportMock).toBeCalledTimes(0)
    expect(res).toEqual({ status: 'err', message: `pass` })

    /**
     * Clearings
     */

    generateConfigurationFromJSONLabelsConfigurationMock.mockRestore()
    handleSyncMock.mockRestore()
    generateSyncReportMock.mockRestore()
  })

  test('reports faulty JS configuration path', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */

    const handleSyncMock = jest.spyOn(labels, 'handleSync')
    const generateSyncReportMock = jest.spyOn(labels, 'generateSyncReport')

    /**
     * Execution
     */

    const configPath = path.resolve(__dirname, './__fixtures__/labels.con.js')

    const res = await manage(configPath, { dryrun: false })

    /**
     * Tests
     */
    expect(handleSyncMock).toBeCalledTimes(0)
    expect(generateSyncReportMock).toBeCalledTimes(0)
    expect(res).toEqual({
      status: 'err',
      message: `Couldn't find a valid configuration file at ${configPath}`,
    })

    /**
     * Clearings
     */

    handleSyncMock.mockRestore()
    generateSyncReportMock.mockRestore()
  })

  test('reports faulty configuration extension', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */

    const handleSyncMock = jest.spyOn(labels, 'handleSync')
    const generateSyncReportMock = jest.spyOn(labels, 'generateSyncReport')

    /**
     * Execution
     */

    const configPath = path.resolve(
      __dirname,
      './__fixtures__/labels.config.ts',
    )

    const res = await manage(configPath, { dryrun: false })

    /**
     * Tests
     */
    expect(handleSyncMock).toBeCalledTimes(0)
    expect(generateSyncReportMock).toBeCalledTimes(0)
    expect(res).toEqual({
      status: 'err',
      message: `Unsupported configuration type ${configPath}`,
    })

    /**
     * Clearings
     */

    handleSyncMock.mockRestore()
    generateSyncReportMock.mockRestore()
  })
})
