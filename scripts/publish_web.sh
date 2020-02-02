#!/bin/bash

rm -rf public

cd web
yarn run build

cd ../
mkdir public
cp -R ./web/public/* ./public/