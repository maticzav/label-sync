import yaml from 'yaml'
import { Application } from 'probot'

import * as cons from './data/constants'
import { log } from './loggers'
import { validateYAMLConfiguration } from './configuration'
import { loadYAMLLSConfiguration } from './data/labelsync/configuration'

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

    const config = loadYAMLLSConfiguration(context.github, { owner, repo, ref })

    /* Process configuration file. */
  })
}
