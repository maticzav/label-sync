import React, { useState } from 'react'
import moment from 'moment'

import Navigation from '../components/Navigation'
import Issue from '../components/Issue'
import KanbanColumn from '../components/KanbanColumn'

export default () => (
  <Navigation
    page="kanban"
    user={{
      name: 'Matic Zavadlal',
      picture:
        'https://pbs.twimg.com/profile_images/1243972591196536832/P-yDkpPt_400x400.jpg',
    }}
  >
    <div className="p-5">
      <KanbanColumn
        name="Upcoming Features"
        label={{ name: 'kind/feature', color: '#AB1255' }}
        count={10}
      >
        <span className="block mb-5">
          <Issue
            subject="Create kanban board for LabelSync!"
            repository="label-sync"
            date={moment()}
            link="https:?/github.com/maticzav/label-sync/issues"
            labels={[{ label: 'priority', color: '#655F5F' }]}
            number={5}
            author={{
              name: 'Matic Zavadlal',
              picture:
                'https://pbs.twimg.com/profile_images/1243972591196536832/P-yDkpPt_400x400.jpg',
            }}
          ></Issue>
        </span>
        <span className="block">
          <Issue
            subject="Connect it with Github API!"
            repository="label-sync"
            date={moment()}
            link="https:?/github.com/maticzav/label-sync/issues"
            labels={[
              { label: 'priority', color: '#655F5F' },
              { label: 'feature', color: '#65AF5F' },
            ]}
            number={5}
            author={{
              name: 'Matic Zavadlal',
              picture:
                'https://pbs.twimg.com/profile_images/1243972591196536832/P-yDkpPt_400x400.jpg',
            }}
          ></Issue>
        </span>
      </KanbanColumn>
    </div>
  </Navigation>
)
