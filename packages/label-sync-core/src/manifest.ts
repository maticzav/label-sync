import * as Octokit from '@octokit/rest'
import { Sibling, RepositoryConfig } from './types'
import { GithubLabel, getRepositoryLabels, GithubRepository } from './github'
import { withDefault } from './utils'

export type RepositoryManifest = {
  [name: string]: LabelManifest
}

export type LabelManifest = {
  label: GithubLabel
  siblings: Sibling[]
}

/**
 *
 * Generates repository manifest from repository configuration.
 *
 * @param github
 * @param repository
 * @param config
 */
export async function getRepositoryManifest(
  github: Octokit,
  repository: GithubRepository,
  config: RepositoryConfig,
): Promise<
  | {
      status: 'ok'
      manifest: RepositoryManifest
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
      message: `Labels ${undefinedSiblings.join(', ')} are not defined`,
    }
  }

  /* Generate manifest */

  const manifest = generateManifest(config, labels)

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
   * Generates repository manifest from labels and siblings.
   *
   * @param repository
   * @param labels
   */
  function generateManifest(
    repository: RepositoryConfig,
    labels: GithubLabel[],
  ): RepositoryManifest {
    const manifest = labels.reduce((acc, label) => {
      const labelConfig = repository.labels[label.name]

      switch (typeof labelConfig) {
        case 'object': {
          return {
            ...acc,
            [label.name]: {
              label: label,
              siblings: withDefault<string[]>([])(labelConfig.siblings),
            },
          }
        }
        case 'string': {
          return {
            ...acc,
            [label.name]: {
              label: label,
              siblings: [],
            },
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
