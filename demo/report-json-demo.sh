#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="${TMPDIR:-/tmp}/smokegrid-report-demo"
report_file="${out_dir}/smokegrid-self-report.json"

cd "$repo_root"
mkdir -p "$out_dir"

npm run build >/dev/null

node dist/cli.js run fixtures/smokegrid.self.smoke.json --json >"$report_file"

grep -Fq '"passed": true' "$report_file"
grep -Fq '"name": "version prints package version"' "$report_file"
grep -Fq '"name": "stdin is forwarded to child commands"' "$report_file"

printf 'Smokegrid JSON report written to %s\n' "$report_file"
sed -n '1,80p' "$report_file"
