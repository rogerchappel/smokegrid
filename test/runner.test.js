import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

import { formatReport, runScenarios } from "../dist/index.js";

const tmpRoot = new URL("../.tmp-tests/", import.meta.url);

test("runScenarios evaluates exit and output expectations", async () => {
  const dir = new URL("passing/", tmpRoot);
  await rm(dir, { force: true, recursive: true });
  await mkdir(dir, { recursive: true });
  const scenarioPath = join(dir.pathname, "scenario.json");

  await writeFile(scenarioPath, JSON.stringify({
    name: "passing fixture",
    cases: [
      {
        name: "node prints greeting",
        command: "node",
        args: ["-e", "console.log('hello smokegrid')"],
        expect: {
          exit: 0,
          stdout: "hello smokegrid"
        }
      }
    ]
  }));

  const report = await runScenarios([scenarioPath]);

  assert.equal(report.passed, true);
  assert.equal(report.total, 1);
  assert.equal(report.failed, 0);
  assert.match(formatReport(report), /PASS node prints greeting/);
});

test("runScenarios reports failed assertions without throwing", async () => {
  const dir = new URL("failing/", tmpRoot);
  await rm(dir, { force: true, recursive: true });
  await mkdir(dir, { recursive: true });
  const scenarioPath = join(dir.pathname, "scenario.json");

  await writeFile(scenarioPath, JSON.stringify({
    name: "failing fixture",
    cases: [
      {
        name: "node prints unexpected text",
        command: "node",
        args: ["-e", "console.log('actual')"],
        expect: {
          stdout: {
            kind: "exact",
            value: "expected\n"
          }
        }
      }
    ]
  }));

  const report = await runScenarios([scenarioPath]);

  assert.equal(report.passed, false);
  assert.equal(report.failed, 1);
  assert.equal(report.scenarios[0].cases[0].assertions.some((item) => !item.pass), true);
});
