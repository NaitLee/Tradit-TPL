#!/bin/sh
npx tsc --outDir ./dist/
npx asc asm/index.ts --target release
