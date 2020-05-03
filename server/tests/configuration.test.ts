import fs from 'fs'
import path from 'path'

import { parseConfig, configRepos } from '../src/configuration'

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
        undefined,
        fs.readFileSync(path, { encoding: 'utf-8' }),
      )
      expect(config).toMatchSnapshot()
    })

    test(`${config} on PAID`, () => {
      const config = parseConfig(
        {
          id: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
          company: 'ACME',
          ghAccount: 'test',
          name: 'Foo Bar',
          email: 'foo@acme.com',
        },
        fs.readFileSync(path, { encoding: 'utf-8' }),
      )
      expect(config).toMatchSnapshot()
    })
  }
})

test('repos', async () => {
  const configPath = path.resolve(
    __dirname,
    './__fixtures__/configurations/wildcard.yml',
  )
  const [, config] = parseConfig(
    {
      id: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      company: 'ACME',
      ghAccount: 'test',
      name: 'Foo Bar',
      email: 'foo@acme.com',
    },
    fs.readFileSync(configPath, { encoding: 'utf-8' }),
  )

  expect(configRepos(config!)).toEqual(['prisma-test-utils'])
})
