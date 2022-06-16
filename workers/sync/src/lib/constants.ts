import ml from 'multilines'
import os from 'os'

export const messages = {
  'insufficient.permissions': (missingRepos: string[]) => ml`
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
  'onboarding.error': (error: string) => ml`
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
