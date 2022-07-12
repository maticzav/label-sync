import { LSCRepository } from '@labelsync/config'

import { calculateConfigurationDiff } from '../../src/lib/config'
import { GitHubLabel } from '../../src/lib/github'

describe('configuration', () => {
  test('correctly calculates the difference between configuration and state', () => {
    const config: LSCRepository['labels'] = {
      /* updates: */
      'updates/unchanged': {
        color: 'color:unchanged',
        description: 'description:unchanged',
      },
      'updates/color': {
        color: 'color:after',
        description: 'description:unchanged',
      },
      'updates/description': {
        color: 'color:unchanged',
        description: 'description:after',
      },
      /* creates: */
      /**
       * Both of these should act as new labels:
       *  - we shouldn't try to update them from the old ones.
       */
      'new/noalias': {
        color: 'color:noalias',
      },
      'new/deadalias': {
        color: 'color:deadalias',
        alias: ['dead/alias'],
      },
      /* removals: */
      // removed: {
      //   color: "color:removed"
      // },
      /* aliases: */
      /**
       * alias/new is the label that we want to rename the others to.
       * we should:
       *  - update the first label if new label doesn't exist yet
       *  - reference the others
       */
      'alias/new': {
        color: 'color:alias',
        alias: ['alias/old:1', 'alias/old:2'],
      },
      // 'alias/old:1': {
      //   color: 'color:alias:old',
      // },
      // 'alias/old:2': {
      //   color: 'color:alias:old',
      // },
      'alias/existing': {
        color: 'color:alias',
        alias: ['alias/old:3', 'alias/old:4'],
      },
      // 'alias/old:1': {
      //   color: 'color:alias:old',
      // },
      // 'alias/old:2': {
      //   color: 'color:alias:old',
      // },
    }

    const currentLabels: GitHubLabel[] = [
      /* updates: */
      {
        name: 'updates/unchanged',
        color: 'color:unchanged',
        description: 'description:unchanged',
      },
      {
        name: 'updates/color',
        color: 'color:before',
        description: 'description:unchanged',
      },
      {
        name: 'updates/description',
        color: 'color:unchanged',
        description: 'description:before',
      },
      /* new: */
      // {
      //   name: 'new/noalias',
      //   color: 'color:noalias',
      // },
      // {
      //   name: 'new/deadalias',
      //   color: 'color:deadalias',
      // },
      /* removed: */
      {
        name: 'removed',
        color: 'color:removed',
      },
      /* alias: */
      // {
      //   name: 'alias/new',
      //   color: 'color:alias:old',
      // },
      {
        name: 'alias/old:1',
        color: 'color:alias:old',
      },
      {
        name: 'alias/old:2',
        color: 'color:alias:old',
      },
      {
        name: 'alias/existing',
        color: 'color:alias:old',
      },
      {
        name: 'alias/old:3',
        color: 'color:alias:old',
      },
      {
        name: 'alias/old:4',
        color: 'color:alias:old',
      },
    ]

    const diff = calculateConfigurationDiff({ config, currentLabels })

    expect(diff).toEqual({
      added: [
        {
          old_name: undefined,
          name: 'new/noalias',
          old_description: undefined,
          description: undefined,
          old_color: undefined,
          color: 'color:noalias',
        },
        {
          old_name: undefined,
          name: 'new/deadalias',
          old_description: undefined,
          description: undefined,
          old_color: undefined,
          color: 'color:deadalias',
        },
      ],
      changed: [
        {
          old_name: 'updates/color',
          name: 'updates/color',
          old_description: 'description:unchanged',
          description: 'description:unchanged',
          old_color: 'color:before',
          color: 'color:after',
        },
        {
          old_name: 'updates/description',
          name: 'updates/description',
          old_description: 'description:before',
          description: 'description:after',
          old_color: 'color:unchanged',
          color: 'color:unchanged',
        },
        {
          old_name: 'alias/old:1',
          name: 'alias/new',
          old_description: undefined,
          description: undefined,
          old_color: undefined,
          color: 'color:alias',
        },
      ],
      aliased: [
        {
          old_name: 'alias/old:2',
          name: 'alias/new',
          old_description: undefined,
          description: undefined,
          old_color: undefined,
          color: 'color:alias',
        },
        {
          old_name: 'alias/old:3',
          name: 'alias/existing',
          old_description: undefined,
          description: undefined,
          old_color: 'color:alias:old',
          color: 'color:alias',
        },
        {
          old_name: 'alias/old:4',
          name: 'alias/existing',
          old_description: undefined,
          description: undefined,
          old_color: 'color:alias:old',
          color: 'color:alias',
        },
      ],
      removed: [
        {
          name: 'removed',
          color: 'color:removed',
        },
        {
          name: 'alias/old:2',
          color: 'color:alias:old',
        },
        {
          name: 'alias/old:3',
          color: 'color:alias:old',
        },
        {
          name: 'alias/old:4',
          color: 'color:alias:old',
        },
      ],
    })
  })
})
