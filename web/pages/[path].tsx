import React from 'react'
import { useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'

// MARK: - Routes

const routes: { [route: string]: string } = {
  privacy:
    'https://www.notion.so/LabelSync-s-Terms-of-Service-and-Privacy-Policy-cea6dddad9294eddb95a61fb361e5d2f',
  docs: 'https://www.notion.so/LabelSync-Docs-7c004894c8994ecfbd9fb619d2417210',
  support: 'https://www.notion.so/Support-f5a3ed3183fb40ee8d7e5835100d2a5b',
}

// MARK: - Page

export default function Redirect() {
  const router = useRouter()
  const { path } = router.query

  useEffect(() => {
    if (typeof path === 'string' && path in routes) {
      window.location.href = routes[path]
    }
  }, [])

  // MARK: - View

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <title>GitHub LabelSync</title>
      <Link href="/">
        <a>
          <img
            className="h-7 block mx-auto"
            src="/img/logos/labelsync.svg"
            alt="LabelSync Logo"
          />
        </a>
      </Link>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const path = context.query.path

  if (typeof path === 'string' && path in routes) {
    return {
      props: {},
      redirect: {
        destination: routes[path],
      },
    }
  }

  return {
    props: {},
  }
}
