export type OutputMatchKind = "contains" | "exact" | "regex";

export interface OutputExpectation {
  kind?: OutputMatchKind;
  value: string;
}

export interface ExitExpectation {
  code: number;
}

export interface CaseExpectations {
  exit?: number | ExitExpectation;
  stdout?: string | OutputExpectation | OutputExpectation[];
  stderr?: string | OutputExpectation | OutputExpectation[];
}

export interface SmokeCase {
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  stdin?: string;
  timeoutMs?: number;
  expect?: CaseExpectations;
}

export interface SmokeScenario {
  name?: string;
  description?: string;
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  cases: SmokeCase[];
}

export interface RunOptions {
  failFast: boolean;
}

export interface CaseExecution {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

export interface AssertionResult {
  pass: boolean;
  message: string;
}

export interface CaseResult {
  name: string;
  command: string;
  args: string[];
  cwd: string;
  durationMs: number;
  passed: boolean;
  timedOut: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  assertions: AssertionResult[];
}

export interface ScenarioReport {
  scenarioPath: string;
  scenarioName: string;
  passed: boolean;
  durationMs: number;
  total: number;
  failed: number;
  cases: CaseResult[];
}

export interface RunReport {
  passed: boolean;
  durationMs: number;
  total: number;
  failed: number;
  scenarios: ScenarioReport[];
}
