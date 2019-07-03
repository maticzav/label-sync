import {
  LabelSyncReport,
  createTerminalReport,
} from '../../../src/handlers/labels'

describe('label sync reporter', () => {
  test('generates correct empty report', async () => {
    const report: LabelSyncReport = {
      config: {
        labels: {},
        strict: false,
      },
      options: { dryRun: true },
      repository: {
        name: 'label-sync',
        owner: {
          login: 'maticzav',
        },
        full_name: 'maticzav/label-sync',
      },
      additions: [],
      updates: [],
      removals: [],
    }

    const message = createTerminalReport(report)

    expect(message).toMatchSnapshot()
  })

  test('correctly generates empty additions report', async () => {
    const report: LabelSyncReport = {
      config: {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
        strict: true,
      },
      options: { dryRun: false },
      repository: {
        name: 'label-sync',
        owner: {
          login: 'maticzav',
        },
        full_name: 'maticzav/label-sync',
      },
      additions: [],
      updates: [
        { color: 'f266f4', default: false, description: '', name: 'basic' },
      ],
      removals: [
        { color: 'f266f4', default: false, description: '', name: 'basic' },
      ],
    }

    expect(createTerminalReport(report)).toMatchSnapshot()
  })

  test('correctly generates empty updates report', async () => {
    const report: LabelSyncReport = {
      config: {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
        strict: true,
      },
      options: { dryRun: false },
      repository: {
        name: 'label-sync',
        owner: {
          login: 'maticzav',
        },
        full_name: 'maticzav/label-sync',
      },
      additions: [
        { color: 'f266f4', default: false, description: '', name: 'basic' },
      ],
      updates: [],
      removals: [
        { color: 'f266f4', default: false, description: '', name: 'basic' },
      ],
    }

    expect(createTerminalReport(report)).toMatchSnapshot()
  })

  test('correctly generates empty removals report', async () => {
    const report: LabelSyncReport = {
      config: {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
        strict: true,
      },
      options: { dryRun: false },
      repository: {
        name: 'label-sync',
        owner: {
          login: 'maticzav',
        },
        full_name: 'maticzav/label-sync',
      },
      additions: [
        { color: 'f266f4', default: false, description: '', name: 'basic' },
      ],
      updates: [
        { color: 'f266f4', default: false, description: '', name: 'basic' },
      ],
      removals: [],
    }

    expect(createTerminalReport(report)).toMatchSnapshot()
  })

  test('correctly generates report', async () => {
    const report: LabelSyncReport = {
      config: {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '#123456',
          },
        },
        strict: true,
      },
      options: { dryRun: false },
      repository: {
        name: 'label-sync',
        owner: {
          login: 'maticzav',
        },
        full_name: 'maticzav/label-sync',
      },
      additions: [
        {
          color: '#123456',
          description: 'Testing sync.',
          name: 'test',
          default: false,
        },
      ],
      updates: [],
      removals: [
        {
          color: '333333',
          default: false,
          description: '',
          name: 'bug/no-reproduction',
        },
        { color: 'f266f4', default: false, description: '', name: 'basic' },
        { color: '333333', default: false, description: '', name: 'kind/bug' },
      ],
    }

    expect(createTerminalReport(report)).toMatchSnapshot()
  })
})
