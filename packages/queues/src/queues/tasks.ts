import { Queue, TaskSpec } from '../lib/queue'
import { UnionOmit } from '../lib/utils'

export type Task = TaskSpec & {
  ghInstallationId: number
  isPaidPlan: boolean
} & (
    | { kind: 'onboard_org'; org: string; accountType: string }
    | { kind: 'sync_org'; org: string }
    | { kind: 'sync_repo'; repo: string; org: string }
    | { kind: 'dryrun_config'; org: string; pr_number: number }
    | {
        kind: 'add_siblings'
        org: string
        repo: string
        issue_number: number
        label: string
      }
    | {
        kind: 'check_unconfigured_labels'
        org: string
        repo: string
        label: string
      }
  )

export interface ITaskQueue {
  /**
   * Adds a new task to the queue and returns its identifier.
   */
  push(task: UnionOmit<Task, 'id'>): Promise<string>

  /**
   * Processes the next task in the queue.
   */
  process(fn: (task: Task) => Promise<boolean>): Promise<void>
}

export class TaskQueue extends Queue<Task> implements ITaskQueue {
  constructor(url: string) {
    super('tasks', url)
  }
}
