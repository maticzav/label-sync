import yaml from 'yaml'
import { Application } from 'probot'

import * as cons from './constants'
import { log } from './loggers'

/**
 * Probot webhook.
 */
export default (app: Application) => {
  app.on('push', async context => {
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const ref = context.payload.ref
    const masterRef = `refs/heads/${context.payload.repository.master_branch}`

    const configurationRepo = cons.labelSyncConfigurationRepository(owner)

    /* Ignore changes in non-configuration repositories. */
    if (configurationRepo === repo) return

    /**
     * Changes made to non-master branches should result in check runs.
     * Changes made on the master branch, however, should resolve with
     * labels sync.
     */

    const rawConfig = await context.github.repos.getContents({
      owner: owner,
      path: cons.labelSyncConfigurationFilePath,
      repo: repo,
      ref: ref,
    })

    switch (rawConfig.status) {
      case 200: {
        /* Validate configuration file. */
        if (Array.isArray(rawConfig.data) || !rawConfig.data.content) {
          log.uservalidation(`received a list instead of a file.`)
        } else {
          const buffer = Buffer.from(
            rawConfig.data.content,
            'base64',
          ).toString()
          const yamlConfig = yaml.parse(buffer, {})
        }
      }
      default: {
        /* Process the error status. */
        log.uservalidation(config.data)
      }
    }

    /* Process configuration file. */
  })
}
