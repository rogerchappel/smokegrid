#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const requiredFiles = [
  "dist/cli.js",
  "dist/index.js",
  "dist/index.d.ts",
  "fixtures/smokegrid.self.smoke.json",
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "AGENTS.md",
  "docs/README.md",
  "docs/tutorials/json-report-demo.md",
  "demo/ci-json-report.sh",
  "demo/cli-release-scenario.sh",
  "demo/report-json-demo.sh",
  "examples/cli-release.smoke.json",
  "examples/current-cli-demo.sh",
  "examples/json-report-demo.sh",
];

const readPackOutput = (args) => {
  const output = execFileSync("npm", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(output)[0];
};

const pack = readPackOutput(["pack", "--dry-run", "--json"]);
const packedFiles = new Set(pack.files.map((file) => file.path));
const missing = requiredFiles.filter((file) => !packedFiles.has(file));

if (missing.length > 0) {
  console.error(`Package smoke failed; missing ${missing.join(", ")}`);
  process.exit(1);
}

const demoCommands = [
  "examples/current-cli-demo.sh",
  "demo/report-json-demo.sh",
  "demo/ci-json-report.sh",
  "examples/json-report-demo.sh",
  "demo/cli-release-scenario.sh",
];
const extractionRoot = mkdtempSync(join(tmpdir(), "smokegrid-package-smoke-"));

try {
  const artifact = readPackOutput([
    "pack",
    "--json",
    "--pack-destination",
    extractionRoot,
  ]);
  execFileSync(
    "tar",
    ["-xzf", join(extractionRoot, artifact.filename), "-C", extractionRoot],
    { stdio: "inherit" },
  );

  for (const command of demoCommands) {
    execFileSync("bash", [command], {
      cwd: join(extractionRoot, "package"),
      stdio: "inherit",
    });
  }
} finally {
  rmSync(extractionRoot, { recursive: true, force: true });
}

console.log(
  `Package smoke passed with ${pack.files.length} files and ${demoCommands.length} executable README demos.`,
);
