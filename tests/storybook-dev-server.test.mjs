import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { get } from "node:http";
import { createConnection, createServer } from "node:net";
import { networkInterfaces } from "node:os";
import { resolve } from "node:path";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import { setTimeout as delay } from "node:timers/promises";
import { URL, fileURLToPath } from "node:url";
import { after, before, describe, test } from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const readinessTimeout = 120_000;
const childStopTimeout = 5_000;
const connectionTimeout = 3_000;

let child;
let output = "";
let port;

async function getFreePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await new Promise((resolveListen, reject) => {
    server.once("listening", resolveListen);
    server.once("error", reject);
  });
  const address = server.address();
  await new Promise((resolveClose, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolveClose();
    });
  });
  assert.ok(address && typeof address !== "string");
  return address.port;
}

function getHttpResponse(url, timeout = 10_000) {
  return new Promise((resolveResponse, reject) => {
    const request = get(url, (response) => {
      response.resume();
      resolveResponse(response);
    });
    request.setTimeout(timeout, () => {
      request.destroy(new Error(`HTTP request timed out after ${timeout} ms.`));
    });
    request.once("error", reject);
  });
}

function childDiagnostics() {
  return `Storybook dev output:\n${output || "(no output)"}`;
}

function isProcessGroupAlive(pid) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") {
      return false;
    }
    throw error;
  }
}

async function waitForProcessGroupExit(pid, timeout) {
  const deadline = Date.now() + timeout;
  while (isProcessGroupAlive(pid) && Date.now() < deadline) {
    await delay(100);
  }
  return !isProcessGroupAlive(pid);
}

function isLoopbackFrameSource(source) {
  if (source === "'self'" || source === "'none'") {
    return true;
  }
  return /^https?:\/\/(?:(?:\*\.)?localhost|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+localhost|127\.0\.0\.1|\[::1\])(?::(?:\*|\d+))?$/i.test(source);
}

function hasLoopbackOnlyFrameAncestors(policyValues) {
  let foundFrameAncestors = false;
  for (const policyValue of policyValues) {
    for (const policy of policyValue.split(",")) {
      for (const directive of policy.split(";")) {
        const [name, ...sources] = directive.trim().split(/\s+/);
        if (name?.toLowerCase() !== "frame-ancestors") {
          continue;
        }
        foundFrameAncestors = true;
        if (sources.length === 0 || (sources.includes("'none'") && sources.length !== 1)) {
          return false;
        }
        if (!sources.every(isLoopbackFrameSource)) {
          return false;
        }
      }
    }
  }
  return foundFrameAncestors;
}

async function waitForStorybook() {
  const deadline = Date.now() + readinessTimeout;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Storybook dev exited before becoming ready.\n${childDiagnostics()}`);
    }
    try {
      const response = await getHttpResponse(`http://127.0.0.1:${port}/iframe.html`, 2_000);
      if (response.statusCode === 200) {
        return;
      }
    } catch {
      // Keep polling while the server starts.
    }
    await delay(250);
  }
  throw new Error(`Storybook dev did not become ready within ${readinessTimeout} ms.\n${childDiagnostics()}`);
}

async function canConnect(address, targetPort) {
  return new Promise((resolveConnection) => {
    const socket = createConnection({ host: address, port: targetPort });
    const timeout = setTimeout(() => {
      socket.destroy();
      resolveConnection(false);
    }, connectionTimeout);
    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.destroy();
      resolveConnection(true);
    });
    socket.once("error", () => {
      clearTimeout(timeout);
      resolveConnection(false);
    });
  });
}

describe("Storybook dev server security", { timeout: 180_000 }, () => {
  before(async () => {
    port = await getFreePort();
    child = spawn("pnpm", ["run", "dev", "--port", String(port)], {
      cwd: repoRoot,
      detached: true,
      env: {
        ...process.env,
        CI: "true",
        STORYBOOK_DISABLE_TELEMETRY: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.setEncoding("utf8").on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk) => {
      output += chunk;
    });
    child.once("error", (error) => {
      output += `${error}\n`;
    });
    await waitForStorybook();
  });

  after(async () => {
    if (!child?.pid) {
      return;
    }
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") {
        throw error;
      }
    }
    if (!(await waitForProcessGroupExit(child.pid, childStopTimeout))) {
      process.kill(-child.pid, "SIGKILL");
      await waitForProcessGroupExit(child.pid, childStopTimeout);
    }
  });

  test("serves on loopback", async () => {
    const response = await getHttpResponse(`http://127.0.0.1:${port}/iframe.html`);
    assert.equal(response.statusCode, 200);
  });

  test("is not reachable on non-loopback addresses", async () => {
    const addresses = Object.values(networkInterfaces())
      .flatMap((entries) => entries ?? [])
      .filter((entry) => entry.family === "IPv4" && !entry.internal)
      .map((entry) => entry.address);
    assert.ok(addresses.length > 0, "No non-internal IPv4 address is available to verify the bind boundary.");

    for (const address of addresses) {
      assert.equal(
        await canConnect(address, port),
        false,
        `Storybook dev accepted a TCP connection on non-loopback address ${address}.`,
      );
    }
  });

  test("forbids framing by foreign sites", async () => {
    for (const path of ["/", "/iframe.html"]) {
      const response = await getHttpResponse(`http://127.0.0.1:${port}${path}`);
      const policyValues = response.headers["content-security-policy"];
      const policies = Array.isArray(policyValues) ? policyValues : policyValues ? [policyValues] : [];
      assert.ok(policies.length > 0, `Expected a Content-Security-Policy response header for ${path}.`);
      assert.equal(
        hasLoopbackOnlyFrameAncestors(policies),
        true,
        `Expected all frame-ancestors sources for ${path} to be loopback-only.`,
      );
    }
  });
});
