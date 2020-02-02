#!/bin/bash

# Clear 
rm -rf public

# Build webpage.
cd web
yarn run build

cd ../

# Expose webpage
mkdir public
cp -R ./web/public/* ./public/

# Expose assets
mkdir public/assets
cp -R ./assets/* ./public/assets/

# Log public files.
ls -R public