#!/bin/sh
npx asc asm/index.ts --target debug
# sed -e 's/import\.meta\.url/__filename/' -i src/tradit-wasm.js
mv src/*.wa* debug/
