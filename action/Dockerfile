FROM node:11.3.0

# Action configuration

LABEL "com.github.actions.name"="Github Labels"
LABEL "com.github.actions.description"="Delightful labels manager for Github"
LABEL "com.github.actions.icon"="bookmark"
LABEL "com.github.actions.color"="green"

LABEL "repository"="http://github.com/prisma/github-labels"
LABEL "homepage"="http://github.com/prisma/github-labels"
LABEL "maintainer"="Matic Zavadlal <matic.zavadlal@gmail.com>"

# Process

ADD package.json /
RUN yarn install

ADD entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]