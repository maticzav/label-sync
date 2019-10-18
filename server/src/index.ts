import { Application } from 'probot'

import { either } from 'fp-ts/lib/Either'

import * as consts from './data/constants'
import {
  loadYAMLConfigFile,
  validateYAMLConfiguration,
} from './data/labelsync/configuration'

export default (app: Application) => {
  app.on('push', async context => {
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const ref = context.payload.ref
    const masterRef = `refs/heads/${context.payload.repository.master_branch}`

    const configurationRepo = consts.labelSyncConfigurationRepository(owner)

    /* Ignore changes in non-configuration repositories. */
    if (configurationRepo === repo) return

    /**
     * Changes made to non-master branches should result in check runs.
     * Changes made on the master branch, however, should resolve with
     * labels sync.
     */

    const yamlConfig = loadYAMLConfigFile(context.github, { owner, repo, ref })
    const lsConfig = either.map(validateYAMLConfiguration())

    /* Process configuration file. */
  })
}
