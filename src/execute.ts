import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

import type { CaseExecution, SmokeCase } from "./types.js";

const FORCE_KILL_GRACE_MS = 100;

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
    let forceKillTimeout: NodeJS.Timeout | undefined;

    const timeout = setTimeout(() => {
      if (child.exitCode !== null || child.signalCode !== null) {
        return;
      }

      timedOut = true;
      child.kill("SIGTERM");

      forceKillTimeout = setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill("SIGKILL");
        }
      }, FORCE_KILL_GRACE_MS);
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    const onStdout = (chunk: string) => {
      stdout += chunk;
    };
    const onStderr = (chunk: string) => {
      stderr += chunk;
    };

    const onError = (error: Error) => {
      stderr += stderr ? `\n${error.message}` : error.message;
    };

    const onClose = (exitCode: number | null, signal: NodeJS.Signals | null) => {
      clearTimeout(timeout);
      if (forceKillTimeout !== undefined) {
        clearTimeout(forceKillTimeout);
      }
      child.stdout.removeListener("data", onStdout);
      child.stderr.removeListener("data", onStderr);
      child.removeListener("error", onError);
      child.removeListener("close", onClose);
      resolve({
        exitCode,
        signal,
        stdout,
        stderr,
        durationMs: Math.round(performance.now() - startedAt),
        timedOut
      });
    };

    child.stdout.on("data", onStdout);
    child.stderr.on("data", onStderr);
    child.on("error", onError);
    child.on("close", onClose);

    if (smokeCase.stdin !== undefined) {
      child.stdin.end(smokeCase.stdin);
    } else {
      child.stdin.end();
    }
  });
}
