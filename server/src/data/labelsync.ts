/**
 * Configuration represents an entire configuration for all
 * LabelSync tools that an organisation is using.
 */
export type LSConfiguration = {
  repos: Map<LSRepositoryName, LSRepository>
}

/**
 * Repository represents a single Github repository.
 * When configured as `strict` it will delete any surplus of labels
 * in the repository.
 */
export type LSRepository = {
  strict: boolean
  labels: Map<LSLabelName, LSLabel>
}
export type LSRepositoryName = string

/**
 * Label represents the central unit of LabelSync. Each label
 * can have multiple siblings that are meaningfully related to
 * a label itself, multiple hooks that trigger different actions.
 */
export type LSLabel = LSLabelDefinition | LSLabelColor
export type LSLabelDefinition = {
  description?: string
  color: LSLabelColor
  siblings: LSSibling[]
  hooks: LSHook[]
}
export type LSLabelName = string
export type LSLabelColor = string

/**
 * Sibling represents a label that LabelSync should add whenever
 * a parent label is assigned to issues or pull request.
 * Siblings can only refer to labels also defined in LabelSync repository
 * configuration.
 */
export type LSSibling = string

/**
 * Represents a label hook. LabelSync triggers a label hook
 * every time a hook is added to an issues or a pull request.
 */
export type LSHook =
  /* webhooks */
  | {
      integration: 'webhook'
      endpoint: string
    }
  /* slack */
  | { integration: 'slack'; action: 'notify'; user: string }
  /* pull requests */
  | { integration: 'pr'; action: 'merge' }
  | { integration: 'pr'; action: 'close' }
