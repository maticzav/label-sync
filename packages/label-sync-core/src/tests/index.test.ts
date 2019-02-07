test('I can import index.', () => {
  try {
    require('../')
  } catch (err) {
    fail("Couldn't load index")
  }
})
