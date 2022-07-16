import type { LSCConfiguration, LSCRepository, LSCLabel } from '@labelsync/config'
import { Configurable } from './configurable'
import { Dict, withDefault, mapEntries } from './utils'
import { YAML } from './yaml'

/* Providers */

export function repo(repo: RepositoryInput): Repository {
  return new Repository(repo)
}

export function label(label: LabelInput | string, color?: string): Label {
  return new Label(label, color)
}

/* Classes */

/* Configuration */

export type ConfigurationInput = {
  repos: Dict<Repository>
}

export class Configuration extends YAML<LSCConfiguration> implements Configurable<LSCConfiguration> {
  private repositories: Dict<Repository> = {}

  constructor(config: ConfigurationInput) {
    super()
    this.repositories = config.repos
  }

  getConfiguration() {
    return {
      repos: mapEntries(this.repositories, (r) => r.getConfiguration()),
    }
  }
}

/* Repository */

export type RepositoryInput = {
  config?: RepositoryConfiguration
  labels: Label[]
}

export type RepositoryConfiguration = {
  removeUnconfiguredLabels?: boolean
}

/**
 * Repository configuration.
 */
export class Repository implements Configurable<LSCRepository> {
  private config: RepositoryConfiguration
  private labels: Label[] = []

  constructor(repo: RepositoryInput) {
    this.config = withDefault({}, repo.config)

    /* Copy over labels and skip duplicates. */
    for (const label of repo.labels.reverse()) {
      if (!this.labels.find((rl) => rl.getName() === label.getName())) {
        this.labels.push(label)
      }
    }
  }

  /**
   * Returns the collection of labels configured in repository.
   */
  *[Symbol.iterator]() {
    for (const label of this.labels) {
      yield label
    }
  }

  getConfiguration() {
    let labels: { [label: string]: LSCLabel } = {}

    /* Process labels */
    for (const label of this.labels) {
      const name = label.getName()
      /* istanbul ignore next */
      if (labels.hasOwnProperty(name)) {
        throw new Error(`Duplicate label ${name}`)
      }
      labels[name] = label.getConfiguration()
    }

    return {
      config: this.config,
      labels,
    }
  }
}

/* Label */

export type LabelInput =
  | {
      name: string
      color: string
      description?: string
      alias?: string[]
      siblings?: string[]
    }
  | string

export class Label implements Configurable<LSCLabel> {
  private name: string
  private color: string = ''
  private description: string | undefined
  private siblings: string[] = []
  private alias: string[] = []

  constructor(label: LabelInput | string, color?: string) {
    switch (typeof label) {
      case 'string': {
        this.name = label
        /* istanbul ignore next */
        if (!color) {
          throw new Error(`Label either accepts label(name, color) or label(config) object!`)
        }
        this.color = this.fixColor(color)
        return
      }
      case 'object': {
        this.name = label.name
        this.color = this.fixColor(label.color)
        this.description = label.description
        this.siblings = withDefault([], label.siblings)
        this.alias = withDefault([], label.alias)
        return
      }
    }
  }

  fixColor(color: string): string {
    if (!color.startsWith('#')) {
      return `#${color}`
    }
    return color
  }

  getName() {
    return this.name
  }

  getConfiguration() {
    return {
      color: this.color,
      description: this.description,
      alias: this.alias,
      siblings: this.siblings,
    }
  }
}
