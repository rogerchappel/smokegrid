#!/usr/bin/env node
import { execFileSync } from "node:child_process";

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
];

const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

const [pack] = JSON.parse(output);
const packedFiles = new Set(pack.files.map((file) => file.path));
const missing = requiredFiles.filter((file) => !packedFiles.has(file));

if (missing.length > 0) {
  console.error(`Package smoke failed; missing ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Package smoke passed with ${pack.files.length} files.`);
