#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
report_dir="${repo_root}/.demo-output"
report_file="${report_dir}/current-cli-demo.txt"

cd "$repo_root"
mkdir -p "$report_dir"

npm run build >/dev/null

{
  printf 'smokegrid current CLI demo\n'
  printf 'generated_at=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  printf 'command=node dist/cli.js --version\n'
  printf 'output='
  node dist/cli.js --version
} >"$report_file"

cat "$report_file"
