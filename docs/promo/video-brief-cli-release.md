# Video brief: CLI release checks with smokegrid

## Audience

Maintainers of small developer tools who want a repeatable release sanity check
without wiring a full test harness for every command.

## Grounded demo path

1. Open the repository and show `fixtures/smokegrid.self.smoke.json` as the
   built-in smoke fixture.
2. Run `npm run build`.
3. Run `node dist/cli.js run examples/cli-release.smoke.json`.
4. Re-run with `--json` and show the report has `passed: true`, `total: 3`,
   and per-case command output.
5. Point to `demo/cli-release-scenario.sh` as the copy-paste workflow.

## Key points

- Scenarios are plain JSON fixtures.
- Commands run locally and can include args, stdin, env, and output checks.
- JSON output can be archived by CI or attached to a release candidate review.

## Boundaries to mention

- smokegrid is early-stage v0.1.0.
- It executes the commands you put in the scenario, so fixtures should stay
  deterministic and safe for review.
- Output formats and flags may change before a stable 1.0 release.
