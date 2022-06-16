import { Queue } from '../lib/queue'

export type Task =
  | { kind: 'onboard'; organisation: string }
  | { kind: 'sync.repository'; organisation: string }
  | { kind: 'sync.issue'; organisation: string; repository: string; issue: number }

export class TaskQueue extends Queue<Task> {
  constructor(url: string) {
    super('tasks', url)
  }

  public async push(task: Task) {
    await super.push(task)
  }

  public async process(fn: (task: Task) => Promise<void>) {
    await super.process(fn)
  }
}
