#!/usr/bin/env node

import * as inquirer from 'inquirer'
import meow from 'meow'
import * as handlebars from 'handlebars'
import ora from 'ora'
import * as path from 'path'
import * as fs from 'fs'
import * as mkdirp from 'mkdirp'
import * as creato from 'creato'
import { loadTreeFromPath, mapEntries, writeTreeToPath } from './utils'

export const templates: creato.Template[] = [
  {
    name: 'YAML configuraiton',
    description: '',
    repo: {
      branch: 'master',
      path: '/templates/yaml',
      uri: 'https://github.com/maticzav/label-sync',
    },
  },
  {
    name: 'TypeScript configuration',
    description: '',
    repo: {
      branch: 'master',
      path: '/templates/typescript',
      uri: 'https://github.com/maticzav/label-sync',
    },
  },
]

const cli = meow(
  `
    create-label-sync

    > Scaffolds the configuration repostiory for Github Labels manager.
`,
  {},
)

async function main() {
  /* Owner, repository */

  const { owner } = await inquirer.prompt<{ owner: string }>([
    {
      name: 'owner',
      message: "What's your organisation name on Github?",
      type: 'input',
    },
  ])

  const repository = `${owner}-labelsync`

  /* Repositories */

  const { repositoriesRaw } = await inquirer.prompt<{
    repositoriesRaw: string
  }>([
    {
      name: 'repositoriesRaw',
      message: 'Type in your repository names comma-split:',
      type: 'input',
    },
  ])

  const repositories = repositoriesRaw
    .split(',')
    .map((repo) => repo.trim())
    .filter(Boolean)
    .map((name) => ({ name }))

  /* Template */

  const { template } = await inquirer.prompt<{ template: creato.Template }>([
    {
      name: 'template',
      message: 'Choose a LabelSync configuraiton template:',
      type: 'list',
      choices: templates.map((template) => ({
        name: template.name,
        value: template,
      })),
    },
  ])

  /* Scaffold */

  const { approve } = await inquirer.prompt<{ approve: boolean }>([
    {
      name: 'approve',
      message: `We'll scaffold configuration to ${repository}`,
      type: 'confirm',
    },
  ])

  if (!approve) return

  const dist = path.resolve(process.cwd(), repository)
  if (fs.existsSync(dist)) {
    console.log(`Directory ${dist} must be empty.`)
    return
  } else {
    mkdirp.sync(dist)
  }

  /* Load template */

  const templateSpinner = ora({
    text: `Loading ${template.name} template.`,
  }).start()

  const res = await creato.loadTemplate(template, dist)

  if (res.status === 'ok') {
    templateSpinner.succeed()
  } else {
    templateSpinner.fail()
    console.warn(res.message)
    process.exit(1)
  }

  /* Populate */

  const populateSpinner = ora({
    text: `Personalising configuration for you`,
  }).start()

  try {
    const tree = loadTreeFromPath(dist, [])
    const populatedTree = mapEntries(tree, (file) =>
      handlebars.compile(file)({ repository, repositories }),
    )
    writeTreeToPath(dist, populatedTree)

    populateSpinner.succeed()
  } catch (err) {
    templateSpinner.fail()
    console.warn(res.message)
    process.exit(1)
  }
}

/* istanbul ignore next */
if (require.main?.filename === __filename) {
  main()
}
