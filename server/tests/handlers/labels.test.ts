import { LSCRepository } from '../../src/configuration'
import { GithubLabel } from '../../src/github'
import { calculateDiff } from '../../src/handlers/labels'

describe('labels:', () => {
  test('calculateDiff', () => {
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

    const currentLabels: GithubLabel[] = [
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

    const diff = calculateDiff(config)(currentLabels)

    expect(diff).toEqual({
      added: [
        {
          name: 'new/noalias',
          color: 'color:noalias',
          description: undefined,
        },
        {
          name: 'new/deadalias',
          color: 'color:deadalias',
          description: undefined,
        },
      ],
      changed: [
        {
          name: 'updates/color',
          color: 'color:after',
          description: 'description:unchanged',
        },
        {
          name: 'updates/description',
          color: 'color:unchanged',
          description: 'description:after',
        },
        {
          name: 'alias/new',
          old_name: 'alias/old:1',
          color: 'color:alias',
          description: undefined,
        },
      ],
      aliased: [
        {
          name: 'alias/new',
          old_name: 'alias/old:2',
          color: 'color:alias',
          description: undefined,
        },
        {
          name: 'alias/existing',
          old_name: 'alias/old:3',
          color: 'color:alias',
          description: undefined,
        },
        {
          name: 'alias/existing',
          old_name: 'alias/old:4',
          color: 'color:alias',
          description: undefined,
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
