import { GithubLabel, GithubIssue } from '../../src'

export const githubLabels: GithubLabel[] = [
  {
    name: 'bug/no-reproduction',
    color: '333333',
    description: '',
    default: false,
  },
  {
    name: 'basic',
    color: 'f266f4',
    description: '',
    default: false,
  },
  {
    name: 'kind/bug',
    color: '333333',
    description: '',
    default: false,
  },
]

export const githubIssues: GithubIssue[] = [
  {
    id: 1421,
    title: 'Issue Title',
    body: 'Very serious issue.',
    state: '',
    labels: githubLabels,
    number: 1,
  },
  {
    id: 1123,
    title: 'Another Issue Title',
    body: 'Not so serious issue.',
    state: '',
    labels: githubLabels,
    number: 5,
  },
]

export interface GithubClientMockOptions {
  status?: number
  labels?: GithubLabel[]
  issues?: GithubIssue[]
}

const defaultClientMock: GithubClientMockOptions = {
  status: 200,
  labels: githubLabels,
  issues: githubIssues,
}

export const githubClient = (providedOptions?: GithubClientMockOptions) => {
  const options = Object.assign({}, defaultClientMock, providedOptions || {})

  return {
    issues: {
      createLabel: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.labels }),
      updateLabel: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.labels }),
      deleteLabel: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.labels }),
      listLabelsForRepo: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.labels }),
      addLabels: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.labels }),
      listForRepo: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.issues }),
    },
  }
}
