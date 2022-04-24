import yaml from 'js-yaml'
import { Configurable } from './configurable'

export abstract class YAML<T> extends Configurable<T> {
  getYAML(): string {
    const cleanJSON = JSON.parse(JSON.stringify(this.getConfiguration()))
    return yaml.dump(cleanJSON)
  }
}
