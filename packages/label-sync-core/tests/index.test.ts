test('I can import index.', () => {
  try {
    require('../src')
  } catch (err) {
    throw err
  }
})
