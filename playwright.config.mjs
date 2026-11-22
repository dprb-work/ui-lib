import { defineConfig } from "@playwright/test";
import process from "node:process";

export default defineConfig({
  testDir: "./tests/visual",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    colorScheme: "light",
    reducedMotion: "reduce",
    viewport: { width: 390, height: 1000 },
  },
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1 --directory storybook-static",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
