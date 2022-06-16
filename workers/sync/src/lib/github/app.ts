import { Octokit } from '@octokit/core'
import { DateTime } from 'luxon'
import jwt from 'jsonwebtoken'

export class GitHubApp {
  /**
   * Application ID
   */
  private id: string

  /**
   * PrivateKey used to authenticate the GitHub app.
   */
  private privatekey: string

  /**
   * Cached GitHub Application client.
   */
  private client: { octokit: Octokit; ttl: DateTime } | null

  /**
   * Light cache of installation authentication keys.
   */
  private installations: { [id: number]: { token: string; ttl: DateTime } }

  constructor(id: string, key: string) {
    this.id = id
    this.privatekey = key
    this.installations = {}
    this.client = null
  }

  /**
   * Generates an authentication token for this app.
   */
  private authenticate(): Octokit {
    // Check if the current instance is still valid.
    if (this.client && DateTime.now() < this.client.ttl) {
      return this.client.octokit
    }

    // Issued at time, 60 seconds in the past to allow for clock drift
    const iat = DateTime.now().minus({ seconds: 60 })
    // JWT expiration time (10 minute maximum)
    const exp = DateTime.now().plus({ minutes: 10 })

    const payload = { iat: iat.toSeconds(), exp: exp.toSeconds(), iss: this.id }
    const token = jwt.sign(payload, this.privatekey, { algorithm: 'RS256' })

    const octokit = new Octokit({
      auth: token,
      userAgent: 'labelsyncauth/2.0.0',
    })

    this.client = { octokit, ttl: exp }

    return octokit
  }

  /**
   * Creates a new authentication for an installation.
   */
  async getInstallationToken(installation: number): Promise<{ token: string; ttl: DateTime }> {
    const time = DateTime.now()
    if (installation in this.installations && time < this.installations[installation].ttl) {
      return this.installations[installation]
    }

    const { token, expires_at } = await this.authenticate()
      .request('POST /app/installations/{installation_id}/access_tokens', {
        installation_id: installation,
      })
      .then((res) => res.data)

    this.installations[installation] = { token, ttl: DateTime.fromISO(expires_at) }
    return this.installations[installation]
  }
}
