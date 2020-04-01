import fs from 'fs'
import path from 'path'

import { parseConfig } from '../src/configuration'

const configurationsPath = path.resolve(
  __dirname,
  './__fixtures__/configurations',
)
const configurations = fs.readdirSync(configurationsPath).map((config) => ({
  config: config,
  path: path.resolve(configurationsPath, config),
}))

describe('configurations:', () => {
  for (const { config, path } of configurations) {
    test(`${config} on FREE`, () => {
      const config = parseConfig(
        {
          id: 'id',
          createdAt: new Date(),
          updatedAt: new Date(),
          email: 'email',
          owner: 'test',
          plan: 'free',
          type: 'USER',
          trial: false,
          planId: 3,
          tier: 'FREE',
        },
        fs.readFileSync(path, { encoding: 'utf-8' }),
      )
      expect(config).toMatchSnapshot()
    })

    test(`${config} on BASIC`, () => {
      const config = parseConfig(
        {
          id: 'id',
          createdAt: new Date(),
          updatedAt: new Date(),
          email: 'email',
          owner: 'test',
          plan: 'free',
          type: 'USER',
          trial: false,
          planId: 3,
          tier: 'BASIC',
        },
        fs.readFileSync(path, { encoding: 'utf-8' }),
      )
      expect(config).toMatchSnapshot()
    })
  }
})
