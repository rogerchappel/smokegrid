# smokegrid PRD

Status: in-progress

## Summary

smokegrid is a fixture-backed CLI smoke test runner for developer tools. It
executes small command matrices, captures stdout/stderr/exit codes, compares
them to expectations, and writes a compact report that is easy for humans and
agents to inspect.

## Why now

Local-first OSS projects need credible smoke checks, but many small CLIs either
skip end-to-end validation or bury it in bespoke shell scripts. smokegrid gives
developers a deterministic middle ground: simple YAML/JSON scenarios, real
commands, stable reports.

## Source attribution

Inspired by repeated needs in local agentic OSS workflows for command-level
verification and by the broader 2026 push toward agent-run CLI automation. This
is an original lightweight smoke runner.

## Target users

- CLI maintainers.
- Coding agents validating generated projects.
- Developers who want fixture-backed checks without adopting a full test
  framework.

## MVP

- Load JSON scenario files.
- Run command cases with cwd, env, stdin, timeout, and expected exit code.
- Match stdout/stderr by contains, regex, or exact text.
- Emit text and JSON reports.
- Provide examples for testing a tiny CLI fixture.
- Include tests and a real smoke of smokegrid running itself against fixtures.

## Non-goals

- Replacing unit test frameworks.
- Distributed execution.
- Snapshot approval UIs.

## CLI sketch

```bash
smokegrid run smokegrid.json
smokegrid run fixtures/*.smoke.json --format json --fail-fast
smokegrid init
```

## Success criteria

- A new CLI repo can add a scenario file and get useful smoke coverage in
  minutes.
- Reports preserve enough evidence for agent debugging.
