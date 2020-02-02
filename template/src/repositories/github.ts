import { repository, label } from 'label-sync'

/**
 * Default collection of label in a Github repository.
 */
export const github = repository({
  strict: false,
  labels: {
    bug: label({
      color: '#d73a4a',
      description: "Something isn't working",
    }),
    documentation: label({
      color: '#0075ca',
      description: 'Improvements or additions to documentation',
    }),
    duplicate: label({
      color: '#cfd3d7',
      description: 'This issue or pull request already exists',
    }),
    enhancement: label({
      color: '#a2eeef',
      description: 'New feature or request',
    }),
    'good first issue': label({
      color: '#7057ff',
      description: 'Good for newcomers',
    }),
    'help wanted': label({
      color: '#008672',
      description: 'Extra attention is needed',
    }),
    invalid: label({
      color: '#e4e669',
      description: "This doesn't seem right",
    }),
    question: label({
      color: '#d876e3',
      description: 'Further information is requested',
    }),
    wontfix: label({
      color: '#000000',
      description: 'This will not be worked on',
    }),
  },
})
