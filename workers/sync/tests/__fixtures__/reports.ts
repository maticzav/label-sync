import { LabelSyncReport } from '../../src/lib/reports'

/**
 * Report of a strict repository with additions, delitions, updates and renames.
 */
export const strict: LabelSyncReport = {
  status: 'Success',
  owner: 'maticzav',
  repo: 'success',
  additions: [
    {
      name: 'addition/one',
      color: '#ee263c',
      default: false,
    },
    {
      name: 'addition/two',
      color: '#ee263c',
      default: false,
    },
  ],
  updates: [
    {
      old_name: 'update/one',
      name: 'update/ena',
      color: '#FDE8E8',
      default: false,
    },
    {
      old_name: 'update/two',
      name: 'update/dve',
      old_color: '#bbbbbb',
      color: '#FDF6B2',
      default: false,
    },
    {
      old_name: 'update/three',
      name: 'update/tri',
      old_color: '#aa123d',
      color: '#E1EFFE',
      old_description: 'old',
      description: 'new',
      default: false,
    },
  ],
  removals: [
    {
      name: 'removal/one',
      color: '#aa123c',
      default: false,
    },
    {
      name: 'removal/two',
      color: '#aa123c',
      default: false,
    },
  ],
  aliases: [
    {
      old_name: 'label/old-first',
      name: 'label/alias',
      color: '#ee263c',
      default: false,
    },
    {
      old_name: 'label/old-second',
      name: 'label/alias',
      color: '#ee263c',
      default: false,
    },
  ],
  config: {
    labels: {}, // not used in report generation
    config: {
      removeUnconfiguredLabels: true,
    },
  },
}

/**
 * Report of a repository that we failed to sync.
 */
export const failure: LabelSyncReport = {
  status: 'Failure',
  owner: 'maticzav',
  repo: 'failure',
  message: `Couldn't make a diff of labels.`,
  config: {
    labels: {}, // not used in report generation
    config: {
      removeUnconfiguredLabels: false,
    },
  },
}

/**
 * Report of a repository that is not in the configuration.
 */
export const unconfigured: LabelSyncReport = {
  status: 'Success',
  owner: 'maticzav',
  repo: 'unconfigured',
  additions: [
    {
      name: 'addition',
      color: '#ee263c',
      default: false,
    },
  ],
  updates: [],
  removals: [],
  aliases: [],
  config: {
    labels: {}, // not used in report generation
    config: {
      removeUnconfiguredLabels: false,
    },
  },
}

/**
 * Non-Strict Repository with unconfigured labels.
 */
export const nonstrict: LabelSyncReport = {
  status: 'Success',
  owner: 'maticzav',
  repo: 'unconfigured-nonstrict',
  additions: [],
  updates: [],
  removals: [
    {
      name: 'unconfigured-one',
      color: '#ee263c',
      default: false,
    },
    {
      name: 'unconfigured-two',
      color: '#ee263c',
      default: false,
    },
  ],
  aliases: [],
  config: {
    labels: {}, // not used in report generation
    config: {
      removeUnconfiguredLabels: false,
    },
  },
}

/**
 * Report of an unchanged repository.
 */
export const unchanged: LabelSyncReport = {
  status: 'Success',
  owner: 'maticzav',
  repo: 'unchanged',
  additions: [],
  updates: [],
  removals: [],
  aliases: [],
  config: {
    labels: {}, // not used in report generation
    config: {
      removeUnconfiguredLabels: false,
    },
  },
}
