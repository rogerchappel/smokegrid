#!/usr/bin/env node

import { formatReport, runScenarios, version } from "./index.js";

const args = process.argv.slice(2);

async function main(argv: string[]): Promise<number> {
  if (argv.includes("--version") || argv.includes("-v")) {
    console.log(version);
    return 0;
  }

  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(helpText());
    return argv.length === 0 ? 1 : 0;
  }

  const [command, ...rest] = argv;
  if (command !== "run") {
    process.stderr.write(`Unknown command: ${command}\n\n${helpText()}`);
    return 1;
  }

  const { scenarioPaths, json, failFast } = parseRunArgs(rest);
  const report = await runScenarios(scenarioPaths, { failFast });
  process.stdout.write(json ? `${JSON.stringify(report, null, 2)}\n` : formatReport(report));
  return report.passed ? 0 : 1;
}

function parseRunArgs(argv: string[]): { scenarioPaths: string[]; json: boolean; failFast: boolean } {
  const scenarioPaths: string[] = [];
  let json = false;
  let failFast = false;

  for (const arg of argv) {
    if (arg === "--json") {
      json = true;
    } else if (arg === "--fail-fast") {
      failFast = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unexpected option: ${arg}`);
    } else {
      scenarioPaths.push(arg);
    }
  }

  if (scenarioPaths.length === 0) {
    throw new Error("smokegrid run requires at least one scenario JSON file.");
  }

  return { scenarioPaths, json, failFast };
}

function helpText(): string {
  return `smokegrid

Fixture-backed CLI smoke test runner for developer tools.

Usage:
  smokegrid run <scenario.json> [more-scenarios.json] [--json] [--fail-fast]
  smokegrid --version
`;
}

main(args).then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
