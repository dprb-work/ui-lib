import { defineConfig } from "@playwright/test";
const port = 6191;

export default defineConfig({
  testDir: "./tests/visual",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    colorScheme: "light",
    reducedMotion: "reduce",
    viewport: { width: 390, height: 1000 },
  },
  webServer: {
    command: `python3 -m http.server ${port} --bind 127.0.0.1 --directory storybook-static`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
