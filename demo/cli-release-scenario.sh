#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build
node dist/cli.js run examples/cli-release.smoke.json --json > /tmp/smokegrid-cli-release-report.json
grep -q '"passed": true' /tmp/smokegrid-cli-release-report.json
grep -q '"total": 3' /tmp/smokegrid-cli-release-report.json

echo "Wrote /tmp/smokegrid-cli-release-report.json"
