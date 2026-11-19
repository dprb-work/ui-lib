import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview, ReactRenderer } from "@storybook/react-vite";
import { useEffect } from "react";
import { accentCandidate, accentOptions } from "./accent-candidates";

import "katex/dist/katex.min.css";
import "../src/styles.css";
import "../src/chat/composer/styles.css";
import "../src/chat/content/styles.css";
import "./accent-candidates.css";

const AccentDecorator: Decorator = (Story, context) => {
  const candidate = accentCandidate(context.globals.accent);
  useEffect(() => {
    const root = document.documentElement;
    if (candidate === "default") root.removeAttribute("data-accent-candidate");
    else root.setAttribute("data-accent-candidate", candidate);
    return () => root.removeAttribute("data-accent-candidate");
  }, [candidate]);
  return <Story />;
};

const preview = {
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
    AccentDecorator,
  ],
  globalTypes: {
    accent: {
      description: "Sample-only accent proposal; production defaults are unchanged.",
      toolbar: {
        title: "Accent proposal",
        icon: "paintbrush",
        items: accentOptions.map(option => ({ value: option.id, title: option.label })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { accent: "default" },
  parameters: {
    a11y: { test: "error" },
    backgrounds: {
      options: {
        light: { name: "Light", value: "#f8fafc" },
        dark: { name: "Dark", value: "#0f172a" },
      },
    },
    layout: "centered",
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop", styles: { width: "1280px", height: "900px" } },
      },
    },
  },
} satisfies Preview;

export default preview;
