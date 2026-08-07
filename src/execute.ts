import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

import type { CaseExecution, SmokeCase } from "./types.js";

const FORCE_KILL_GRACE_MS = 100;
const PROCESS_GROUP_CLEANUP_TIMEOUT_MS = 1_000;
const PROCESS_GROUP_POLL_MS = 10;
const SUPPORTS_PROCESS_GROUPS = process.platform !== "win32";

function killCommand(child: ReturnType<typeof spawn>, signal: NodeJS.Signals): void {
  try {
    if (SUPPORTS_PROCESS_GROUPS && child.pid !== undefined) {
      process.kill(-child.pid, signal);
    } else {
      child.kill(signal);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
      throw error;
    }
  }
}

function processGroupExists(child: ReturnType<typeof spawn>): boolean {
  if (!SUPPORTS_PROCESS_GROUPS || child.pid === undefined) {
    return false;
  }

  try {
    process.kill(-child.pid, 0);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // EPERM means the group contains no process this runner can signal. Since
    // every process it spawned has the same credentials, its group is clean.
    if (code === "ESRCH" || code === "EPERM") {
      return false;
    }
    throw error;
  }
}

async function waitForProcessGroupCleanup(child: ReturnType<typeof spawn>): Promise<boolean> {
  const deadline = performance.now() + PROCESS_GROUP_CLEANUP_TIMEOUT_MS;
  while (processGroupExists(child) && performance.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, PROCESS_GROUP_POLL_MS));
  }
  return !processGroupExists(child);
}

export function executeCase(smokeCase: SmokeCase, cwd: string, env: NodeJS.ProcessEnv, timeoutMs: number): Promise<CaseExecution> {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const child = spawn(smokeCase.command, smokeCase.args ?? [], {
      cwd,
      env,
      detached: SUPPORTS_PROCESS_GROUPS,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let forceKillPromise: Promise<void> | undefined;

    const timeout = setTimeout(() => {
      if (child.exitCode !== null || child.signalCode !== null) {
        return;
      }

      timedOut = true;
      killCommand(child, "SIGTERM");

      forceKillPromise = new Promise((resolveForceKill) => {
        setTimeout(async () => {
          // The direct child may have exited while a descendant still holds
          // its inherited stdio open, so always address the process group.
          killCommand(child, "SIGKILL");
          if (!(await waitForProcessGroupCleanup(child))) {
            const message = `process group remained after ${PROCESS_GROUP_CLEANUP_TIMEOUT_MS}ms cleanup timeout`;
            stderr += stderr ? `\n${message}` : message;
          }
          resolveForceKill();
        }, FORCE_KILL_GRACE_MS);
      });
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

    const onClose = async (exitCode: number | null, signal: NodeJS.Signals | null) => {
      clearTimeout(timeout);
      if (forceKillPromise !== undefined) {
        await forceKillPromise;
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
