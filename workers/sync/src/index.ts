import { Syncer } from './syncer'

const syncer = new Syncer({
  redis: '',
})

syncer
  .start()
  .then(() => {
    console.log(`Started watching...  `)
  })
  .catch(() => {})

process.on('SIGINT', () => {
  syncer.stop()
  process.exit(0)
})
