# CI Smoke Scenario Recipe

This recipe shows how to turn the checked-in self-smoke fixture into a small CI
gate for a developer-tool CLI.

## What the fixture proves

`fixtures/smokegrid.self.smoke.json` runs the built `smokegrid` CLI through
version output and stdin forwarding. That keeps the scenario focused on the
runner path instead of broad package validation.

## Local demo

```sh
npm install
bash examples/json-report-demo.sh
```

The script builds the CLI, runs the self-smoke scenario with `--json`, writes the
report to a temporary directory, and checks that the report contains at least one
scenario.

## CI step

```yaml
- name: Build CLI
  run: npm run build

- name: Run smoke fixture
  run: node dist/cli.js run fixtures/smokegrid.self.smoke.json --json > smokegrid-report.json

- name: Check report shape
  run: |
    node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync('smokegrid-report.json','utf8')); if (!Array.isArray(data.scenarios) || data.scenarios.length === 0) process.exit(1);"
```

Keep each scenario small. Add separate scenarios for release packaging, CLI
stdin, JSON output, or error handling so failures point at the behavior that
actually regressed.
