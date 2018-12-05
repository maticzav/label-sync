import * as path from 'path'
import { main } from '../bin'

import * as github from '../github'
import * as labels from '@prisma/github-labels-core'

describe('bin', () => {
  beforeAll(() => {
    jest.clearAllMocks()
    jest.resetModules()

    delete process.env.GITHUB_TOKEN
    delete process.env.GITHUB_BRANCH
  })

  test('throws on missing GITHUB_TOKEN', async () => {
    process.env.GITHUB_BRANCH = 'branch'
    const res = await main('path')
    expect(res).toBe(false)
  })

  test('throws on missing GITHUB_BRANCH', async () => {
    process.env.GITHUB_TOKEN = 'token'
    const res = await main('path')
    expect(res).toBe(false)
  })

  test('excutes correctly with JSON configuration', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    const configPath = path.resolve(
      __dirname,
      './__fixtures__/labels.config.json',
    )

    const res = await main(configPath)
    expect(res).toBe(false)
  })

  test('excutes correctly with JS configuration', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */

    const getRepositoriesMock = jest
      .spyOn(github, 'getRepositories')
      .mockResolvedValue([
        {
          id: 1,
          node_id: 'node_id',
          name: 'graphql-shield',
          full_name: 'maticzav/graphql-shield',
        },
      ] as github.GithubRepository[])
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

    const res = await main(configPath)

    /**
     * Tests
     */
    expect(getRepositoriesMock).toBeCalledTimes(1)
    expect(handleSyncMock).toBeCalledTimes(1)
    expect(generateSyncReportMock).toBeCalledTimes(1)
    expect(res).toBe(false)
  })

  test('excutes correctly with JSON configuration', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */

    const getRepositoriesMock = jest
      .spyOn(github, 'getRepositories')
      .mockResolvedValue([
        {
          id: 1,
          node_id: 'node_id',
          name: 'graphql-shield',
          full_name: 'maticzav/graphql-shield',
        },
      ] as github.GithubRepository[])
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

    const res = await main(configPath)

    /**
     * Tests
     */
    expect(getRepositoriesMock).toBeCalledTimes(1)
    expect(handleSyncMock).toBeCalledTimes(1)
    expect(generateSyncReportMock).toBeCalledTimes(1)
    expect(res).toBe(false)
  })

  test('report faulty JSON configuration', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */

    const getRepositoriesMock = jest.spyOn(github, 'getRepositories')
    const handleSyncMock = jest.spyOn(labels, 'handleSync')
    const generateSyncReportMock = jest.spyOn(labels, 'generateSyncReport')

    /**
     * Execution
     */

    const configPath = path.resolve(__dirname, './__fixtures__/labels.con.json')

    const res = await main(configPath)

    /**
     * Tests
     */
    expect(getRepositoriesMock).toBeCalledTimes(0)
    expect(handleSyncMock).toBeCalledTimes(0)
    expect(generateSyncReportMock).toBeCalledTimes(0)
    expect(res).toBe(false)
  })

  test('report faulty JS configuration', async () => {
    process.env.GITHUB_TOKEN = 'token'
    process.env.GITHUB_BRANCH = 'branch'

    /**
     * Mocks
     */

    const getRepositoriesMock = jest.spyOn(github, 'getRepositories')
    const handleSyncMock = jest.spyOn(labels, 'handleSync')
    const generateSyncReportMock = jest.spyOn(labels, 'generateSyncReport')

    /**
     * Execution
     */

    const configPath = path.resolve(__dirname, './__fixtures__/labels.con.js')

    const res = await main(configPath)

    /**
     * Tests
     */
    expect(getRepositoriesMock).toBeCalledTimes(0)
    expect(handleSyncMock).toBeCalledTimes(0)
    expect(generateSyncReportMock).toBeCalledTimes(0)
    expect(res).toBe(false)
  })
})
