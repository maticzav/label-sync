import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import { parseConfig } from '@labelsync/config'

import * as ls from '../src'
import { labelsync } from '../src'

const fsReadFile = promisify(fs.readFile)
const fsUnlink = promisify(fs.unlink)

describe('make:', () => {
  test('compiles configuration to path', async () => {
    const yamlPath = path.resolve(__dirname, 'labelsync.yml')

    labelsync(
      {
        repos: {
          'prisma-test-utils': ls.repo({
            config: {
              removeUnconfiguredLabels: true,
            },
            labels: [ls.label('bug/0-needs-reproduction', '#ff0022')],
          }),
        },
      },
      yamlPath,
    )

    const file = await fsReadFile(yamlPath, { encoding: 'utf-8' })
    await fsUnlink(yamlPath)

    expect(file).toMatchSnapshot()
  })

  test('integration test: compiles configuration to default path', async () => {
    const yamlPath = path.resolve(__dirname, './__fixtures__/labelsync.yml')

    labelsync(
      {
        repos: {
          'prisma-test-utils': ls.repo({
            config: {
              removeUnconfiguredLabels: true,
            },
            labels: [
              ls.label('kind/bug', '#02f5aa'),
              ls.label({
                name: 'bug/1-has-reproduction',
                color: '#ff0022',
                description: 'Indicates that an issue has reproduction',
                alias: ['bug'],
                siblings: ['kind/bug'],
              }),
              ls.type('bug', '#ff0022'),
            ],
          }),
          changed: ls.repo({
            config: {
              removeUnconfiguredLabels: true,
            },
            labels: [
              ls.label('kind/bug', '02f5aa'),
              ls.label({
                name: 'bug/1-has-reproduction',
                color: '#ff0022',
                description: 'Indicates that an issue has reproduction',
                alias: ['bug'],
                siblings: ['kind/bug'],
              }),
            ],
          }),
        },
      },
      undefined,
      path.resolve(__dirname, './__fixtures__/'),
    )

    const file = await fsReadFile(yamlPath, { encoding: 'utf-8' })
    await fsUnlink(yamlPath)

    expect(file).toMatchSnapshot()

    const config = parseConfig({
      input: file,
      isPro: true,
    })

    expect(config).toMatchSnapshot()
  })
})
