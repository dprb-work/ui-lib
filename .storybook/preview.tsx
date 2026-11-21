import type { Decorator, Preview } from "@storybook/react-vite";

import "katex/dist/katex.min.css";
import "../src/styles.css";
import "../src/chat/composer/styles.css";
import "../src/chat/content/styles.css";
import { StorybookThemeSync } from "./StorybookThemeSync";
import { initializeStorybookThemeState, isResolvedTheme } from "./storybook-theme-state";

initializeStorybookThemeState();

const withSystemTheme: Decorator = (Story, context) => {
  const themeParameters = context.parameters?.themes as { themeOverride?: unknown } | undefined;
  const themeOverride = isResolvedTheme(themeParameters?.themeOverride) ? themeParameters.themeOverride : null;
  const storyTheme = isResolvedTheme(context.storyGlobals?.theme) ? context.storyGlobals.theme : null;
  const userTheme = isResolvedTheme(context.userGlobals?.theme) ? context.userGlobals.theme : null;
  return (
    <StorybookThemeSync
      themeOverride={themeOverride}
      storyTheme={storyTheme}
      userTheme={userTheme}
    >
      <Story />
    </StorybookThemeSync>
  );
};

const preview = {
  decorators: [withSystemTheme],
  parameters: {
    a11y: {
      test: "error",
    },
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
