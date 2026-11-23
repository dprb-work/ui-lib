import { expect, test } from "@playwright/test";

const story = "/iframe.html?id=foundations-states--shared-controls&viewMode=story";

for (const width of [390, 1440]) {
  test(`Shared controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(story);
    await page.evaluate(() => globalThis.document.fonts.ready);
    await expect(page).toHaveScreenshot(`shared-controls-${width}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.002,
    });
  });
}
