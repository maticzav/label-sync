import * as path from 'path'
import {
  getGithubLabelsJSConfiguration,
  getGithubLabelsJSONConfiguration,
  generateConfigurationFromJSONLabelsConfiguration,
} from '../'

import * as github from '../github'
import { Config } from '@prisma/github-labels-core'

describe('Configuration function', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  /**
   * getGithubLabelsJSONConfiguration
   */
  test('getGithubLabelsJSONConfiguration works as expected', async () => {
    const jsonConfigPath = path.resolve(
      __dirname,
      '__fixtures__/labels.config.json',
    )

    const config = getGithubLabelsJSONConfiguration(jsonConfigPath)

    expect(config).toEqual({
      strict: false,
      labels: {
        FAQ: 'blue',
        'kind/bug': {
          color: 'yellow',
          description: 'All issues which are bugs.',
        },
      },
      repositories: [
        'prisma/*',
        {
          paths: 'prisma/one-*',
          labels: {
            'Feature: Prisma One': 'green',
            'field/express': {
              color: 'red',
              description: 'Issues related to ExpressJS.',
            },
          },
          strict: true,
        },
        {
          paths: 'prisma/two-*',
          labels: {
            'Feature: Prisma Two': 'green',
            'field/express': {
              color: 'red',
              description: 'Issues related to ExpressJS.',
            },
          },
        },
        {
          paths: 'prisma/three-*',
        },
      ],
      publish: {
        branch: 'master',
      },
    })
  })

  test('getGithubLabelsJSONConfiguration returns null when non existant path is provided', async () => {
    const jsonConfigPath = path.resolve(__dirname, 'non_existant')
    const config = getGithubLabelsJSONConfiguration(jsonConfigPath)
    expect(config).toBeNull()
  })

  test('getGithubLabelsJSONConfiguration returns null when non absolute path is provided', async () => {
    const config = getGithubLabelsJSONConfiguration('./non_existant')
    expect(config).toBeNull()
  })

  test('getGithubLabelsJSONConfiguration returns null when non absolute path is provided', async () => {
    const config = getGithubLabelsJSONConfiguration('./non_existant')
    expect(config).toBeNull()
  })

  test('getGithubLabelsJSONConfiguration returns null when invalid config is provided', async () => {
    const jsonConfigPath = path.resolve(
      __dirname,
      '__fixtures__/labels.invalid.config.json',
    )
    const config = getGithubLabelsJSONConfiguration(jsonConfigPath)
    expect(config).toBeNull()
  })

  /**
   * getGithubLabelsJSConfiguration
   */
  test('getGithubLabelsJSConfiguration correctly import configuration', async () => {
    const jsConfigPath = path.resolve(
      __dirname,
      '__fixtures__/labels.config.js',
    )

    const config = getGithubLabelsJSConfiguration(jsConfigPath)

    expect(config).toEqual({
      'maticzav/graphql-shield': {
        labels: {
          FAQ: 'orange',
          'kind/feature': {
            color: 'blue',
            description: 'All issues with fetaure requests.',
          },
          discussion: {
            color: 'yellow',
            description: 'Discussions about GraphQL security.',
          },
        },
      },
    })
  })

  test('getGithubLabelsJSConfiguration returns null when non existant path is provided', async () => {
    const jsonConfigPath = path.resolve(__dirname, 'non_existant')
    const config = getGithubLabelsJSConfiguration(jsonConfigPath)
    expect(config).toBeNull()
  })

  /**
   * generateConfigurationFromJSONLabelsConfiguration
   */
  test('generateConfigurationFromJSONLabelsConfiguration generates correct configuration from JSON', async () => {
    /**
     * Mocks
     */

    const getRepositoriesMock = jest
      .spyOn(github, 'getRepositories')
      .mockResolvedValue([
        {
          id: 0,
          node_id: 'node_id',
          name: 'github-labels',
          full_name: 'maticzav/github-labels',
        },
        {
          id: 0,
          node_id: 'node_id',
          name: 'emma',
          full_name: 'maticzav/emma',
        },
        {
          id: 0,
          node_id: 'node_id',
          name: 'graphql-shield',
          full_name: 'maticzav/graphql-shield',
        },
        {
          id: 0,
          node_id: 'node_id',
          name: 'qux',
          full_name: 'foobar/qux',
        },
      ] as github.GithubRepository[])

    /**
     * Execution
     */
    const res = await generateConfigurationFromJSONLabelsConfiguration(
      {
        strict: true,
        labels: {
          'label-1': 'color-1',
          label2: {
            color: 'color-2',
            description: 'description-1',
          },
        },
        repositories: [
          'maticzav/*',
          {
            paths: 'maticzav/graphql-*',
            labels: {
              label3: 'color-3',
            },
            strict: false,
          },
          {
            paths: 'maticzav/graphql-shield',
            labels: {
              label4: 'color-4',
            },
          },
        ],
        publish: {
          branch: 'master',
        },
      },
      {
        githubToken: 'token',
      },
    )

    /**
     * Checks
     */

    expect(res).toEqual({
      status: 'ok',
      config: {
        'maticzav/github-labels': {
          labels: {
            'label-1': 'color-1',
            label2: {
              color: 'color-2',
              description: 'description-1',
            },
          },
          strict: true,
        },
        'maticzav/graphql-shield': {
          labels: {
            'label-1': 'color-1',
            label2: {
              color: 'color-2',
              description: 'description-1',
            },
            label3: 'color-3',
            label4: 'color-4',
          },
          strict: false,
        },
        'maticzav/emma': {
          labels: {
            'label-1': 'color-1',
            label2: {
              color: 'color-2',
              description: 'description-1',
            },
          },
          strict: true,
        },
      },
    } as { status: 'ok'; config: Config })

    /**
     * Clearings
     */

    getRepositoriesMock.mockRestore()
  })

  test('generateConfigurationFromJSONLabelsConfiguration returns error message on error', async () => {
    /**
     * Mocks
     */

    const getRepositoriesMock = jest
      .spyOn(github, 'getRepositories')
      .mockImplementation(() => {
        throw new Error('pass')
      })

    /**
     * Execution
     */
    const res = await generateConfigurationFromJSONLabelsConfiguration(
      {
        strict: true,
        labels: {
          'label-1': 'color-1',
        },
        repositories: ['maticzav/*'],
        publish: {
          branch: 'master',
        },
      },
      {
        githubToken: 'token',
      },
    )

    /**
     * Checks
     */

    expect(res).toEqual({ status: 'err', message: 'pass' })

    /**
     * Clearings
     */

    getRepositoriesMock.mockRestore()
  })
})
