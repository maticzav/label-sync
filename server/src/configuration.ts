import joi from '@hapi/joi'

import * as either from './data/either'
import * as ls from './data/labelsync'

/* Schema */

const lsSibling = joi.string()

const lsHook = joi.alternatives(
  /* Webhook integration */
  joi.object().keys({
    integration: 'webhook',
    enpoint: joi
      .string()
      .uri()
      .required(),
  }),
  /* Slack integrations */
  joi.object().keys({
    integration: 'slack',
    action: 'notify',
    user: joi.string().required(),
  }),
  /* PR manager */
  joi.object().keys({
    integration: 'pr',
    action: joi.alternatives('merge', 'close'),
  }),
)

const lsLabel = joi.object().keys({
  description: joi.string(),
  color: joi
    .string()
    .regex(/\#\w\w\w\w\w\w/)
    .required(),
  siblings: joi
    .array()
    .items(lsSibling)
    .default([]),
  hooks: joi
    .array()
    .items(lsHook)
    .default([]),
})

const lsRepository = joi.object().keys({
  strict: joi.boolean().default(false),
  labels: joi
    .object()
    .pattern(/.*/, lsLabel)
    .required(),
})

const lsConfiguration = joi.object().keys({
  repos: joi
    .object()
    .pattern(/.*/, lsRepository)
    .required(),
})

/* Validation */

/**
 * Processes a decoded YAML configuration. It doesn't perform
 * any content checks.
 *
 * @param yaml
 */
export function validateYAMLConfiguration(yaml: object): ls.LSConfiguration {
  const { error, errors, warnings, value } = lsConfiguration.validate(yaml)
  return
}
