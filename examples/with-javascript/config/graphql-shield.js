const commons = require('./commons')

module.exports = {
  labels: {
    ...commons,
    specific: {
      color: 'red',
      description: 'Specific to GraphQL Shield.',
    },
  },
  strict: false,
}
