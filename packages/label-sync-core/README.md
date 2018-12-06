# label-sync-core

> The core module of Label Sync assistant.

`label-sync-core` equips you with all the functionallity needed to customise
Label Syncing from the ground up. It exposes two functions `handleSync` and
`generateSyncReport` which help you build delightful workflows for your application.

## Example

```ts
import { handleSync, generateSyncReport } from 'label-sync-core'
import labels from './labels'

async function main(cli: meow.Result): Promise<void> {
  const report = await handleSync(labels, {
    githubToken: process.env.GITHUB_TOKEN,
    dryRun: process.env.DRYRUN,
  })

  const humanReadableReport = generateSyncReport(report)

  console.log(humanReadableReport)
}

main(cli)
```

## Types

```ts
/**
 * Handle sync
 */

interface SyncOptions {
  dryRun: boolean
  githubToken: string
}

interface SyncReport {
  config: Config
  options: SyncOptions
  successes: RepositorySyncSuccessReport[]
  errors: RepositorySyncErrorReport[]
}

interface RepositorySyncSuccessReport {
  name: string
  config: RepositoryConfig
  additions: GithubLabel[]
  updates: GithubLabel[]
  removals: GithubLabel[]
}

interface RepositorySyncErrorReport {
  name: string
  config: RepositoryConfig
  message: string
}

declare function handleSync(
  config: Config,
  options: SyncOptions,
): Promise<SyncReport>

/**
 * Generate Sync report
 */

export declare function generateSyncReport(report: SyncReport): string
```

## License

MIT @ Matic Zavadlal
