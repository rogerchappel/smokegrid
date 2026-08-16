import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const cliPath = new URL("../dist/cli.js", import.meta.url);

for (const flag of ["--version", "-v"]) {
  test(`CLI accepts top-level ${flag}`, () => {
    const result = runCli(flag);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /^\d+\.\d+\.\d+\n$/);
    assert.equal(result.stderr, "");
  });
}

for (const flag of ["--help", "-h"]) {
  test(`CLI accepts top-level ${flag}`, () => {
    const result = runCli(flag);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /^smokegrid\n/);
    assert.match(result.stdout, /Usage:/);
    assert.equal(result.stderr, "");
  });
}

for (const flag of ["--version", "-v", "--help", "-h"]) {
  test(`CLI rejects ${flag} after the run command`, () => {
    const result = runCli("run", "does-not-exist.json", flag);

    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, `Unexpected option: ${flag}\n`);
  });
}

function runCli(...args) {
  return spawnSync(process.execPath, [cliPath.pathname, ...args], {
    encoding: "utf8"
  });
}
