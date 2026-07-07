# Video Brief: Turn a CLI Smoke Check into a JSON Artifact

## Angle

Show Smokegrid running the checked-in self-smoke fixture and writing a JSON
report that a CI job or release checklist can keep as evidence.

## Grounded product facts

- Smokegrid is a fixture-backed CLI smoke test runner for developer tools.
- The current self-smoke fixture covers version output and stdin forwarding.
- The CLI can emit JSON with `--json`.
- The package is early-stage, so demos should focus on the maintained fixture
  instead of claiming broad workflow coverage.

## Demo flow

1. Open `fixtures/smokegrid.self.smoke.json`.
2. Run `bash demo/ci-json-report.sh`.
3. Show `${TMPDIR:-/tmp}/smokegrid-ci-json-demo/smokegrid-report.json`.
4. Point out the scenario list and successful run shape.
5. Close on the CI recipe in `docs/tutorials/ci-smoke-scenario.md`.

## Short hooks

- "A smoke test is more useful when the fixture and report are both checked."
- "Smokegrid turns a tiny CLI behavior check into a repeatable JSON artifact."
- "Start with one maintained fixture; add more scenarios as the CLI surface grows."
