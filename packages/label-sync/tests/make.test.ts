import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import * as ls from '../src'
import { make } from '../src'

const fsReadFile = promisify(fs.readFile)
const fsUnlink = promisify(fs.unlink)

const config = ls.configuration({
  repositories: {
    'prisma-test-utils': ls.repository({
      strict: false,
      labels: {
        'bug/0-needs-reproduction': ls.label('#ff0022'),
        'bug/1-has-reproduction': ls.label({
          color: '#ff0022',
          description: 'Indicates that an issue has reproduction',
        }),
        'bug/2-bug-confirmed': ls.label('red'),
        'bug/3-fixing': ls.label({
          color: '00ff22',
          description: 'Indicates that we are working on fixing the issue.',
        }),
      },
    }),
    'label-sync': ls.repository({
      strict: false,
      labels: {
        'bug/0-needs-reproduction': ls.label('#ff0022'),
        'bug/1-has-reproduction': ls.label({
          color: '#ff0022',
          description: 'Indicates that an issue has reproduction',
        }),
        'bug/2-bug-confirmed': ls.label('red'),
        'bug/3-fixing': ls.label({
          color: '00ff22',
          description: 'Indicates that we are working on fixing the issue.',
        }),
      },
    }),
  },
})

describe('make', () => {
  test('compiles configuration to path', async () => {
    const yamlPath = path.resolve(__dirname, 'labelsync.yml')

    await make({
      configs: [config],
      outputs: {
        config: yamlPath,
      },
    })

    const file = await fsReadFile(yamlPath, { encoding: 'utf-8' })
    await fsUnlink(yamlPath)

    expect(file).toMatchSnapshot()
  })

  test('compiles configuration to default path', async () => {
    await make(
      {
        configs: [config],
      },
      __dirname,
    )

    const yamlPath = path.resolve(__dirname, 'labelsync.yml')
    const file = await fsReadFile(yamlPath, { encoding: 'utf-8' })
    await fsUnlink(yamlPath)

    expect(file).toMatchSnapshot()
  })
})
