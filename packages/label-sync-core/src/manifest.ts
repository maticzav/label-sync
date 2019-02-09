import lodash from 'lodash'
import * as Octokit from '@octokit/rest'
import { Sibling, RepositoryConfig, LabelConfig } from './types'
import {
  GithubLabel,
  getRepositoryLabels,
  GithubRepository,
  isLabel,
} from './github'
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
  /*
   * Manifest combines remote state with local configuration and warns
   * about potential errors.
   */

  const remoteLabels = await getRepositoryLabels(github, repository)
  const localLabels = getLabelsInConfiguration(config)

  let labels: GithubLabel[]

  if (config.strict) {
    labels = localLabels
  } else {
    labels = mergeLabels(remoteLabels, localLabels)
  }

  const siblings = getSiblingsInConfiguration(config)

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
        case 'undefined': {
          return {
            ...acc,
            [label.name]: {
              label: label,
              siblings: [],
            },
          }
        }
      }
    }, {})

    return manifest
  }

  /**
   *
   * Merges remote and local labels.
   *
   * @param remote
   * @param local
   */
  function mergeLabels(
    remote: GithubLabel[],
    local: GithubLabel[],
  ): GithubLabel[] {
    /* Local configuration has an upper hand over remote state. */
    return remote.reduce((acc, label) => {
      if (acc.some(isLabel(label))) {
        return acc
      } else {
        return [...acc, label]
      }
    }, local)
  }
}

/**
 *
 * Returns all siblings in a configuration.
 *
 * @param repository
 */
export function getSiblingsInConfiguration(
  repository: RepositoryConfig,
): Sibling[] {
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

  return lodash.uniq(siblings)
}

/**
 *
 * Returns all labels in configuration.
 *
 * @param configuration
 */
export function getLabelsInConfiguration(
  configuration: RepositoryConfig,
): GithubLabel[] {
  const labelNames = Object.keys(configuration.labels)
  const labels = labelNames.map(labelName =>
    hydrateLabel(labelName, configuration.labels[labelName]),
  )

  return labels

  /* Helper functions */

  /**
   *
   * Fills the missing pieces of a label.
   *
   * @param labelName
   * @param labelConfig
   */
  function hydrateLabel(
    labelName: string,
    labelConfig: LabelConfig,
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
