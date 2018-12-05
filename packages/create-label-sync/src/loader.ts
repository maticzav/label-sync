import * as tar from 'tar'
import * as tmp from 'tmp'
import * as github from 'parse-github-url'
import * as fs from 'fs'
import * as request from 'request'

import { Template } from './templates'

export async function loadLabelSyncTemplate(
  template: Template,
  output: string,
): Promise<
  { status: 'ok'; message: string } | { status: 'err'; message: string }
> {
  /** Generate tar information. */
  const tar = getRepositoryTarInformation(template)

  /** Download repository to tmp folder. */
  const tmp = await downloadRepository(tar)

  if (tmp.status === 'err') {
    return {
      status: 'err',
      message: tmp.message,
    }
  }

  /** Extract template from repository to dist. */
  const dist = await extractTemplateFromRepository(tmp.path, tar, output)

  if (dist.status === 'err') {
    return {
      status: 'err',
      message: dist.message,
    }
  }

  return {
    status: 'ok',
    message: 'Successfully installed template.',
  }
}

interface RepositoryTarInformation {
  uri: string
  files: string
}

/**
 *
 * Generates repository tar information.
 *
 * @param template
 */
function getRepositoryTarInformation(
  template: Template,
): RepositoryTarInformation {
  const meta = github(template.repo.uri)!

  const uri = [
    `https://api.github.com/repos`,
    meta.repo,
    'tarball',
    template.repo.branch,
  ].join('/')

  return { uri, files: template.repo.path }
}

/**
 *
 * Downloads repository tar to temporary folder.
 *
 * @param tar
 */
async function downloadRepository(
  tar: RepositoryTarInformation,
): Promise<
  { status: 'ok'; path: string } | { status: 'err'; message: string }
> {
  try {
    const tmpPath = tmp.fileSync({
      postfix: '.tar.gz',
    })

    await new Promise(resolve => {
      request(tar.uri, {
        headers: {
          'User-Agent': 'maticzav/label-sync',
        },
      })
        .pipe(fs.createWriteStream(tmpPath.name))
        .on('close', resolve)
    })

    return { status: 'ok', path: tmpPath.name }
  } catch (err) {
    return { status: 'err', message: err.message }
  }
}

/**
 *
 * Extracts repository from tar to dist.
 *
 * @param tmp
 * @param repo
 * @param output
 */
async function extractTemplateFromRepository(
  tmp: string,
  repo: RepositoryTarInformation,
  dist: string,
): Promise<{ status: 'ok' } | { status: 'err'; message: string }> {
  try {
    await tar.extract({
      file: tmp,
      cwd: dist,
      filter: path => RegExp(repo.files).test(path),
      strip: repo.files.split('/').length,
    })

    return { status: 'ok' }
  } catch (err) {
    return { status: 'err', message: err.message }
  }
}
