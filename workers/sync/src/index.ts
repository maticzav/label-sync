import { Syncer } from './syncer'

const watch = new Syncer({
  credentials: {
    bitQueryToken: 'BQYo9LejuTvc3XmESV3tuy1O1gjh9WfP',
    infuraKey: '',
  },
  executor: {
    address: '',
  },
})

console.log(`Started watching...  `)

process.on('SIGINT', () => {
  watch.stop()
  process.exit(0)
})
