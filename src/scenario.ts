import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  CaseExpectations,
  OutputExpectation,
  SmokeCase,
  SmokeScenario
} from "./types.js";

export class ScenarioError extends Error {
  constructor(
    message: string,
    public readonly scenarioPath: string
  ) {
    super(`${scenarioPath}: ${message}`);
    this.name = "ScenarioError";
  }
}

export async function loadScenario(path: string): Promise<SmokeScenario> {
  const scenarioPath = resolve(path);
  let parsed: unknown;

  try {
    parsed = JSON.parse(await readFile(scenarioPath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ScenarioError(`failed to parse JSON: ${message}`, scenarioPath);
  }

  validateScenario(parsed, scenarioPath);
  return parsed;
}

function validateScenario(value: unknown, scenarioPath: string): asserts value is SmokeScenario {
  if (!isRecord(value)) {
    throw new ScenarioError("scenario must be a JSON object", scenarioPath);
  }

  optionalString(value, "name", scenarioPath);
  optionalString(value, "description", scenarioPath);
  optionalString(value, "cwd", scenarioPath);
  optionalStringMap(value, "env", scenarioPath);
  optionalNumber(value, "timeoutMs", scenarioPath);

  if (!Array.isArray(value.cases) || value.cases.length === 0) {
    throw new ScenarioError("cases must be a non-empty array", scenarioPath);
  }

  value.cases.forEach((item, index) => validateCase(item, index, scenarioPath));
}

function validateCase(value: unknown, index: number, scenarioPath: string): asserts value is SmokeCase {
  if (!isRecord(value)) {
    throw new ScenarioError(`cases[${index}] must be an object`, scenarioPath);
  }

  requiredString(value, "name", `cases[${index}]`, scenarioPath);
  requiredString(value, "command", `cases[${index}]`, scenarioPath);
  optionalString(value, "cwd", scenarioPath, `cases[${index}]`);
  optionalStringMap(value, "env", scenarioPath, `cases[${index}]`);
  optionalString(value, "stdin", scenarioPath, `cases[${index}]`);
  optionalNumber(value, "timeoutMs", scenarioPath, `cases[${index}]`);

  if (value.args !== undefined && (!Array.isArray(value.args) || !value.args.every((item) => typeof item === "string"))) {
    throw new ScenarioError(`cases[${index}].args must be an array of strings`, scenarioPath);
  }

  if (value.expect !== undefined) {
    validateExpectations(value.expect, `cases[${index}].expect`, scenarioPath);
  }
}

function validateExpectations(value: unknown, location: string, scenarioPath: string): asserts value is CaseExpectations {
  if (!isRecord(value)) {
    throw new ScenarioError(`${location} must be an object`, scenarioPath);
  }

  if (value.exit !== undefined && typeof value.exit !== "number") {
    if (!isRecord(value.exit) || typeof value.exit.code !== "number") {
      throw new ScenarioError(`${location}.exit must be a number or { "code": number }`, scenarioPath);
    }
  }

  validateOutput(value.stdout, `${location}.stdout`, scenarioPath);
  validateOutput(value.stderr, `${location}.stderr`, scenarioPath);
}

function validateOutput(value: unknown, location: string, scenarioPath: string): void {
  if (value === undefined || typeof value === "string") {
    return;
  }

  const values = Array.isArray(value) ? value : [value];
  for (const expectation of values) {
    if (!isOutputExpectation(expectation)) {
      throw new ScenarioError(`${location} must be a string or output expectation`, scenarioPath);
    }
  }
}

function isOutputExpectation(value: unknown): value is OutputExpectation {
  return (
    isRecord(value) &&
    typeof value.value === "string" &&
    (value.kind === undefined || value.kind === "contains" || value.kind === "exact" || value.kind === "regex")
  );
}

function requiredString(value: Record<string, unknown>, key: string, location: string, scenarioPath: string): void {
  if (typeof value[key] !== "string" || value[key].length === 0) {
    throw new ScenarioError(`${location}.${key} must be a non-empty string`, scenarioPath);
  }
}

function optionalString(value: Record<string, unknown>, key: string, scenarioPath: string, location = "scenario"): void {
  if (value[key] !== undefined && typeof value[key] !== "string") {
    throw new ScenarioError(`${location}.${key} must be a string`, scenarioPath);
  }
}

function optionalNumber(value: Record<string, unknown>, key: string, scenarioPath: string, location = "scenario"): void {
  if (value[key] !== undefined && typeof value[key] !== "number") {
    throw new ScenarioError(`${location}.${key} must be a number`, scenarioPath);
  }
}

function optionalStringMap(value: Record<string, unknown>, key: string, scenarioPath: string, location = "scenario"): void {
  if (value[key] === undefined) {
    return;
  }

  if (!isRecord(value[key]) || !Object.values(value[key]).every((item) => typeof item === "string")) {
    throw new ScenarioError(`${location}.${key} must be an object of string values`, scenarioPath);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
