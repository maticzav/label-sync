import * as assert from 'assert'
import * as Octokit from '@octokit/rest'
import chalk from 'chalk'

/**
 * Sync
 */

import configuration from './config'

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
  main(configuration).then(report => console.log(report))
}

/**
 * Action
 */

export async function main(configuration: Config): Promise<string> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('Missing Github configuration!')
  }

  /**
   * Authentication
   */

  const client = new Octokit()

  client.authenticate({
    type: 'app',
    token: process.env.GITHUB_TOKEN,
  })

  /**
   * Repositories Sync
   */

  const repositories = getRepositoriesFromConfiguration(configuration)
  const actions = repositories.map(repository =>
    handleRepository(client, repository.name, repository.config),
  )

  const report = await Promise.all(actions)
  return syncReport(report)

  /**
   * Helper functions
   */

  function syncReport(repositoryReports: string[]): string {
    const message = `
Synced labels accross ${repositoryReports.length} repositories;
${repositoryReports.join('\n\n')}
    `

    return message
  }
}

/**
 * Helper functions
 */

type LabelConfiguration =
  | {
      description?: string
      color: string
    }
  | string

interface RepositoryConfiguration {
  strict?: boolean
  labels: { [name: string]: LabelConfiguration }
}

export interface Config {
  [repository: string]: RepositoryConfiguration
}

export function getRepositoriesFromConfiguration(
  configuration: Config,
): { name: string; config: RepositoryConfiguration }[] {
  const repositories = Object.keys(configuration).map(repository => ({
    name: repository,
    config: hydrateRepositoryConfiguration(configuration[repository]),
  }))

  return repositories

  /**
   * Helpers
   */
  function hydrateRepositoryConfiguration(config: RepositoryConfiguration) {
    return {
      strict: withDefault(false)(config.strict),
      labels: config.labels,
    }
  }
}

/**
 *
 * Handles report installation.
 *
 * @param client
 * @param name
 * @param config
 */
async function handleRepository(
  client: Octokit,
  name: string,
  config: RepositoryConfiguration,
): Promise<string> {
  const repository = getRepositoryFromName(name)

  if (!repository) {
    throw new Error(`Cannot decode the provided repository name ${name}`)
  }

  /**
   * Labels
   */

  // Github
  const currentLabels = await getRepostioryLabels(client, repository)

  // Local
  const newLabels = getGithubLabelsFromRepositoryConfiguration(config)

  /**
   * Diff
   */

  const diff = getLabelsDiff(currentLabels, newLabels)

  /**
   * Sync
   */
  const additions = await addLabelsToRepository(client, diff.add, repository)
  const updates = await updateLabelsInRepository(
    client,
    diff.update,
    repository,
  )
  const removals = configuration.strict
    ? await removeLabelsFromRepository(client, diff.remove, repository)
    : `${diff.remove.length} labels should be removed. 
To override them, set strict property to true in repository configuration.
    `

  return syncReport({
    additions,
    updates,
    removals,
  })

  /**
   * Helper functions
   */
  function syncReport({
    additions,
    updates,
    removals,
  }: {
    additions: string
    updates: string
    removals: string
  }): string {
    const message = `
Synced ${name}:

${additions}

${updates}

${removals}
    `

    return message
  }
}

/**
 *
 * Hydrates Github labels from configuration file.
 *
 * @param configuration
 */
export function getGithubLabelsFromRepositoryConfiguration(
  configuration: RepositoryConfiguration,
): GithubLabel[] {
  const labelNames = Object.keys(configuration.labels)
  const labels = labelNames.map(labelName =>
    hydrateLabel(labelName, configuration.labels[labelName]),
  )

  return labels

  /**
   * Helper functions
   */

  /**
   *
   * Fills the missing pieces of a label.
   *
   * @param labelName
   * @param labelConfig
   */
  function hydrateLabel(
    labelName: string,
    labelConfig: LabelConfiguration,
  ): GithubLabel {
    switch (typeof labelConfig) {
      case 'string': {
        return {
          name: labelName,
          description: '',
          color: labelConfig,
          default: false,
        }
      }
      case 'object': {
        return {
          name: labelName,
          description: withDefault('')(labelConfig.description),
          color: labelConfig.color,
          default: false,
        }
      }
    }
  }
}

/**
 * Github functions
 */

export interface GithubRepository {
  owner: string
  repo: string
}

/**
 *
 * Converts Github repository name to GithubRepository
 *
 * @param name
 */
export function getRepositoryFromName(name: string): GithubRepository | null {
  try {
    const [owner, repo] = name.split('/')

    assert.ok(typeof owner === 'string')
    assert.ok(typeof repo === 'string')

    return {
      owner,
      repo,
    }
  } catch (err) {
    return null
  }
}

export interface GithubLabel {
  id?: number
  node_id?: string
  url?: string
  name: string
  description: string
  color: string
  default: boolean
}

/**
 *
 * Obtains all labels used in particular repository.
 *
 * @param github
 * @param repository
 */
export async function getRepostioryLabels(
  github: Octokit,
  repository: GithubRepository,
): Promise<GithubLabel[]> {
  return github.issues
    .listLabelsForRepo({ repo: repository.repo, owner: repository.owner })
    .then(res => res.data)
}

