/**
 * This file contains utility functions that we use to communicate
 * with GitHub about the files and their structure in the repository.
 */

import * as path from 'path'
import { ProbotOctokit } from 'probot'

import { Dict, mapEntriesAsync } from '../data/dict'
import { Maybe } from '../data/maybe'

type Octokit = InstanceType<typeof ProbotOctokit>

// MARK: - Methods

type BootstrapConfigRepositoryParams = {
  owner: string
  repo: string
  tree: GHTree
}

/**
 * Bootstraps a configuration repository to a prescribed destination.
 */
export async function bootstrapConfigRepository(
  github: Octokit,
  params: BootstrapConfigRepositoryParams,
) {
  await github.repos
    .createInOrg({
      org: params.owner,
      name: params.repo,
      description: 'LabelSync configuration repository.',
      auto_init: true,
    })
    .then((res) => res.data)

  const gitTree = await createGhTree(github, params)
  const masterRef = await github.git
    .getRef({ owner: params.owner, repo: params.repo, ref: 'heads/master' })
    .then((res) => res.data)

  const commit = await github.git
    .createCommit({
      owner: params.owner,
      repo: params.repo,
      message: ':sparkles: Scaffold configuration',
      tree: gitTree.sha,
      parents: [masterRef.object.sha],
    })
    .then((res) => res.data)

  const ref = await github.git.updateRef({
    owner: params.owner,
    repo: params.repo,
    ref: 'heads/master',
    sha: commit.sha,
  })

  return ref.data
}

type GetFileParams = { owner: string; repo: string; ref: string; path: string }

/**
 * Loads a file from Github.
 */
export async function getFile(
  octokit: Octokit,
  params: GetFileParams,
): Promise<Maybe<string>> {
  try {
    const res = await octokit.repos.getContent({
      owner: params.owner,
      path: params.path,
      repo: params.repo,
      ref: params.ref,
    })

    switch (res.status) {
      case 200: {
        // expect a single file
        /* istanbul ignore if */
        if (
          Array.isArray(res.data) ||
          !('content' in res.data) ||
          res.data.content === undefined ||
          res.data.content === null
        )
          return null

        return Buffer.from(res.data.content, 'base64').toString()
      }
      /* istanbul ignore next */
      default: {
        return null
      }
    }
  } catch (err) /* istanbul ignore next */ {
    return null
  }
}

/**
 * Represents a Github file/folder structure. Files should be utf-8 strings.
 */
export type GHTree = { [path: string]: string }

type CreateGHTreeParams = {
  owner: string
  repo: string
  tree: GHTree
}

/**
 * Recursively creates a tree commit by creating blobs and generating
 * trees on folders.
 */
async function createGhTree(
  github: Octokit,
  params: CreateGHTreeParams,
): Promise<{ sha: string }> {
  /**
   * Uploads blobs and creates subtrees.
   */
  const blobs = await mapEntriesAsync(getTreeFiles(params.tree), (content) =>
    createGhBlob(github, { ...params, content }),
  )
  const trees = await mapEntriesAsync(getTreeSubTrees(params.tree), (subTree) =>
    createGhTree(github, { ...params, tree: subTree }),
  )

  return github.git
    .createTree({
      owner: params.owner,
      repo: params.repo,
      tree: [
        ...Object.entries(trees).map(([treePath, { sha }]) => ({
          mode: '040000' as const,
          type: 'tree' as const,
          path: treePath,
          sha,
        })),
        ...Object.entries(blobs).map(([filePath, { sha }]) => ({
          mode: '100644' as const,
          type: 'blob' as const,
          path: filePath,
          sha,
        })),
      ],
    })
    .then((res) => res.data)
}

type CreateGHBlobParams = {
  owner: string
  repo: string
  /**
   * UTF-8 encoded content of the file.
   */
  content: string
}

/**
 * Creates a Github Blob from a File.
 */
async function createGhBlob(github: Octokit, params: CreateGHBlobParams) {
  return github.git.createBlob(params).then((res) => res.data)
}

// MARK: - Utils

/**
 * Returns the files that are not nested.
 */
function getTreeFiles(tree: GHTree): Dict<string> {
  return Object.fromEntries(
    Object.keys(tree)
      .filter(isFileInThisFolder)
      .map((name) => [name, tree[name]]),
  )
}

/**
 * Returns a dictionary of remaining subtrees.
 */
function getTreeSubTrees(tree: GHTree): Dict<GHTree> {
  return Object.keys(tree)
    .filter((p) => !isFileInThisFolder(p))
    .reduce<Dict<GHTree>>((acc, filepath) => {
      const [subTree, newFilepath] = shiftPath(filepath)
      if (!acc.hasOwnProperty(subTree)) {
        acc[subTree] = {}
      }
      acc[subTree][newFilepath] = tree[filepath]
      return acc
    }, {})
}

/**
 * Shifts path by one.
 * Returns the shifted part as first argument and remaining part as second.
 */
function shiftPath(filepath: string): [string, string] {
  const [dir, ...dirs] = filepath.split('/').filter(Boolean)
  return [dir, dirs.join('/')]
}

/**
 * Determines whether a path references a direct file
 * or a file in the nested folder.
 *
 * "/src/index.ts" -> false
 * "/index.ts" -> true
 * "index.ts" -> true
 */
function isFileInThisFolder(filePath: string): boolean {
  return ['.', '/'].includes(path.dirname(filePath))
}
