import React, { useState } from 'react'

import Navigation from '../components/Navigation'
import Label from '../components/Label'
import Repository from '../components/Repository'
import Group from '../components/Group'
import { label, repository, group } from '../lib/mock'
import { Heading } from '../components/Heading'
import Scroll from '../components/Scroll'

export default () => {
  return (
    <Navigation
      page="labels"
      user={{
        name: 'Matic Zavadlal',
        picture:
          'https://pbs.twimg.com/profile_images/1243972591196536832/P-yDkpPt_400x400.jpg',
      }}
    >
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 p-5">
          {/* Labels and Groups */}
          <div>
            <Scroll>
              <Heading>Groups</Heading>
              <Group
                group={group}
                options={{
                  labels: [],
                  repositories: [],
                }}
              ></Group>
              <Heading>Labels</Heading>
              <Label
                label={label}
                options={{ repositories: [repository], groups: [] }}
              ></Label>
            </Scroll>
          </div>
          {/* Repositories */}
          <div>
            <Scroll>
              <Heading>Repositories</Heading>
              <Repository
                repository={repository}
                options={{ groups: [], labels: [] }}
              ></Repository>
            </Scroll>
          </div>
        </div>
      </div>
    </Navigation>
  )
}
