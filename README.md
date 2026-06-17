# smokegrid
Fixture-backed CLI smoke test runner for developer tools.
## Status

This is a v0.1.0 local-first developer tool. Treat the CLI and output formats as early-stage, pin versions in automation, and run the verification commands below before relying on it in CI.
## What it helps with

- Work with cli, smoke-test, fixtures, testing, automation workflows from a local checkout.
- Keep generated artifacts and reports inspectable on disk instead of sending project data to a service.
- Add a repeatable smoke command that maintainers can run before review or release.

## Install from a checkout

```sh
git clone https://github.com/rogerchappel/smokegrid.git
cd smokegrid
npm install
npm run build
```
## CLI quickstart

Start with the built CLI help so the examples match the checked-out version:

```sh
node dist/cli.js --help
```

For a copy-pasteable demo that builds the CLI and captures the current entry
point output as an artifact, run:

```sh
bash examples/current-cli-demo.sh
```

For a JSON-report demo suitable for a CI evidence artifact, run:

```sh
bash demo/ci-json-report.sh
```

Run the maintained smoke fixture to exercise the main workflow end to end:

```sh
npm run smoke
```

The smoke command currently expands to:

```sh
npm run build && node dist/cli.js run fixtures/smokegrid.self.smoke.json
```

You can run any JSON scenario directly:

```sh
node dist/cli.js run fixtures/smokegrid.self.smoke.json --json
```

For a reusable JSON-report demo that builds the CLI, writes a report to a
temporary directory, and validates the report shape, run:

```sh
bash examples/json-report-demo.sh
```

Scenarios contain one or more cases with a command, optional args/stdin/env, and
exit/stdout/stderr expectations. The built-in fixture covers version output and
stdin forwarding so release checks prove the runner path is working.

For a short promotion outline grounded in this fixture, see
[`docs/promo/video-brief.md`](docs/promo/video-brief.md).
## Verification

```sh
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

## Limitations

- The project is intentionally local-first; it does not manage remote credentials or upload repository contents.
- Output schemas and CLI flags may change before a stable 1.0 release.
- Review generated files before committing them, especially when they summarize logs, diffs, or dependency metadata.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes small, include a fixture or smoke case when behavior changes, and paste verification output into the pull request.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting. Do not paste secrets, private tokens, or proprietary logs into issues or examples.

## License

MIT
