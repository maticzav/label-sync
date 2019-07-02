import Octokit from '@octokit/rest'
import meow from 'meow'
import { handleSync, createCISyncTerminalReport } from 'label-sync-core'

/** Labels import */
import labels from './labels'

/** CLI tool */

const cli = meow(
  `

`,
  {
    flags: {
      dryrun: {
        type: 'boolean',
        default: false,
      },
      skipSiblings: {
        type: 'boolean',
        default: false,
      },
    },
  },
)

main(cli)

/**
 * Used to prevent hiting Github's abuse detection systems.
 */
const OctokitWithThrottling = Octokit.plugin(
  require('@octokit/plugin-throttling'),
)

async function main(cli: meow.Result): Promise<void> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('Missing Github credentials.')
  }

  const client = new OctokitWithThrottling({
    auth: process.env.GITHUB_TOKEN,
    headers: {
      accept: 'application/vnd.github.symmetra-preview+json',
    },
    throttle: {
      onRateLimit: () => true,
      onAbuseLimit: (
        retryAfter: number,
        options: { method: string; url: string },
      ) => {
        console.warn(
          `Abuse detected for request ${options.method} ${options.url}`,
        )
        return true
      },
    },
  })

  const report = await handleSync(client, labels, {
    dryRun: cli.flags.dryrun,
    skipSiblingSync: cli.flags.skipSiblings,
  })

  const humanReadableReport = createCISyncTerminalReport(report)

  console.log(humanReadableReport)
}
