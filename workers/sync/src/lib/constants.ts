import ml from 'multilines'
import os from 'os'

export const messages = {
  'insufficient.permissions.issue': (missingRepos: string[]) => ml`
	| # Insufficient permissions
	|
	| Hi there,
	| Thank you for installing LabelSync. We have noticed that your configuration stretches beyond repositories we can access. 
	| We think you forgot to allow access to certain repositories. Please update your installation. 
	|
	| _Missing repositories:_
	| ${missingRepos.map((missing) => ` * ${missing}`).join(os.EOL)}
	|
	| Best,
	| LabelSync Team
	`,
  'invalid.config.comment': (error: string) => ml`
	| It seems like your configuration uses a format unknown to me. 
	| That might be a consequence of invalid yaml cofiguration file. 
	|
	| Here's what I am having problems with:
	|
	| ${error}

	`,
  'insufficient.permissions.comment': (missingRepos: string[]) => ml`
	| Your configuration stretches beyond repositories we can access. 
	| Please update it so I may sync your labels.
	|
	| _Missing repositories:_
	| ${missingRepos.map((missing) => ` * ${missing}`).join(os.EOL)}
	`,
  'onboarding.error.issue': (error: string) => ml`
	| # Welcome to LabelSync!
	|
	| Hi there,
	| Thank you for using LabelSync. We hope you enjoyed the experience so far.
	| It seems like there are some problems with your configuration.
	| Our parser reported that:
	|
	| ${error}
	|
	| Let us know if we can help you with the configuration by sending us an email to support@label-sync.com. 
	| We'll try to get back to you as quickly as possible.
	|
	| Best,
	| LabelSync Team
	`,
}
