import React from 'react'
import { UserButton } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function Queue() {
  useEffect(() => {
    fetch('/api/queue')
      .then((res) => {
        console.log(res.body)
      })
      .catch((err) => {
        console.error(err)
      })
  }, [])

  return (
    <>
      <h1>Admin Queue</h1>
      <UserButton />
    </>
  )
}
