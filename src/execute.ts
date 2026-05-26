import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

import type { CaseExecution, SmokeCase } from "./types.js";

export function executeCase(smokeCase: SmokeCase, cwd: string, env: NodeJS.ProcessEnv, timeoutMs: number): Promise<CaseExecution> {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const child = spawn(smokeCase.command, smokeCase.args ?? [], {
      cwd,
      env,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      stderr += stderr ? `\n${error.message}` : error.message;
    });

    child.on("close", (exitCode, signal) => {
      clearTimeout(timeout);
      resolve({
        exitCode,
        signal,
        stdout,
        stderr,
        durationMs: Math.round(performance.now() - startedAt),
        timedOut
      });
    });

    if (smokeCase.stdin !== undefined) {
      child.stdin.end(smokeCase.stdin);
    } else {
      child.stdin.end();
    }
  });
}
