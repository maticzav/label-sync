import { parseConfig } from '@labelsync/config'
import _ from 'lodash'

import { Processor } from '../lib/processor'

type ProcessorData = {
  owner: string
  repo: string
  issue_number: number
  label: string
  isPro: boolean
}

export class SiblingsProcessor extends Processor<ProcessorData> {
  /**
   * Syncs the configuration of a repository with its labels.
   */
  public async perform({ owner, repo, label, issue_number, isPro }: ProcessorData): Promise<void> {
    this.log.info(`${issue_number} labeled with "${label}" in ${owner}/${repo}...`)

    const rawConfig = await this.endpoints.getConfig({ owner })
    if (rawConfig === null) {
      this.log.info(`No configuration, skipping siblings sync.`)
      return
    }
    const parsedConfig = parseConfig({ input: rawConfig, isPro })

    if (!parsedConfig.ok) {
      this.log.info(parsedConfig, `Invalid configuration, skipping siblings sync.`)
      return
    }

    this.log.info(parsedConfig, `Successfully parsed organization configuration!`)
    const config = parsedConfig.config.repos[repo]

    /* istanbul ignore if */
    if (!config) {
      this.log.info(`No configuration found for the repo, skipping.`)
      return
    }

    if (label in config.labels) {
      const siblings = _.get(config, ['labels', label, 'siblings'], [] as string[])

      /* istanbul ignore if */
      if (siblings.length === 0) {
        this.log.info(`No siblings to add to "${label}", skipping.`)
        return
      }

      const labels = siblings.map((sibling) => ({ name: sibling }))
      await this.endpoints.addLabelsToIssue({ repo, owner }, { issue_number, labels })

      return
    }

    this.log.info(`Unconfigured label "${label}", nothing to do.`)
    return
  }
}
