import { performance } from "node:perf_hooks";

import { evaluateExpectations } from "./assertions.js";
import { executeCase } from "./execute.js";
import { mergeEnv, resolveScenarioCwd } from "./paths.js";
import { loadScenario } from "./scenario.js";
import type { CaseResult, RunReport, ScenarioReport, SmokeCase, SmokeScenario } from "./types.js";

export const version = "0.1.0";

const DEFAULT_TIMEOUT_MS = 30_000;

export async function runScenarios(scenarioPaths: string[], options = { failFast: false }): Promise<RunReport> {
  if (scenarioPaths.length === 0) {
    throw new Error("At least one scenario path is required.");
  }

  const startedAt = performance.now();
  const scenarios: ScenarioReport[] = [];

  for (const scenarioPath of scenarioPaths) {
    const scenario = await loadScenario(scenarioPath);
    const report = await runScenario(scenarioPath, scenario, options.failFast);
    scenarios.push(report);

    if (options.failFast && !report.passed) {
      break;
    }
  }

  const failed = scenarios.reduce((sum, scenario) => sum + scenario.failed, 0);
  const total = scenarios.reduce((sum, scenario) => sum + scenario.total, 0);

  return {
    passed: failed === 0,
    durationMs: Math.round(performance.now() - startedAt),
    total,
    failed,
    scenarios
  };
}

export async function runScenario(scenarioPath: string, scenario: SmokeScenario, failFast: boolean): Promise<ScenarioReport> {
  const startedAt = performance.now();
  const cases: CaseResult[] = [];

  for (const smokeCase of scenario.cases) {
    const result = await runCase(scenarioPath, scenario, smokeCase);
    cases.push(result);

    if (failFast && !result.passed) {
      break;
    }
  }

  const failed = cases.filter((item) => !item.passed).length;

  return {
    scenarioPath,
    scenarioName: scenario.name ?? scenarioPath,
    passed: failed === 0,
    durationMs: Math.round(performance.now() - startedAt),
    total: cases.length,
    failed,
    cases
  };
}

export function formatReport(report: RunReport): string {
  const lines = [
    report.passed ? "smokegrid passed" : "smokegrid failed",
    `scenarios=${report.scenarios.length} cases=${report.total} failed=${report.failed} durationMs=${report.durationMs}`
  ];

  for (const scenario of report.scenarios) {
    lines.push("");
    lines.push(`${scenario.passed ? "PASS" : "FAIL"} ${scenario.scenarioName} (${scenario.total - scenario.failed}/${scenario.total})`);

    for (const smokeCase of scenario.cases) {
      lines.push(`  ${smokeCase.passed ? "PASS" : "FAIL"} ${smokeCase.name} (${smokeCase.durationMs}ms)`);

      for (const assertion of smokeCase.assertions) {
        lines.push(`    ${assertion.pass ? "PASS" : "FAIL"} ${assertion.message}`);
      }
    }
  }

  return `${lines.join("\n")}\n`;
}

async function runCase(scenarioPath: string, scenario: SmokeScenario, smokeCase: SmokeCase): Promise<CaseResult> {
  const cwd = resolveScenarioCwd(scenarioPath, scenario, smokeCase);
  const timeoutMs = smokeCase.timeoutMs ?? scenario.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const execution = await executeCase(smokeCase, cwd, mergeEnv(scenario, smokeCase), timeoutMs);
  const assertions = execution.timedOut
    ? [{ pass: false, message: `timed out after ${timeoutMs}ms` }]
    : evaluateExpectations(smokeCase.expect, execution);

  return {
    name: smokeCase.name,
    command: smokeCase.command,
    args: smokeCase.args ?? [],
    cwd,
    durationMs: execution.durationMs,
    passed: assertions.every((assertion) => assertion.pass),
    timedOut: execution.timedOut,
    exitCode: execution.exitCode,
    signal: execution.signal,
    stdout: execution.stdout,
    stderr: execution.stderr,
    assertions
  };
}
