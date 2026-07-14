#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/smokegrid-ci-json-demo"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cd "$ROOT_DIR"
npm run build

node dist/cli.js run fixtures/smokegrid.self.smoke.json --json > "$OUT_DIR/smokegrid-report.json"

test -s "$OUT_DIR/smokegrid-report.json"
node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!Array.isArray(data.scenarios) || data.scenarios.length === 0) process.exit(1); if (data.passed !== true) process.exit(1);" "$OUT_DIR/smokegrid-report.json"

printf 'Smokegrid CI JSON demo wrote %s\n' "$OUT_DIR/smokegrid-report.json"
