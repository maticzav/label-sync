import * as meow from 'meow'
import { handleSync, generateSyncReport } from 'label-sync-core'

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
    },
  },
)

main(cli)

/**
 * Main
 */

async function main(cli: meow.Result): Promise<void> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('Missing Github credentials.')
  }

  const report = await handleSync(labels, {
    githubToken: process.env.GITHUB_TOKEN,
    dryRun: cli.flags.dryrun,
  })

  const humanReadableReport = generateSyncReport(report)

  console.log(humanReadableReport)
}
