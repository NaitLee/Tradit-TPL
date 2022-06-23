#!/bin/sh
mkdir -p debug
mkdir -p dist
rm -rf debug/*
rm -rf dist/*
cp -r src/lang dist/
./8-debug.sh
ln -s "`pwd`/bare.tpl" debug/bare.tpl
cp bare.tpl dist/bare.tpl
npx asc asm/index.ts --target release
# sed -e 's/import\.meta\.url/__filename/' -i src/tradit-wasm.js
mv src/*.wa* dist/
npx tsc --outDir ./dist/
