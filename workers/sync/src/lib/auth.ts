import { Octokit } from '@octokit/core'
import { createAppAuth, createOAuthUserAuth } from '@octokit/auth-app'

import { config } from './env'

/**
 * Returns an instance of Octokit that is authenticated as the
 * given installation of the app and automatically refreshes the token.
 *
 * https://github.com/octokit/auth-app.js#usage-with-octokit
 */
export const getOctokitForInstallation = (installationId: number): Octokit => {
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: { appId: config.ghAppId, privateKey: config.ghPrivateKey, installationId },
  })

  return octokit
}
