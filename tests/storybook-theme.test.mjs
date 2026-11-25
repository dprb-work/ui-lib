import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { URL, fileURLToPath } from "node:url";
import { extname, join, normalize, resolve, sep } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { chromium } from "playwright";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const staticDirectory = resolve(process.env.STORYBOOK_STATIC_DIR ?? join(repoRoot, "storybook-static"));
const mimeTypes = new Map([
  [".css", "text/css"],
  [".html", "text/html"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript"],
  [".json", "application/json"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

async function serveStorybook() {
  try {
    await access(join(staticDirectory, "index.html"));
  } catch {
    throw new Error(`Built Storybook is missing at ${staticDirectory}; set STORYBOOK_STATIC_DIR to its directory.`);
  }

  const server = createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const relativePath = normalize(requestPath === "/" ? "index.html" : requestPath.slice(1));
    const filePath = resolve(staticDirectory, relativePath);
    if (filePath !== staticDirectory && !filePath.startsWith(`${staticDirectory}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    stat(filePath)
      .then((fileStat) => {
        const resolvedFile = fileStat.isDirectory() ? join(filePath, "index.html") : filePath;
        response.setHeader("content-type", mimeTypes.get(extname(resolvedFile)) ?? "application/octet-stream");
        createReadStream(resolvedFile).pipe(response);
      })
      .catch(() => response.writeHead(404).end("Not found"));
  });

  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}/?path=/story/foundations-color-palette--semantic-colors`,
    close: () => new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose())),
  };
}

async function previewState(page, expectedText) {
  const frame = page.frameLocator("#storybook-preview-iframe");
  await frame.locator("#storybook-root > *").first().waitFor();
  if (expectedText) await frame.getByText(expectedText, { exact: true }).waitFor();
  return frame.locator("html").evaluate((element) => ({
    dark: globalThis.document.documentElement.classList.contains("dark"),
    background: globalThis.getComputedStyle(globalThis.document.body).backgroundColor,
    htmlClass: element.className,
  }));
}

async function expectPreview(page, theme) {
  const state = await previewState(page);
  assert.equal(state.dark, theme === "dark", `expected ${theme} preview, got ${state.htmlClass}`);
  assert.equal(state.background, theme === "dark" ? "rgb(0, 3, 16)" : "rgb(248, 250, 252)");
}

async function openStory(browser, url, colorScheme) {
  const context = await browser.newContext({ colorScheme });
  const page = await context.newPage();
  await page.goto(url);
  await page.locator("#storybook-preview-iframe").waitFor();
  await previewState(page, "Background");
  return { context, page };
}


test("Storybook follows system theme and explicit toolbar choices", async (t) => {
  const storybook = await serveStorybook();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => {
    await browser.close();
    await storybook.close();
  });

  await t.test("dark and light system preferences render matching preview themes", async () => {
    for (const [scheme, theme] of [["dark", "dark"], ["light", "light"]]) {
      const { context, page } = await openStory(browser, storybook.url, scheme);
      try {
        await expectPreview(page, theme);
      } finally {
        await context.close();
      }
    }
  });

  await t.test("no-preference follows Chromium media reporting and unavailable preference defaults dark", async () => {
    const { context, page } = await openStory(browser, storybook.url, "no-preference");
    try {
      const browserReportsLight = await page.evaluate(() => globalThis.matchMedia("(prefers-color-scheme: light)").matches);
      const browserReportsDark = await page.evaluate(() => globalThis.matchMedia("(prefers-color-scheme: dark)").matches);
      assert.equal(browserReportsLight || browserReportsDark, true, "Chromium should report a light or dark preference");
      await expectPreview(page, browserReportsDark ? "dark" : "light");
    } finally {
      await context.close();
    }

    const unavailableContext = await browser.newContext({ colorScheme: "light" });
    await unavailableContext.addInitScript(() => {
      const nativeMatchMedia = globalThis.matchMedia.bind(globalThis);
      globalThis.matchMedia = (query) => query.includes("prefers-color-scheme")
        ? { matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; } }
        : nativeMatchMedia(query);
    });
    const unavailablePage = await unavailableContext.newPage();
    try {
      await unavailablePage.goto(storybook.url);
      await previewState(unavailablePage);
      await expectPreview(unavailablePage, "dark");
    } finally {
      await unavailableContext.close();
    }
  });

  await t.test("live system changes update the preview", async () => {
    const { context, page } = await openStory(browser, storybook.url, "dark");
    try {
      for (const theme of ["dark", "light", "dark"]) {
        await page.emulateMedia({ colorScheme: theme });
        await expectPreview(page, theme);
      }
    } finally {
      await context.close();
    }
  });

  await t.test("toolbar overrides persist across stories and system restores", async () => {
    const { context, page } = await openStory(browser, storybook.url, "dark");
    try {
      await expectPreview(page, "dark");
      await page.getByRole("button", { name: "Theme" }).click();
      await expectPreview(page, "light");

      await page.goto(`${new URL(storybook.url).origin}/?path=/story/components-controls--buttons`);
      await previewState(page);
      await expectPreview(page, "light");

      await page.emulateMedia({ colorScheme: "light" });
      await page.getByRole("button", { name: "Theme" }).click();
      await expectPreview(page, "dark");
    } finally {
      await context.close();
    }
  });
});

test("Tooltip stories load in static Storybook and retain reduced-motion keyboard help", async (t) => {
  const storybook = await serveStorybook();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => {
    await browser.close();
    await storybook.close();
  });

  const stories = [
    ["default", "Inspect"],
    ["custom-arrow", "With arrow"],
    ["optional", "Save"],
    ["accessible-label-fallback", "Search"],
    ["provider-defaults", "Provider style"],
    ["near-bottom-collision", "Near bottom edge"],
    ["reduced-motion-keyboard-focus", "Save"],
  ];
  for (const colorScheme of ["light", "dark"]) {
    for (const [story, buttonName] of stories) {
      await t.test(`${story} renders in ${colorScheme}`, async () => {
        const context = await browser.newContext({ colorScheme, reducedMotion: "reduce" });
        try {
          const page = await context.newPage();
          const pageErrors = [];
          page.on("pageerror", (error) => pageErrors.push(error.message));
          // Embed mode leaves story interactions to this independent browser check.
          const url = new URL("/iframe.html", storybook.url);
          url.search = new URLSearchParams({
            id: `components-tooltip--${story}`,
            viewMode: "story",
            embed: "true",
          }).toString();
          await page.goto(url.href);
          await page.waitForFunction(() =>
            document.querySelector("#storybook-root")?.childElementCount > 0
            || document.body.classList.contains("sb-show-errordisplay")
            || document.body.classList.contains("sb-show-nopreview"),
          );
          assert.equal(
            await page.locator("body").evaluate((body) => body.classList.contains("sb-show-errordisplay")),
            false,
            await page.locator("#error-message").textContent(),
          );
          assert.equal(await page.getByRole("button", { name: buttonName, exact: true }).isVisible(), true);
          assert.deepEqual(pageErrors, []);

          if (story === "reduced-motion-keyboard-focus") {
            await page.keyboard.press("Tab");
            // Sample immediately after Tab, without polling for delayed help.
            const state = await page.evaluate(() => {
              const tooltip = document.querySelector('[role="tooltip"]');
              const style = tooltip && getComputedStyle(tooltip);
              return {
                reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
                focusedLabel: document.activeElement?.textContent,
                help: tooltip?.textContent,
                visible: !!tooltip?.getClientRects().length && style?.visibility === "visible",
                opacity: style?.opacity,
                animationName: style?.animationName,
                animations: tooltip?.getAnimations({ subtree: true }).length,
              };
            });
            assert.deepEqual(state, {
              reducedMotion: true,
              focusedLabel: "Save",
              help: "Save the current draft",
              visible: true,
              opacity: "1",
              animationName: "none",
              animations: 0,
            });
          }
        } finally {
          await context.close();
        }
      });
    }
  }
});
