import { HashtagIcon, CloudIcon, LibraryIcon } from '@heroicons/react/outline'
import { TagIcon } from '@heroicons/react/solid'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Header } from 'components/admin/Header'
import { SelectInput } from 'components/SelectInput'
import { Table } from 'components/Table'
import { TextInput } from 'components/TextInput'

import type { Task } from '@labelsync/queues'
import { Button } from 'components/Button'
import { UnionOmit } from 'lib/utils'
import { LoadingIndicator } from 'components/LoadingIndicator'

/**
 * Admin dashboard page.
 */
export default function Admin() {
  const timer = useRef<NodeJS.Timer | null>()

  const [queue, setQueue] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>()

  useEffect(() => {
    timer.current = setInterval(() => {
      fetch('/api/queue/list')
        .then((res) => res.json())
        .then((data) => setQueue(data.list))
        .catch((err) => {
          console.error(err)
        })
    }, 1000)

    return () => {
      if (timer.current) {
        clearInterval(timer.current)
      }
    }
  }, [])

  const [kind, setKind] = useState<Task['kind']>('sync_org')
  const [id, setId] = useState<string>('')
  const [org, setOrg] = useState<string>('')
  const [repo, setRepo] = useState<string>('')
  const [accountType, setAccountType] = useState<string>('')
  const [prNumber, setPrNumber] = useState<string>('')

  const pushtask = useCallback(() => {
    let data: UnionOmit<Task, 'id' | 'dependsOn' | 'ghInstallationId'>
    switch (kind) {
      case 'sync_org': {
        data = { kind: 'sync_org', org, isPaidPlan: true }
        break
      }
      case 'sync_repo': {
        data = { kind: 'sync_repo', org, repo, isPaidPlan: true }
        break
      }
      case 'onboard_org': {
        data = { kind: 'onboard_org', org, isPaidPlan: true, accountType }
        break
      }
      case 'dryrun_config': {
        data = { kind: 'dryrun_config', org, isPaidPlan: true, pr_number: parseInt(prNumber) }
        break
      }
      default: {
        throw new Error(`Unimplemented kind "${kind}"!`)
      }
    }

    setLoading(true)

    fetch('/api/queue/add', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        ghInstallationId: parseInt(id),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false)

        if ('message' in data) {
          setError(data.message)
          return
        }
        setError(null)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }, [id, org, repo, kind, accountType, prNumber])

  return (
    <>
      <Header />
      <div className="py-10">
        <header className="mb-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Admin Dashboard</h1>
          </div>
        </header>

        <main>
          {/* Content */}

          <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h1 className="text-xl font-semibold text-gray-900">Push a Task</h1>
                <p className="mt-2 text-sm text-gray-700">
                  Create a new task and push it to the queue
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-1">
                <SelectInput
                  name="kind"
                  label="Task Kind"
                  value={kind}
                  options={[
                    { label: 'Sync Organization', value: 'sync_org' },
                    { label: 'Sync Repository', value: 'sync_repo' },
                    { label: 'Onboard Organization', value: 'onboard_org' },
                    { label: 'Dry Run Configuration', value: 'dryrun_config' },
                  ]}
                  onChange={setKind}
                />
              </div>

              <div className="col-span-1">
                <TextInput
                  name="installation"
                  label="Installation"
                  placeholder="Installation ID"
                  type="text"
                  value={id}
                  onChange={setId}
                  icon={HashtagIcon}
                />
              </div>

              <div className="col-span-1" />

              <div className="col-span-1">
                <TextInput
                  name="org"
                  label="Organisation"
                  placeholder="maticzav"
                  type="text"
                  value={org}
                  onChange={setOrg}
                  icon={LibraryIcon}
                />
              </div>

              <div className="col-span-1">
                <TextInput
                  name="repository"
                  label="Repository"
                  placeholder="label-sync"
                  type="text"
                  value={repo}
                  onChange={setRepo}
                  icon={CloudIcon}
                />
              </div>

              <div className="col-span-1">
                <TextInput
                  name="type"
                  label="Account Type"
                  placeholder="Organization"
                  type="text"
                  value={accountType}
                  onChange={setAccountType}
                  icon={TagIcon}
                />
              </div>

              <div className="col-span-1">
                <TextInput
                  name="pr_number"
                  label="Pull Request Number"
                  placeholder="42"
                  type="number"
                  value={prNumber}
                  onChange={setPrNumber}
                  icon={HashtagIcon}
                />
              </div>
            </div>

            <div className="w-56 py-5">
              <Button onClick={pushtask}>
                {loading && <LoadingIndicator />}
                Submit
              </Button>

              {error && <p className="text-red-600 w-max mt-1">{error}</p>}
            </div>
          </div>

          <div className="pt-10">
            <Table
              header="Tasks"
              description="All currently queued tasks"
              columns={[
                { label: 'ID', key: 'id' },
                { label: 'Kind', key: 'kind' },
                { label: 'Owner', key: 'org' },
                { label: 'Repository', key: 'repo' },
              ]}
              data={queue}
            />
          </div>

          {/* End of Content */}
        </main>
      </div>
    </>
  )
}
