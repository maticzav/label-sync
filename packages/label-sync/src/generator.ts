import {
  LSCConfiguration,
  LSCRepository,
  LSCLabel,
} from '../../../server/src/types'
import { Configurable } from './configurable'
import { Dict, withDefault, mapEntries } from './utils'
import { YAML } from './yaml'

/* Providers */

export function configuration(config: ConfigurationInput): Configuration {
  return new Configuration(config)
}

export function repository(repo: RepositoryInput): Repository {
  return new Repository(repo)
}

export function label(label: LabelInput): Label {
  return new Label(label)
}

/* Classes */

/* Configuration */

export type ConfigurationInput = {
  repositories: Dict<Repository>
}

export class Configuration extends YAML<LSCConfiguration>
  implements Configurable<LSCConfiguration> {
  private repositories: Dict<Repository> = {}

  constructor(config: ConfigurationInput) {
    super()
    this.repositories = config.repositories
  }

  getConfiguration() {
    const repos = mapEntries(this.repositories, r => r.getConfiguration())

    return { repos }
  }
}

/* Repository */

export type RepositoryInput = {
  strict?: boolean
  labels: Dict<Label>
}

export class Repository implements Configurable<LSCRepository> {
  private strict: boolean
  private labels: Dict<Label>

  constructor(repo: RepositoryInput) {
    this.strict = withDefault(false, repo.strict)
    this.labels = repo.labels
  }

  getConfiguration() {
    const labels = mapEntries(this.labels, label => label.getConfiguration())

    return {
      strict: this.strict,
      labels,
    }
  }
}

/* Label */

export type LabelInput =
  | {
      color: string
      description: string
    }
  | string

export class Label implements Configurable<LSCLabel> {
  private color: string = ''
  private description: string | undefined

  constructor(label: LabelInput) {
    switch (typeof label) {
      case 'string': {
        this.color = this.fixColor(label)
        this.description = undefined

        return
      }
      case 'object': {
        this.color = this.fixColor(label.color)
        this.description = withDefault(undefined, label.description)

        return
      }
    }
  }

  fixColor(color: string): string {
    if (color.startsWith('#')) {
      return color.slice(1)
    }
    return color
  }

  getConfiguration() {
    return {
      color: this.color,
      description: this.description,
    }
  }
}
