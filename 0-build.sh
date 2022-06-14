#!/bin/sh
npx tsc
npx asc asm/index.ts --target debug
