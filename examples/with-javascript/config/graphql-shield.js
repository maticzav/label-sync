const commons = require('./commons')

module.exports = {
  labels: {
    ...commons,
    specific: {
      color: '222222',
      description: 'Specific to GraphQL Shield.',
    },
  },
  strict: false,
}
