import { Queue, TaskSpec } from '../src/lib/queue'

type TestTask = TaskSpec & {
  task: number
}

describe('queue', () => {
  let queue: Queue<TestTask>

  beforeEach(async () => {
    const name = Math.random().toString(32)
    queue = new Queue(name, 'redis://localhost:6379')

    await queue.start()
  })

  afterEach(async () => {
    await queue?.dispose()
  })

  test('pushes a task to the queue', async () => {
    const starttasks = await queue.list()
    expect(starttasks).toHaveLength(0)

    await queue.push({ dependsOn: [], task: 42 })

    const tasks = await queue.list()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].task).toBe(42)
  })

  test('processes tasks from the queue', async () => {
    const trace: [string, number][] = []

    const a = await queue.push({ dependsOn: [], task: 10 })
    await queue.push({ dependsOn: [a], task: 15 })
    await queue.push({ dependsOn: [], task: 5 })
    await queue.push({ dependsOn: [], task: 92 })

    const tasks = await queue.list()
    expect(tasks).toHaveLength(4)

    const processor = (name: string) => async (task: TestTask) => {
      trace.push([name, task.task])

      // Waits the number of units specified in the task.
      await new Promise((resolve) => setTimeout(resolve, task.task * 10))

      return trace.length < 4
    }

    await Promise.all([
      // We run two parallel processors at the same time.
      queue.process(processor('one')),
      queue.process(processor('two')),
    ])

    expect(trace).toEqual([
      ['one', 10],
      ['two', 5],
      ['two', 92],
      ['one', 15],
    ])
  })
})