/**
 *
 * Creates new labels in a repository.
 *
 * @param github
 * @param labels
 * @param repository
 */
export async function addLabelsToRepository(
  github: Octokit,
  labels: GithubLabel[],
  repository: GithubRepository,
): Promise<string> {
  const actions = labels.map(label => addLabelToRepository(label))
  const res = await Promise.all(actions)

  return reportSync(res)

  /**
   * Helper functions
   */
  async function addLabelToRepository(
    label: GithubLabel,
  ): Promise<GithubLabel> {
    return github.issues
      .createLabel({
        owner: repository.owner,
        repo: repository.repo,
        name: label.name,
        description: label.description,
        color: label.color,
      })
      .then(res => res.data)
  }

  function reportSync(additions: GithubLabel[]): string {
    const message = `
Added ${additions.length} labels:
${additions.map(label => chalk.hex(label.color)` - ${label.name}\n`)}
    `

    return message
  }
}

/**
 *
 * Updates labels in repository.
 *
 * @param github
 * @param labels
 * @param repository
 */
export async function updateLabelsInRepository(
  github: Octokit,
  labels: GithubLabel[],
  repository: GithubRepository,
): Promise<string> {
  const actions = labels.map(label => updateLabelInREpository(label))
  const res = await Promise.all(actions)

  return reportSync(res)

  /**
   * Helper functions
   */
  async function updateLabelInREpository(
    label: GithubLabel,
  ): Promise<GithubLabel> {
    return github.issues
      .updateLabel({
        current_name: label.name,
        owner: repository.owner,
        repo: repository.repo,
        name: label.name,
        description: label.description,
        color: label.color,
      })
      .then(res => res.data)
  }

  function reportSync(updates: GithubLabel[]): string {
    const message = `
Updated ${updates.length} labels:
${updates.map(label => chalk.hex(label.color)` - ${label.name}\n`)}
    `

    return message
  }
}

/**
 *
 * Removes labels from repository.
 *
 * @param github
 * @param labels
 * @param repository
 */
export async function removeLabelsFromRepository(
  github: Octokit,
  labels: GithubLabel[],
  repository: GithubRepository,
): Promise<string> {
  const actions = labels.map(label => removeLabelFromRepository(label))
  const res = await Promise.all(actions)

  return reportSync(labels)

  /**
   * Helper functions
   */
  async function removeLabelFromRepository(
    label: GithubLabel,
  ): Promise<Octokit.IssuesDeleteLabelResponse> {
    return github.issues
      .deleteLabel({
        owner: repository.owner,
        repo: repository.repo,
        name: label.name,
      })
      .then(res => res.data)
  }

  function reportSync(removals: GithubLabel[]): string {
    const message = `
Removed ${removals.length} labels:
${removals.map(label => chalk.hex(label.color)` - ${label.name}\n`)}
    `

    return message
  }
}

/**
 *
 * Calculates the diff of labels.
 *
 * @param currentLabels
 * @param newLabels
 */
export function getLabelsDiff(
  currentLabels: GithubLabel[],
  newLabels: GithubLabel[],
): {
  add: GithubLabel[]
  update: GithubLabel[]
  remove: GithubLabel[]
} {
  const labels = [...currentLabels, ...newLabels]
  const diff = labels.reduce<{
    add: GithubLabel[]
    update: GithubLabel[]
    remove: GithubLabel[]
  }>(
    (acc, label) => {
      const status = getLabelStatus(label)

      switch (status) {
        case 'create':
          return { ...acc, add: acc.add.concat(label) }

        case 'update':
          return { ...acc, update: acc.update.concat(label) }

        case 'delete':
          return { ...acc, remove: acc.remove.concat(label) }

        case 'ignore':
          return acc
      }
    },
    {
      add: [],
      update: [],
      remove: [],
    },
  )

  return diff

  /**
   * Helper functions
   */
  function getLabelStatus(
    label: GithubLabel,
  ): 'create' | 'update' | 'delete' | 'ignore' {
    const isNew = newLabels.find(isLabel(label))
    const newDefinition = newLabels.find(isLabelDefinition(label))
    const currentDefinition = currentLabels.find(isLabelDefinition(label))

    if (newDefinition && !currentDefinition) {
      return 'create'
    } else if (
      newDefinition &&
      currentDefinition &&
      !isLabel(newDefinition)(currentDefinition) &&
      isNew
    ) {
      return 'update'
    } else if (!newDefinition && currentDefinition) {
      return 'delete'
    } else {
      return 'ignore'
    }
  }

  /**
   * Helper functions
   */
  function isLabelDefinition(
    label: GithubLabel,
  ): (compare: GithubLabel) => boolean {
    return compare => label.name === compare.name
  }
}

/**
 * Utils
 */

/**
 *
 * Returns fallback if value is undefined.
 *
 * @param fallback
 */
export function withDefault<T>(fallback: T): (value: T | undefined) => T {
  return value => {
    if (value !== undefined) {
      return value
    } else {
      return fallback
    }
  }
}

/**
 *
 * Compares two labels by comparing all of their keys.
 *
 * @param label
 */
export function isLabel(label: GithubLabel): (compare: GithubLabel) => boolean {
  return compare => {
    try {
      assert.deepStrictEqual(label, compare)
      return true
    } catch (err) {
      return false
    }
  }
}
