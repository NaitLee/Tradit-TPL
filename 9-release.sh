#!/bin/sh
npx asc asm/index.ts --target release
mv src/*.wa* dist/
npx tsc --outDir ./dist/
