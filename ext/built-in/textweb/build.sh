#!/bin/sh
mkdir -p ./build

cd ./third/html-to-md
npm run build:main

cd ../..

cp -r ./src/* ./build/
cp -r ./third/html-to-md/dist/* ./build/node_modules/html-to-md/dist/


