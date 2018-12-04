import * as fs from 'fs'
import * as path from 'path'
import * as Ajv from 'ajv'
import { Config } from '@prisma/github-labels-core'

/** Schema */

import schema = require('./schema.json')

const ajv = new Ajv().addMetaSchema(
  require('ajv/lib/refs/json-schema-draft-06.json'),
)
const validateSchema = ajv.compile(schema)

/**
 * Helper functions
 */

/**
 *
 * Gets labels configuration from Github repository workspace.
 * Replaces optional values with defaults if no value is provided.
 *
 * @param workspace
 */
export function getGithubLabelsConfiguration(workspace: string): Config | null {
  const configPath = path.resolve(workspace, 'labels.config.json')

  if (!fs.existsSync(configPath)) {
    return null
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

  if (!validateSchema(config)) {
    return null
  }

  return {
    strict: withDefault(false)(config.strict),
    labels: config.labels,
    branch: withDefault('master')(config.branch),
  }
}

/**
 *
 * Returns fallback if value is undefined.
 *
 * @param fallback
 */
export function withDefault<T>(fallback: T): (value: T | undefined) => T {
  return value => {
    if (value !== undefined) {
      return value
    } else {
      return fallback
    }
  }
}
