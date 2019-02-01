import * as Octokit from '@octokit/rest'
import { Sibling, RepositoryConfig } from './config'
import {
  GithubLabel,
  getRepositoryLabels,
  GithubRepository,
  GithubIssue,
} from './github'
import { withDefault } from './utils'

/* Config */

export interface RepositorySiblingsManifest {
  [label: string]: Sibling[]
}

/**
 *
 * Generates repository manifest from repository configuration.
 *
 * @param github
 * @param repository
 * @param config
 */
export async function getRepositorySiblingsManifest(
  github: Octokit,
  repository: GithubRepository,
  config: RepositoryConfig,
): Promise<
  | {
      status: 'ok'
      manifest: RepositorySiblingsManifest
    }
  | { status: 'err'; message: string }
> {
  /* Fetch repository */

  const labels = await getRepositoryLabels(github, repository)
  const siblings = getRepositorySiblings(config)

  /* Validate configuration */

  const undefinedSiblings = siblings.filter(
    sibling => !labels.some(label => label.name === sibling),
  )

  if (undefinedSiblings.length !== 0) {
    return {
      status: 'err',
      message: `${undefinedSiblings.join(', ')} are not defined`,
    }
  }

  /* Generate manifest */

  const manifest = generateManifest(config)

  return { status: 'ok', manifest: manifest }

  /* Helper functions */

  /**
   *
   * Returns all siblings in a configuration.
   *
   * @param repository
   */
  function getRepositorySiblings(repository: RepositoryConfig): Sibling[] {
    const siblings = Object.values(repository.labels).reduce<Sibling[]>(
      (acc, label) => {
        switch (typeof label) {
          case 'object': {
            return [...acc, ...withDefault<Sibling[]>([])(label.siblings)]
          }
          default: {
            return acc
          }
        }
      },
      [],
    )

    return siblings
  }

  /**
   *
   * Generates repository manifest.
   *
   * @param repository
   */
  function generateManifest(
    repository: RepositoryConfig,
  ): { [label: string]: string[] } {
    const manifest = Object.keys(repository.labels).reduce((acc, labelName) => {
      const label = repository.labels[labelName]

      switch (typeof label) {
        case 'object': {
          return {
            ...acc,
            [labelName]: withDefault<string[]>([])(label.siblings),
          }
        }
        default: {
          return acc
        }
      }
    }, {})

    return manifest
  }
}

/* Sibling Sync */

/**
 *
 * Assigns label siblings to an Issue.
 *
 * @param github
 * @param pr
 * @param manifest
 * @param label
 */
export async function assignSiblingsToIssue(
  github: Octokit,
  repository: GithubRepository,
  issue: GithubIssue,
  manifest: RepositorySiblingsManifest,
  label: string,
): Promise<
  { status: 'ok'; siblings: GithubLabel[] } | { status: 'err'; message: string }
> {
  const siblings = manifest[label]

  if (!siblings) {
    return { status: 'ok', siblings: [] }
  }

  try {
    const res = await github.issues.addLabels({
      repo: repository.name,
      owner: repository.owner.login,
      number: issue.number,
      labels: siblings,
    })

    return { status: 'ok', siblings: res.data }
  } catch (err) {
    return { status: 'err', message: err.message }
  }
}
