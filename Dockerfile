FROM heroku/heroku:18

# NodeJS
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash - &&\
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - &&\
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list &&\
  apt-get update -y && apt-get install -y nodejs gcc g++ make yarn

RUN node --version

WORKDIR /usr/src/app

# Install Dependencies
COPY . .
RUN yarn install

# Generate Prisma Client
RUN ./scripts/generate.sh

# Build Server
RUN yarn build

CMD ["./node_modules/.bin/probot", "run ./server/dist/index.js"]
