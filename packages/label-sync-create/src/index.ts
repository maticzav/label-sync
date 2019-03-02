#!/usr/bin/env node

import path from 'path'
import fs from 'fs'
import meow from 'meow'
import ora from 'ora'
import inquirer from 'inquirer'
import mkdirp from 'mkdirp'

import { loadTemplate, Template } from 'creato'
import { templates } from './templates'

meow(
  `
    create-label-sync

    > Scaffolds the initial files of your Github Labels manager.
`,
  {},
)

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') main()

/**
 * Main
 */
export async function main(): Promise<void> {
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

  const absoluteDist = path.resolve(process.cwd(), dist)

  if (fs.existsSync(absoluteDist)) {
    console.log(`Directory ${absoluteDist} must be empty.`)
    return
  } else {
    mkdirp.sync(absoluteDist)
  }

  /**
   * Load template
   */
  const spinner = ora({
    text: `Loading ${template.name} template.`,
  }).start()

  const res = await loadTemplate(template, absoluteDist)

  if (res.status === 'ok') {
    spinner.succeed()
    console.log(res.message)
  } else {
    spinner.fail()
    console.warn(res.message)
  }
}
