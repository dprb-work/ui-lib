import tailwindcss from "@tailwindcss/vite";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  plugins: [react(), tailwindcss()],
  build: {
    emptyOutDir: false,
    lib: {
      cssFileName: "styles",
      entry: fileURLToPath(new URL("src/index.ts", import.meta.url)),
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "clsx",
        "lucide-react",
        "radix-ui",
        "react",
        "react-dom",
        "react/jsx-runtime",
        "tailwind-merge",
      ],
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          exclude: [...configDefaults.exclude, "src/**/*.stories.tsx"],
          globals: true,
          setupFiles: "./src/test/setup.ts",
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: fileURLToPath(new URL(".storybook", import.meta.url)),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
