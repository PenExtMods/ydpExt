#!/bin/sh

# build.full.sh

# MIT License Copyright (c) 2023 Wxp

echo '[info] start to build ydpExt full part.'
node ./script/build.js
echo '[info] start to copy setup scripts.'
mkdir ./.tmp
mv ./build/* ./.tmp
mkdir ./build/youdaoExt
mv ./.tmp/* ./build/youdaoExt
rm -r ./.tmp
cp ./util/* ./build/
echo '[info] copy setup scripts operation done.'
echo '[info] operation done.'