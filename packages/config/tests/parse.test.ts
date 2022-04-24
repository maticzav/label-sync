import fs from 'fs'
import path from 'path'

import { parseConfig, getPhysicalRepositories, isConfigRepo } from '../src/'

type Plan = 'PAID' | 'FREE'

const configurationsPath = path.resolve(__dirname, './__fixtures__/configurations')
const configurations = fs.readdirSync(configurationsPath).map((config) => ({
  config: config,
  path: path.resolve(configurationsPath, config),
}))

describe('configurations:', () => {
  const plans: Plan[] = ['PAID', 'FREE']

  for (const plan of plans) {
    for (const { config, path } of configurations) {
      test(`${config} on ${plan}`, () => {
        const config = parseConfig({
          isPro: plan === 'PAID',
          input: fs.readFileSync(path, { encoding: 'utf-8' }),
        })
        expect(config).toMatchSnapshot()
      })
    }
  }
})

describe('utility functions:', () => {
  test('configRepos returns correct repositories from config', async () => {
    const configPath = path.resolve(__dirname, './__fixtures__/configurations/wildcard.yml')
    const parsedConfig = parseConfig({
      isPro: true,
      input: fs.readFileSync(configPath, { encoding: 'utf-8' }),
    })

    if (!parsedConfig.ok) {
      fail()
      return
    }

    expect(getPhysicalRepositories(parsedConfig.config)).toEqual(['prisma-test-utils'])
  })

  test('isConfigRepo', async () => {
    expect(isConfigRepo('acc', 'acc-labelsync')).toBeTruthy()
    expect(isConfigRepo('ACC', 'acc-labelsync')).toBeTruthy()
    expect(isConfigRepo('acc', 'ACC-labelsync')).toBeTruthy()
    expect(isConfigRepo('ACC', 'ACC-labelsync')).toBeTruthy()

    expect(isConfigRepo('not', 'acc-labelsync')).toBeFalsy()
  })
})
