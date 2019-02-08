export type LabelConfig =
  | {
      description?: string
      color: string
      siblings?: Sibling[]
    }
  | string

export type Sibling = string

export interface RepositoryConfig {
  strict?: boolean
  labels: { [name: string]: LabelConfig }
}
