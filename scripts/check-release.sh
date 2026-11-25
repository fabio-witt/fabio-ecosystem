#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
python3 scripts/check-site.py
node --test tests/reliability.test.cjs
node --check src/grammarfirst/build-lingora.cjs
cd src/lingora
./node_modules/.bin/tsc --noEmit
npm run lint
npm test
