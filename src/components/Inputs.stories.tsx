import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { TextInput } from "./Inputs";

const meta = {
  title: "Components/Inputs",
  component: TextInput,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function SearchInputStates() {
  return (
    <div className="grid w-72 max-w-full gap-5 text-sm text-ui-foreground">
      <label className="grid gap-1">
        Search repositories
        <TextInput type="search" placeholder="Name or owner" />
      </label>
      <label className="grid gap-1">
        Search with an error
        <TextInput
          type="search"
          defaultValue="a"
          error="Enter at least two characters."
          aria-describedby="search-hint"
        />
        <span id="search-hint" className="text-xs text-ui-muted-foreground">Searches repository names and owners.</span>
      </label>
      <label className="grid gap-1 text-ui-muted-foreground">
        Disabled search
        <TextInput type="search" disabled defaultValue="Archived" />
      </label>
    </div>
  );
}

export const SearchStates: Story = {
  render: () => <SearchInputStates />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox", { name: "Search repositories" });

    await userEvent.click(input);
    await expect(input).toHaveFocus();
  },
};

export const SearchStatesDark: Story = {
  ...SearchStates,
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
};

export const NarrowSearch: Story = {
  render: () => (
    <div className="w-48 max-w-full">
      <label className="grid gap-1 text-sm">
        Search repositories
        <TextInput type="search" placeholder="Name or owner" />
      </label>
    </div>
  ),
};
