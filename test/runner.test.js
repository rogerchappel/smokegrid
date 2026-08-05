import assert from "node:assert/strict";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
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

test("runScenarios rejects zero scenario and negative case timeouts", async () => {
  const scenarioTimeout = await writeScenario("zero-timeout", {
    timeoutMs: 0,
    cases: [{ name: "unused", command: "node" }]
  });
  const caseTimeout = await writeScenario("negative-timeout", {
    cases: [{ name: "unused", command: "node", timeoutMs: -1 }]
  });

  await assert.rejects(runScenarios([scenarioTimeout]), /scenario\.timeoutMs must be a finite positive number/);
  await assert.rejects(runScenarios([caseTimeout]), /cases\[0\]\.timeoutMs must be a finite positive number/);
});

test("runScenarios validates every regex before executing a command", async () => {
  const dir = new URL("invalid-regex/", tmpRoot);
  const markerPath = join(dir.pathname, "command-ran");
  const scenarioPath = await writeScenario("invalid-regex", {
    cases: [{
      name: "must not execute",
      command: "node",
      args: ["-e", `require('node:fs').writeFileSync(${JSON.stringify(markerPath)}, 'ran')`],
      expect: {
        stdout: [{ kind: "regex", value: "ignored" }, { kind: "regex", value: "[" }]
      }
    }]
  });

  await assert.rejects(runScenarios([scenarioPath]), /cases\[0\]\.expect\.stdout\[1\]\.value must be a valid regular expression/);
  await assert.rejects(access(markerPath));
});

test("runScenarios accepts valid regex and case-level timeout overrides", async () => {
  const scenarioPath = await writeScenario("valid-regex", {
    timeoutMs: 1,
    cases: [{
      name: "case override",
      command: "node",
      args: ["-e", "setTimeout(() => console.log('smokegrid 42'), 25)"],
      timeoutMs: 500,
      expect: {
        stdout: { kind: "regex", value: "^smokegrid \\d+\\n$" }
      }
    }]
  });

  const report = await runScenarios([scenarioPath]);

  assert.equal(report.passed, true);
  assert.equal(report.scenarios[0].cases[0].timedOut, false);
});

test("runScenarios reports a normally terminated timed-out command", async () => {
  const scenarioPath = await writeScenario("normal-timeout", {
    cases: [{
      name: "times out",
      command: "node",
      args: ["-e", "setTimeout(() => {}, 5_000)"],
      timeoutMs: 25
    }]
  });

  const report = await runScenarios([scenarioPath]);
  const result = report.scenarios[0].cases[0];

  assert.equal(report.passed, false);
  assert.equal(result.timedOut, true);
  assert.equal(result.signal, "SIGTERM");
  assert.match(result.assertions[0].message, /timed out after 25ms/);
  assert.ok(result.durationMs < 1_000, `timeout took ${result.durationMs}ms`);
});

test("runScenarios forcefully stops a command that ignores SIGTERM", { skip: process.platform === "win32" }, async () => {
  const readyMarker = "ready-to-resist";
  const scenarioPath = await writeScenario("resisting-timeout", {
    cases: [{
      name: "resists SIGTERM",
      command: "node",
      args: ["-e", `process.on('SIGTERM', () => {}); console.log('${readyMarker}', process.pid); setTimeout(() => {}, 5_000)`],
      // Leave enough time for Node to start and print after installing the handler.
      timeoutMs: 500
    }]
  });

  const startedAt = Date.now();
  const report = await runScenarios([scenarioPath]);
  const elapsedMs = Date.now() - startedAt;
  const result = report.scenarios[0].cases[0];
  const readyMatch = result.stdout.match(new RegExp(`^${readyMarker} (\\d+)\\n$`));

  assert.equal(report.passed, false);
  assert.equal(result.timedOut, true);
  assert.equal(result.signal, "SIGKILL");
  assert.ok(readyMatch, `child did not signal readiness: ${JSON.stringify(result.stdout)}`);
  assert.ok(elapsedMs < 1_500, `timeout took ${elapsedMs}ms`);
  const pid = Number.parseInt(readyMatch[1], 10);
  assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
});

async function writeScenario(name, scenario) {
  const dir = new URL(`${name}/`, tmpRoot);
  await rm(dir, { force: true, recursive: true });
  await mkdir(dir, { recursive: true });
  const scenarioPath = join(dir.pathname, "scenario.json");
  await writeFile(scenarioPath, JSON.stringify(scenario));
  return scenarioPath;
}
