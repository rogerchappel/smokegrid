import { dirname, resolve } from "node:path";

import type { SmokeCase, SmokeScenario } from "./types.js";

export function resolveScenarioCwd(scenarioPath: string, scenario: SmokeScenario, smokeCase: SmokeCase): string {
  const baseDir = dirname(resolve(scenarioPath));
  const scenarioCwd = scenario.cwd ? resolve(baseDir, scenario.cwd) : baseDir;
  return smokeCase.cwd ? resolve(scenarioCwd, smokeCase.cwd) : scenarioCwd;
}

export function mergeEnv(scenario: SmokeScenario, smokeCase: SmokeCase): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ...scenario.env,
    ...smokeCase.env
  };
}
