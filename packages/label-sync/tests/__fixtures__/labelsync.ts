import * as ls from '../../src'

export default ls.configuration({
  repositories: {
    'prisma-test-utils': ls.repository({
      strict: false,
      labels: {
        'bug/0-needs-reproduction': ls.label('#ff0022'),
        'bug/1-has-reproduction': ls.label({
          color: '#ff0022',
          description: 'Indicates that an issue has reproduction',
        }),
        'bug/2-bug-confirmed': ls.label('red'),
        'bug/3-fixing': ls.label({
          color: '00ff22',
          description: 'Indicates that we are working on fixing the issue.',
        }),
      },
    }),
    'label-sync': ls.repository({
      strict: false,
      labels: {
        'bug/0-needs-reproduction': ls.label('#ff0022'),
        'bug/1-has-reproduction': ls.label({
          color: '#ff0022',
          description: 'Indicates that an issue has reproduction',
        }),
        'bug/2-bug-confirmed': ls.label('red'),
        'bug/3-fixing': ls.label({
          color: '00ff22',
          description: 'Indicates that we are working on fixing the issue.',
        }),
      },
    }),
  },
})
