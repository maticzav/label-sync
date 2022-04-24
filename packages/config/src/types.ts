import { z } from 'zod'

/**
 * Label represents the central unit of LabelSync. Each label
 * can have multiple siblings that are meaningfully related to
 * a label itself, multiple hooks that trigger different actions.
 */
export const LSCLabel = z.object({
  color: z.string(),
  description: z.string().optional(),
  siblings: z.array(z.string()).optional(),
  alias: z.array(z.string()).optional(),
  scope: z.array(z.string()).optional(),
})

export type LSCLabel = z.infer<typeof LSCLabel>

export const LSCLabelName = z.string()
export type LSCLabelName = z.infer<typeof LSCLabelName>

/**
 * Repository configuration for how LabelSync should sync it.
 */
const LSCRepositoryConfiguration = z.object({
  removeUnconfiguredLabels: z.boolean().optional(),
})
export interface LSCRepositoryConfiguration extends z.infer<typeof LSCRepositoryConfiguration> {}

/**
 * Repository represents a single Github repository.
 * When configured as `strict` it will delete any surplus of labels
 * in the repository.
 */
export const LSCRepository = z.object({
  config: LSCRepositoryConfiguration.optional(),
  labels: z.record(LSCLabelName, LSCLabel),
})
export interface LSCRepository extends z.infer<typeof LSCRepository> {}

export const LSCRepositoryName = z.string()
export type LSCRepositoryName = z.infer<typeof LSCRepositoryName>

/**
 * Configuration represents an entire configuration for all
 * LabelSync tools that an organisation is using.
 */
export const LSCConfiguration = z.object({
  repos: z.record(LSCRepositoryName, LSCRepository),
})
export interface LSCConfiguration extends z.infer<typeof LSCConfiguration> {}
