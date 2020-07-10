/**
 * Represents a single label entity with its associated
 * repositories and groups.
 */
export type Label = {
  name: string
  color: string
  description: string
  repositories: Repository[]
  groups: LabelGroup[]
}

/**
 * Represents an identifiable collection of labels.
 */
export type LabelGroup = {
  name: string
  labels: Label[]
  repositories: Repository[]
}

/**
 * Represents a single configured repository.
 */
export type Repository = {
  name: string
  labels: Label[]
  groups: LabelGroup[]
}
