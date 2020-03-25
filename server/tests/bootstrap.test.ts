import fs from 'fs'
import path from 'path'

import { populateTempalte } from '../src/bootstrap'
import { loadTreeFromPath } from '../src/utils'

const templatesPath = path.resolve(__dirname, '../../templates')
const templates = fs
  .readdirSync(templatesPath)
  .map((template) => path.resolve(templatesPath, template))

describe('templates:', () => {
  const data = {
    repository: 'maticzav-labelsync',
    repositories: [
      {
        name: 'graphql-shield',
      },
      {
        name: 'label-sync',
      },
      {
        name: 'resk',
      },
    ],
  }

  for (const template of templates) {
    test('populates yaml tempalate', () => {
      const tree = loadTreeFromPath(template, [
        'dist',
        'node_modules',
        '.DS_Store',
        /.*\.log.*/,
        /.*\.lock.*/,
      ])

      expect(populateTempalte(tree, data)).toMatchSnapshot()
    })
  }
})
