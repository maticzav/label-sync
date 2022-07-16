import { parseConfig } from '@labelsync/config'
import _ from 'lodash'

import { Processor } from '../lib/processor'

type ProcessorData = {
  owner: string
  repo: string
  label: string
}

/**
 * A processor that removes a label that is not configured in strict repositories.
 */
export class UnconfiguredLabelsProcessor extends Processor<ProcessorData> {
  /**
   * Syncs the configuration of a repository with its labels.
   */
  public async perform({ owner, repo, label }: ProcessorData) {
    this.log.info(`New label created in ${repo}: "${label}".`)

    const rawConfig = await this.endpoints.getConfig({ owner })
    if (rawConfig === null) {
      this.log.info(`No configuration, skipping siblings sync.`)
      return
    }
    const parsedConfig = parseConfig({
      input: rawConfig,
      isPro: this.installation.isPaidPlan,
    })

    if (!parsedConfig.ok) {
      this.log.info(parsedConfig, `Invalid configuration, skipping siblings sync.`)
      return
    }

    const config = parsedConfig.config.repos[repo]

    /* istanbul ignore if */
    if (!config) {
      this.log.info(`No configuration found for the repo, skipping.`)
      return
    }

    if (label in config.labels) {
      this.log.info(`Label "${label}" is configured, skipping.`)
      return
    }

    if (config.config?.removeUnconfiguredLabels === true) {
      this.log.info(`Removing "${label}" from ${repo} because it's not configured.`)
      await this.endpoints.removeLabel({ repo, owner }, { name: label })
      this.log.info(`Removed label "${label}" from ${repo}.`)
    }

    return
  }
}
