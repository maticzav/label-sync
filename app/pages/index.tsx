import React, { useState } from 'react'
import Navigation from '../components/Navigation'

export default () => {
  const [foo, setFoo] = useState(false)

  return (
    <Navigation
      page="labels"
      user={{
        name: 'Matic Zavadlal',
        picture:
          'https://pbs.twimg.com/profile_images/1243972591196536832/P-yDkpPt_400x400.jpg',
      }}
    >
      <button onClick={() => setFoo(!foo)}>Change</button>
      Hey!
      {JSON.stringify({ foo })}
    </Navigation>
  )
}
