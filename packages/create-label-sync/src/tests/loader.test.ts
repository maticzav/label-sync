import * as tar from 'tar'
import * as fs from 'fs'
import * as tmp from 'tmp'
import * as path from 'path'
import * as mkdirp from 'mkdirp'

import { loadLabelSyncTemplate } from '../loader'

describe('bin', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('loadLabelSyncTemplate loads template correctly', async () => {
    const res = await loadLabelSyncTemplate(
      {
        name: 'test-template',
        description: 'test-description',
        repo: {
          branch: 'test-branch',
          uri: 'test-uri',
          path: 'test-path',
        },
      },
      'path',
    )

    expect(res).toEqual({
      status: 'ok',
      message: 'Successfully installed template.',
    })
  })

  test('loadLabelSyncTemplate returns error on bad download', async () => {
    /**
     * Mocks
     */

    const mockTmpFileSync = jest
      .spyOn(tmp, 'fileSync')
      .mockImplementation(() => {
        throw new Error('pass')
      })

    /**
     * Execution
     */

    const res = await loadLabelSyncTemplate(
      {
        name: 'test-template',
        description: 'test-description',
        repo: {
          branch: 'test-branch',
          uri: 'test-uri',
          path: 'test-path',
        },
      },
      'path',
    )

    /**
     * Tests
     */

    expect(mockTmpFileSync).toBeCalledTimes(1)
    expect(res).toEqual({
      status: 'err',
      message: 'pass',
    })
  })

  test('loadLabelSyncTemplate returns error on bad unzip', async () => {
    /**
     * Mocks
     */

    const mockTarExtract = jest.spyOn(tar, 'extract').mockImplementation(() => {
      throw new Error('pass')
    })

    /**
     * Execution
     */

    const res = await loadLabelSyncTemplate(
      {
        name: 'test-template',
        description: 'test-description',
        repo: {
          branch: 'test-branch',
          uri: 'test-uri',
          path: 'test-path',
        },
      },
      'path',
    )

    /**
     * Tests
     */

    expect(mockTarExtract).toBeCalledTimes(1)
    expect(res).toEqual({
      status: 'err',
      message: 'pass',
    })
  })

  test('loads the template correctly', async () => {
    /**
     * Setup dist
     */
    const dist = path.resolve(__dirname, './__tmp__/template')

    console.log({ dist })
    try {
      mkdirp.sync(dist)
    } catch (err) {
      console.warn(err)
    }

    /**
     * Test
     */

    try {
      const res = await loadLabelSyncTemplate(
        {
          name: 'json',
          description: 'JSON template with basic CircleCI config.',
          repo: {
            uri: 'https://github.com/maticzav/label-sync',
            branch: 'master',
            path: '/examples/with-circleci',
          },
        },
        dist,
      )

      expect(res).toEqual({
        status: 'ok',
        message: 'Successfully installed template.',
      })
      expect(fs.existsSync(path.resolve(dist, 'package.json'))).toBe(true)
    } catch (err) {
      throw err
      fail()
    }
  })
})
