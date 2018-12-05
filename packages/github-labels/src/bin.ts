#!/usr/bin/env node

import * as meow from 'meow'
import { main } from './manager'

const cli = meow(
  `
Usage
  $ labels

Options
  --config Path to your configuration file.
  --dryrun Simulate sync to get information about potential changes.

Examples
  $ labels --config labels.config.js
`,
  {
    flags: {
      config: {
        type: 'string',
        alias: 'c',
      },
      dryrun: {
        type: 'boolean',
        default: false,
      },
    },
  },
)

/* istanbul ignore next */
main(cli.flags.config, { dryrun: cli.flags.dryrun }).then(res => {
  if (res.status === 'ok') {
    console.log(res.message)
  } else {
    console.warn(res.message)
  }
})
