# JSON Report Demo

This demo turns Smokegrid's checked-in self-smoke fixture into a machine-readable
report that can be attached to a release checklist, PR, or agent handoff.

## Run it

```bash
npm install
bash demo/report-json-demo.sh
```

The script builds the CLI, runs:

```bash
node dist/cli.js run fixtures/smokegrid.self.smoke.json --json
```

and writes the report to:

```text
${TMPDIR:-/tmp}/smokegrid-report-demo/smokegrid-self-report.json
```

## What it proves

The fixture currently verifies two stable behaviors:

- `node dist/cli.js --version` prints the package version.
- stdin is forwarded to a child command and can be asserted in stdout.

The script checks for `"passed": true` plus both case names, so a broken report
shape or missing case fails before the output is used as evidence.

## Promotion angle

This is a concise demo for showing Smokegrid as a fixture-backed smoke runner:
one command builds the CLI, executes a JSON scenario, and leaves an inspectable
report on disk without contacting a service.
