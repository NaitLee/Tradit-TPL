#!/bin/sh
npx asc asm/index.ts --target debug
mv src/*.wa* debug/
