import fs from 'fs'
import path from 'path'

import { parseConfig } from '../src/configuration'

const configurationsPath = path.resolve(
  __dirname,
  './__fixtures__/configurations',
)
const configurations = fs.readdirSync(configurationsPath).map(config => ({
  config: config,
  path: path.resolve(configurationsPath, config),
}))

describe('configurations:', () => {
  for (const { config, path } of configurations) {
    test(`${config}`, () => {
      const config = parseConfig(fs.readFileSync(path, { encoding: 'utf-8' }))
      expect(config).toMatchSnapshot()
    })
  }
})
