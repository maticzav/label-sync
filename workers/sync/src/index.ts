import { Worker } from './worker'

const worker = new Worker()

worker
  .start()
  .then(() => {
    console.log(`Started watching...  `)
  })
  .catch(() => {})

process.on('SIGINT', () => {
  worker.stop()
  process.exit(0)
})
