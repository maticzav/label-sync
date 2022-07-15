import { ITaskQueue, Task } from '@labelsync/queues'

export class MockTaskQueue implements ITaskQueue {
  private queue: Task[] = []

  async push(task: Omit<Task, 'id'>): Promise<string> {
    const id = Math.random().toString(36).substring(2, 15)
    this.queue.push({ id, ...task } as Task)
    return id
  }

  async process(fn: (task: Task) => Promise<void>): Promise<void> {
    let task: Task | undefined = undefined

    while ((task = this.queue.shift())) {
      await fn(task)
    }
  }
}
