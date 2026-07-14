# Check a CLI release scenario with smokegrid

This recipe shows how to turn a small CLI release checklist into a checked
scenario. It uses smokegrid's JSON fixture format so the same proof can run
locally before a tag, in CI, or from a release candidate branch.

## What the scenario proves

- The built CLI starts with `--version`.
- The help text still advertises the `run <scenario.json>` command.
- Standard input is forwarded to the child command unchanged.

## Scenario fixture

Save this as `examples/cli-release.smoke.json`:

```json
{
  "name": "CLI release sanity check",
  "description": "Verifies the public CLI entrypoint before a release.",
  "timeoutMs": 5000,
  "cases": [
    {
      "name": "version exits cleanly",
      "command": "node",
      "args": ["../dist/cli.js", "--version"],
      "expect": {
        "exit": 0,
        "stdout": {
          "kind": "contains",
          "value": "0.1.0"
        },
        "stderr": {
          "kind": "exact",
          "value": ""
        }
      }
    },
    {
      "name": "help lists run command",
      "command": "node",
      "args": ["../dist/cli.js", "--help"],
      "expect": {
        "exit": 0,
        "stdout": {
          "kind": "contains",
          "value": "smokegrid run <scenario.json>"
        }
      }
    },
    {
      "name": "stdin reaches child command",
      "command": "node",
      "args": ["-e", "process.stdin.pipe(process.stdout)"],
      "stdin": "release note draft\n",
      "expect": {
        "exit": 0,
        "stdout": "release note draft"
      }
    }
  ]
}
```

## Run it

Build the CLI, then run the scenario:

```sh
npm install
npm run build
node dist/cli.js run examples/cli-release.smoke.json
```

Use JSON output when a workflow needs to attach the report as an artifact:

```sh
node dist/cli.js run examples/cli-release.smoke.json --json > smokegrid-report.json
```

## Review checklist

- Keep scenario commands deterministic and local.
- Prefer short commands that fail for one clear reason.
- Store generated reports outside the fixture file so the scenario remains
  reviewable in code review.
