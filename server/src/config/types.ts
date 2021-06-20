import * as zod from 'zod'

/**
 * Label represents the central unit of LabelSync. Each label
 * can have multiple siblings that are meaningfully related to
 * a label itself, multiple hooks that trigger different actions.
 */
export const LSCLabel = zod.intersection(
  zod.object({
    color: zod.string(),
  }),
  zod
    .object({
      description: zod.string().nullable(),
      siblings: zod.array(zod.string()),
      alias: zod.array(zod.string()),
    })
    .partial(),
)
export type LSCLabel = zod.infer<typeof LSCLabel>

/**
 * Repository configuration for how LabelSync should sync it.
 */
export const LSCRepositoryConfiguration = zod.object({
  removeUnconfiguredLabels: zod.boolean().default(false),
})

export interface LSCRepositoryConfiguration
  extends zod.infer<typeof LSCRepositoryConfiguration> {}

/**
 * Repository represents a single Github repository.
 * When configured as `strict` it will delete any surplus of labels
 * in the repository.
 */
export const LSCRepository = zod.intersection(
  zod.object({
    config: LSCRepositoryConfiguration.default({
      removeUnconfiguredLabels: false,
    }),
  }),
  zod.object({
    labels: zod.record(LSCLabel).transform((record) => {
      const map = new Map<string, LSCLabel>()

      for (const label in record) {
        map.set(label, record[label])
      }

      return map
    }),
  }),
)
export interface LSCRepository extends zod.infer<typeof LSCRepository> {}

/**
 * Configuration represents an entire configuration for all
 * LabelSync tools that an organisation is using.
 */
export const LSCConfiguration = zod.object({
  repos: zod.record(LSCRepository).transform((record) => {
    const map = new Map<string, LSCRepository>()

    for (const repo in record) {
      map.set(repo, record[repo])
    }

    return map
  }),
})
export interface LSCConfiguration extends zod.infer<typeof LSCConfiguration> {}
