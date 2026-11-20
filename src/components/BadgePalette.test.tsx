import badgeSource from "./Badge.tsx?raw";
import { describe, expect, test } from "vitest";

describe("Badge palette contract", () => {
  test("uses semantic status roles instead of hard-coded family color utilities", () => {
    const source = badgeSource;

    expect(source).not.toMatch(/(?:bg|text|border)-(?:blue|emerald|amber|red|rose|cyan|teal)-\d{2,3}/);
    expect(source).toContain("ui-success");
    expect(source).toContain("ui-warning");
    expect(source).toContain("ui-info");
    expect(source).toContain("ui-danger");
  });
});
