import type { AssertionResult, CaseExpectations, CaseExecution, OutputExpectation } from "./types.js";

export function evaluateExpectations(expect: CaseExpectations | undefined, execution: CaseExecution): AssertionResult[] {
  const expectations = expect ?? {};
  return [
    assertExit(expectations.exit, execution),
    ...assertOutput("stdout", expectations.stdout, execution.stdout),
    ...assertOutput("stderr", expectations.stderr, execution.stderr)
  ];
}

function assertExit(expectation: CaseExpectations["exit"], execution: CaseExecution): AssertionResult {
  const expected = typeof expectation === "number" ? expectation : expectation?.code ?? 0;
  const pass = execution.exitCode === expected;
  return {
    pass,
    message: pass ? `exit code matched ${expected}` : `expected exit code ${expected}, got ${execution.exitCode ?? execution.signal ?? "none"}`
  };
}

function assertOutput(
  stream: "stdout" | "stderr",
  expectation: string | OutputExpectation | OutputExpectation[] | undefined,
  actual: string
): AssertionResult[] {
  if (expectation === undefined) {
    return [];
  }

  const expectations = Array.isArray(expectation) ? expectation : [expectation];
  return expectations.map((item) => assertSingleOutput(stream, normalizeExpectation(item), actual));
}

function assertSingleOutput(stream: "stdout" | "stderr", expectation: Required<OutputExpectation>, actual: string): AssertionResult {
  if (expectation.kind === "exact") {
    const pass = actual === expectation.value;
    return {
      pass,
      message: pass ? `${stream} exactly matched` : `${stream} did not exactly match ${JSON.stringify(expectation.value)}`
    };
  }

  if (expectation.kind === "regex") {
    const pass = new RegExp(expectation.value, "u").test(actual);
    return {
      pass,
      message: pass ? `${stream} matched /${expectation.value}/` : `${stream} did not match /${expectation.value}/`
    };
  }

  const pass = actual.includes(expectation.value);
  return {
    pass,
    message: pass ? `${stream} contained ${JSON.stringify(expectation.value)}` : `${stream} did not contain ${JSON.stringify(expectation.value)}`
  };
}

function normalizeExpectation(expectation: string | OutputExpectation): Required<OutputExpectation> {
  if (typeof expectation === "string") {
    return { kind: "contains", value: expectation };
  }

  return {
    kind: expectation.kind ?? "contains",
    value: expectation.value
  };
}
