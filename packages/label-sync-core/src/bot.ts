import * as probot from 'probot'
import { Config, RepositoryConfig } from './labels'
import { withDefault } from './utils'

export function getGithubBot(
  config: Config,
  logger: { log: (log: string) => any } = console,
):
  | { status: 'ok'; bot: (app: probot.Application) => void }
  | { status: 'err'; message: string } {
  /* Generates manifest */
  const manifest = generateManifest(config)

  /* Validate manifest */

  if (manifest.status !== 'ok') {
    return { status: 'err', message: manifest.message }
  }

  /* Github bot */

  const bot = (app: probot.Application) => {
    app.on('issues.labeled', async (context: probot.Context) => {
      const { owner } = context.repo()
      const issue: { number: number } = context.issue()
      const repository = context.payload.repository.full_name
      const label = context.payload.label.name

      /* Check repository configuration */
      if (!Object.keys(manifest.manifest).includes(repository)) {
        logger.log(`No such repository configuration, ${repository}.`)
        return
      }

      /* Check label siblings configuration */
      if (!Object.keys(manifest.manifest[repository]).includes(label)) {
        logger.log(`${repository}: No such label configuration, ${label}.`)
        return
      }

      /* Assign labels */
      const siblings = manifest.manifest[repository][label]

      context.github.issues.addLabels({
        repo: repository,
        owner: owner,
        number: issue.number,
        labels: siblings,
      })

      logger.log(
        /* prettier-ignore */
        `${repository}: Added ${siblings.join(', ')} to ${issue.number}.`,
      )
    })
  }

  return { status: 'ok', bot: bot }
}

export interface LabelSyncManifest {
  [repository: string]: RepositoryManifest
}

export interface RepositoryManifest {
  [label: string]: string[]
}

/**
 *
 * Generates JSON manifest of the label sync required to run Label Sync bot.
 *
 * @param config
 */
export function generateManifest(
  config: Config,
):
  | { status: 'ok'; manifest: LabelSyncManifest }
  | { status: 'err'; message: string } {
  /* Generate repository manifests */
  const manifests = Object.keys(config).map(repository =>
    generateRepositoryManifest(repository, config[repository]),
  )

  /* Validate configurations */

  const manifestErrors = manifests.filter(manifest => manifest.status === 'err')

  if (manifestErrors.length !== 0) {
    const error = manifestErrors
      // TODO: remove "as" once TS has more sophisticated type system
      .map(err => `  ${(err as { message: string }).message}`)
      .join(',\n')

    return {
      status: 'err',
      message: `Errors in manifest generation:\n${error}`,
    }
  }

  /* Generate configuration manifest */

  const manifest = manifests
    .map(
      manifest =>
        (manifest as {
          status: 'ok'
          manifest: { [repository: string]: RepositoryManifest }
        }).manifest,
    )
    .reduce((acc, manifest) => Object.assign(acc, manifest), {})

  return { status: 'ok', manifest: manifest }

  /**
   *
   * These functions help with execution of the above algorithm
   * and are only available in the local context of these functions.
   *
   */
  /**
   *
   * Generates repository manifest from repository configuration.
   *
   * @param repository
   * @param config
   */
  function generateRepositoryManifest(
    repository: string,
    config: RepositoryConfig,
  ):
    | {
        status: 'ok'
        manifest: { [repository: string]: RepositoryManifest }
      }
    | { status: 'err'; message: string } {
    /* Validate configuration */

    const labels = getRepositoryLabelNames(config)
    const siblings = getRepositoryLabelSiblings(config)

    const undefinedSiblings = siblings.filter(
      sibling => !labels.includes(sibling),
    )

    if (undefinedSiblings.length !== 0) {
      return {
        status: 'err',
        /* prettier-ignore */
        message: `${repository}: ${undefinedSiblings.join(', ')} are not defined`
      }
    }

    /* Generate manifest */

    const manifest = getRepositoryManifest(config)

    return { status: 'ok', manifest: { [repository]: manifest } }
  }
  /**
   *
   * Returns names of labels in a repository.
   *
   * @param repository
   */
  function getRepositoryLabelNames(repository: RepositoryConfig): string[] {
    return Object.keys(repository.labels)
  }

  /**
   *
   * Returns all sibling labels in a repository
   *
   * @param repository
   *
   */
  function getRepositoryLabelSiblings(repository: RepositoryConfig): string[] {
    const siblings = Object.values(repository.labels).reduce<string[]>(
      (acc, label) => {
        switch (typeof label) {
          case 'object': {
            return [...acc, ...withDefault<string[]>([])(label.siblings)]
          }
          default: {
            return acc
          }
        }
      },
      [],
    )

    return siblings
  }

  /**
   *
   * Generates repository manifest.
   *
   * @param repository
   */
  function getRepositoryManifest(
    repository: RepositoryConfig,
  ): { [label: string]: string[] } {
    const manifest = Object.keys(repository.labels).reduce((acc, labelName) => {
      const label = repository.labels[labelName]

      switch (typeof label) {
        case 'object': {
          return {
            ...acc,
            [labelName]: withDefault<string[]>([])(label.siblings),
          }
        }
        default: {
          return acc
        }
      }
    }, {})

    return manifest
  }
}
