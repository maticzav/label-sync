import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import { compile } from '../src/bin'

const fsReadFile = promisify(fs.readFile)
const fsUnlink = promisify(fs.unlink)

jest.useFakeTimers()

describe('bin', () => {
  test('compiles configuration', async () => {
    const configPath = path.resolve(__dirname, './__fixtures__/labelsync.ts')
    await compile(configPath, __dirname)

    const yamlPath = path.resolve(__dirname, 'labelsync.yml')

    const file = await fsReadFile(yamlPath, { encoding: 'utf-8' })
    await fsUnlink(yamlPath)

    expect(file).toMatchSnapshot()
  })
})
