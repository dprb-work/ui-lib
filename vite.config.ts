import tailwindcss from "@tailwindcss/vite";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "external-katex-fonts",
      enforce: "pre",
      transform(code, id) {
        if (!id.endsWith("/katex.min.css")) return;
        // Library mode otherwise inlines fonts, which breaks self-only font CSP.
        return code.replace(/url\(([^)]+)\)/g, "url($1?no-inline)");
      },
    },
  ],
  build: {
    emptyOutDir: false,
    cssCodeSplit: true,
    lib: {
      entry: {
        index: fileURLToPath(new URL("src/index.ts", import.meta.url)),
        chat: fileURLToPath(new URL("src/chat.ts", import.meta.url)),
        charts: fileURLToPath(new URL("src/charts.tsx", import.meta.url)),
        "data-table": fileURLToPath(new URL("src/data-table.tsx", import.meta.url)),
      },
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          asset.names.includes("index.css")
            ? "styles.css"
            : asset.names.includes("chat.css")
              ? "chat.css"
              : "assets/[name]-[hash][extname]",
      },
      external: [
        "@icons-pack/react-simple-icons",
        "katex",
        "lowlight",
        "mdast-util-directive",
        "react-markdown",
        "rehype-katex",
        "remark-directive",
        "remark-gfm",
        "remark-math",
        "strip-ansi",
        "unist-util-visit",
        "@tanstack/react-table",
        "chart.js",
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
