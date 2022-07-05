import { Queue, TaskSpec } from '../lib/queue'

export type Task = TaskSpec & {
  ghInstallationId: number
  isPaidPlan: boolean
} & (
    | { kind: 'onboard_org'; org: string; accountType: string }
    | { kind: 'sync_org'; org: string }
    | { kind: 'sync_repo'; org: string; repo: string }
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
export class TaskQueue extends Queue<Task> {
  constructor(url: string) {
    super('tasks', url)
  }

  /**
   * Adds a new task to the queue and returns its identifier.
   */
  public async push(task: Omit<Task, 'id'>): Promise<string> {
    return super.push(task)
  }

  /**
   * Processes the next task in the queue.
   */
  public async process(fn: (task: Task) => Promise<void>) {
    await super.process(fn)
  }
}
