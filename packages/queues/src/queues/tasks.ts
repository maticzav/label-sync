import { Queue, TaskSpec } from '../lib/queue'
import { UnionOmit, UnionShare } from '../lib/utils'

type SharedTaskInfo = TaskSpec & {
  ghInstallationId: number
}
export type Task = UnionShare<
  | { kind: 'onboard_org'; org: string; accountType: string }
  | { kind: 'sync_org'; org: string; isPaidPlan: boolean }
  | { kind: 'sync_repo'; repo: string; org: string; isPaidPlan: boolean }
  | { kind: 'dryrun_config'; org: string; pr_number: number; isPaidPlan: boolean }
  | {
      kind: 'add_siblings'
      org: string
      repo: string
      issue_number: number
      label: string
      isPaidPlan: boolean
    }
  | {
      kind: 'check_unconfigured_labels'
      org: string
      repo: string
      label: string
      isPaidPlan: boolean
    },
  SharedTaskInfo
>

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
