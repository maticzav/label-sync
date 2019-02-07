test('I can import index.', () => {
  try {
    require('../src')
  } catch (err) {
    fail("Couldn't load index")
  }
})
