#!/usr/bin/env node

import * as path from 'path'
import * as fs from 'fs'
import * as meow from 'meow'
import * as ora from 'ora'
import * as inquirer from 'inquirer'

import { loadLabelSyncTemplate } from './loader'
import { templates, Template } from './templates'

const cli = meow(
  `
    create-label-sync

    > Scaffolds the initial files of your Github Labels manager.
`,
  {},
)

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') main(cli)

/**
 * Main
 */
async function main(cli: meow.Result): Promise<void> {
  /**
   * Inquier about template
   */
  const { template } = await inquirer.prompt<{ template: Template }>([
    {
      name: 'template',
      message: 'Choose a GraphQL server template?',
      type: 'list',
      choices: templates.map(template => ({
        name: `${template.name}    ${template.description}`,
        value: template,
      })),
    },
  ])

  const { dist } = await inquirer.prompt<{ dist: string }>([
    {
      name: 'dist',
      message: 'Where should we scaffold graphql server?',
      type: 'input',
    },
  ])

  if (fs.existsSync(dist)) {
    console.log(`Directory ${dist} must be empty.`)
    return
  } else {
    fs.mkdirSync(dist)
  }

  /**
   * Load template
   */
  const spinner = ora({
    text: `Loading ${template.name} template.`,
  }).start()

  const res = await loadLabelSyncTemplate(
    template,
    path.resolve(process.cwd(), dist),
  )

  if (res.status === 'ok') {
    spinner.succeed()
    console.log(res.message)
  } else {
    spinner.fail()
    console.warn(res.message)
  }
}
