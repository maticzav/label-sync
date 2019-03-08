import { RepositoryConfig } from '@label-sync/core'

declare global {
  function repository(repo: string, config: RepositoryConfig): void
}
