import fs from 'fs'
import path from 'path'

import { parse, configRepos, isConfigRepo } from '../src/config/index'
import { Plan } from '@prisma/client'

const configurationsPath = path.resolve(
  __dirname,
  './__fixtures__/configurations',
)
const configurations = fs.readdirSync(configurationsPath).map((config) => ({
  config: config,
  path: path.resolve(configurationsPath, config),
}))

// MARK: - Tests

describe('configurations', () => {
  const plans: Plan[] = ['PAID', 'FREE']

  for (const plan of plans) {
    for (const { config, path } of configurations) {
      test(`${config} on ${plan}`, () => {
        const result = parse({
          plan,
          input: fs.readFileSync(path, { encoding: 'utf-8' }),
        })

        expect(result).toMatchSnapshot()
      })
    }
  }
})

describe('utilities', () => {
  test('configRepos returns correct repositories from config', async () => {
    const configPath = path.resolve(
      __dirname,
      './__fixtures__/configurations/wildcard.yml',
    )

    const [err, config] = parse({
      plan: 'PAID',
      input: fs.readFileSync(configPath, { encoding: 'utf-8' }),
    })

    if (err !== null) fail(err)
    expect(configRepos(config!)).toEqual(['prisma-test-utils'])
  })

  test('isConfigRepo', async () => {
    expect(isConfigRepo('acc', 'acc-labelsync')).toBeTruthy()
    expect(isConfigRepo('ACC', 'acc-labelsync')).toBeTruthy()
    expect(isConfigRepo('acc', 'ACC-labelsync')).toBeTruthy()
    expect(isConfigRepo('ACC', 'ACC-labelsync')).toBeTruthy()

    expect(isConfigRepo('not', 'acc-labelsync')).toBeFalsy()
  })
})
