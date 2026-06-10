# smokegrid Social Hooks

Grounded draft copy for launch planning. These hooks describe the repository's
current package metadata and CLI surface; avoid claiming richer workflow support
until the fixture runner is verified in the release branch.

## Short Hooks

- Smokegrid is shaping into a fixture-backed smoke runner for developer-tool
  CLIs, starting with a local-first Node package.
- The current demo proves the package builds and that the CLI entry point is
  callable before broader scenario execution is promoted.
- Useful angle: turn "does the CLI start?" into a repeatable artifact before a
  tool graduates to richer fixture-backed checks.

## Video Brief

Show the README quickstart, run `npm install`, then run
`bash examples/current-cli-demo.sh`. Close on `.demo-output/current-cli-demo.txt`
as the proof artifact and call out that the repository is early-stage.
