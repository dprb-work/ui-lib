import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleCheck, CircleX, Info, MoreHorizontal, Trash2, TriangleAlert } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useState } from "react";

import { Badge } from "./Badge";
import { Button } from "./Button";
import { Dialog } from "./Interactions";
import { TextInput } from "./Inputs";
import { StatusPanel } from "./StatusPanel";

const meta = {
  title: "Foundations/Palette",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const families = ["Blue", "Amber", "Green", "Violet", "Rose", "Magenta", "Olive", "Slate", "Copper", "Cyan"] as const;
const roles = [
  { name: "success", family: "Green", Icon: CircleCheck, words: "Saved successfully" },
  { name: "warning", family: "Amber", Icon: TriangleAlert, words: "Warning: review before continuing" },
  { name: "info", family: "Blue", Icon: Info, words: "Information: analysis is running" },
  { name: "danger", family: "Status-only red", Icon: CircleX, words: "Error: could not save" },
] as const;

export const Shipped: Story = {
  render: () => (
    <main className="mx-auto grid max-w-4xl gap-6 text-sm text-ui-foreground">
      <header className="grid gap-2">
        <h1 className="text-xl font-semibold">Palette and roles</h1>
        <p>Current defaults. Exact steps and saturation await the owner’s brightness comparison; the ten-family selection is not final.</p>
        <p>Green is the accent. Status and data identity remain separate roles, even when their families overlap.</p>
      </header>
      <section className="grid gap-3" aria-label="Ten palette families and series order">
        <h2 className="text-base font-semibold">Ten families, in series order</h2>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {families.map((family, index) => (
            <li key={family} className="grid gap-2">
              <span className="block h-10 rounded" style={{ backgroundColor: `var(--ui-series-${index + 1})` }} />
              <span>{index + 1}. {family}</span>
              <code className="text-xs">--ui-series-{index + 1}</code>
            </li>
          ))}
        </ol>
        <p className="text-ui-muted-foreground">Light: 650. Dark: 700, except Green, Olive and Cyan at 650. These opaque paints serve fills, marks and edges; use neutral text for series labels.</p>
      </section>
      <section className="grid gap-3" aria-label="Accent roles">
        <h2 className="text-base font-semibold">Accent: Green</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button>Save changes</Button>
          <a href="#status-roles" className="text-ui-accent underline underline-offset-2">Read status roles</a>
        </div>
        <p className="text-ui-muted-foreground">Fill 650; hover 600; on-accent dark ink. Underlined links use 750 in light and 600 in dark.</p>
      </section>
      <section id="status-roles" className="grid gap-3" aria-label="Status roles">
        <h2 className="text-base font-semibold">Status: words and icons, not color alone</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {roles.map(({ name, family, Icon, words }) => (
            <div key={name} className="grid gap-2 rounded-md border p-4" style={{ color: `var(--ui-${name}-ink)`, backgroundColor: `var(--ui-${name}-fill)`, borderColor: `var(--ui-${name}-ink)` }}>
              <p className="font-semibold">{name}: {family}</p>
              <Badge tone={name}><Icon aria-hidden="true" size={14} />{words}</Badge>
              <p className="flex items-center gap-2"><Icon aria-hidden="true" size={18} />{words}</p>
            </div>
          ))}
        </div>
      </section>
      <p className="text-ui-muted-foreground">Shipped palette stops: 650 for all ten; 700 for the seven darker series; 50, 600, 750 and 950 for Blue, Amber and Green. No unused full ramps are added.</p>
    </main>
  ),
};

export const AccentAndSuccess: Story = {
  globals: { theme: "light" },
  render: () => (
    <main className="mx-auto grid max-w-6xl gap-6 text-sm text-ui-foreground">
      <header className="grid gap-2">
        <h1 className="text-xl font-semibold">Primary action beside success</h1>
        <p>Open question: should primary action and success deliberately share Green? The owner is leaning yes: the primary button is the positive action. This is not final.</p>
        <p>Proposed rule: at most one primary action per view region; success uses an icon and words; do not color unrelated elements green.</p>
        <p>Alternatives: move success to another family, or use different steps for accent text/fills and success.</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <section key={theme} data-theme={theme} aria-label={`${theme} action and success`} className="grid gap-4 rounded-md border border-ui-border bg-ui-background p-4 text-ui-foreground">
            <h2 className="text-base font-semibold">{theme === "light" ? "Light" : "Dark"}</h2>
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <div className="grid justify-items-start gap-3">
                <h3 className="font-semibold">Primary action</h3>
                <Button>Save changes</Button>
              </div>
              <div className="grid gap-4">
                <h3 className="font-semibold">Success status</h3>
                <Badge tone="success" className="justify-self-start"><CircleCheck aria-hidden="true" size={14} />Saved successfully</Badge>
                <StatusPanel className="border-ui-success bg-ui-success-fill p-4 text-ui-success-ink" title={<span className="flex items-center gap-2 text-base"><CircleCheck aria-hidden="true" size={18} />Changes saved</span>} />
                <label className="grid gap-2">
                  Display name
                  <TextInput defaultValue="Sample" className="border-ui-success" aria-describedby={`valid-name-${theme}`} />
                  <span id={`valid-name-${theme}`} className="flex items-center gap-2 text-ui-success"><CircleCheck aria-hidden="true" size={14} />Valid: this name is available</span>
                </label>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  ),
};

function DangerExample() {
  const [state, setState] = useState<"ready" | "confirming" | "removed">("ready");
  return (
    <main className="mx-auto grid max-w-2xl gap-5 text-sm text-ui-foreground">
      <h1 className="text-xl font-semibold">Danger: outlined, solid only to confirm</h1>
      <p>Red is status-only, outside the ten families. Error text, invalid fields, destructive menu items and badges share its readable ink.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Dialog open={state === "confirming"} onOpenChange={(open) => setState(open ? "confirming" : "ready")} title="Delete this sample?" trigger={<Button variant="danger"><Trash2 aria-hidden="true" />Delete sample</Button>}>
          {(close) => <div className="grid gap-4"><p>This permanently removes the sample in this example.</p><div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={close}>Cancel</Button><Button variant="danger" className="bg-ui-danger text-ui-on-danger hover:bg-ui-danger-hover" onClick={() => setState("removed")}>Confirm deletion</Button></div></div>}
        </Dialog>
        <Button variant="danger" disabled>Delete unavailable</Button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild><Button variant="secondary"><MoreHorizontal aria-hidden="true" />More actions</Button></DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="rounded-md border border-ui-border bg-ui-surface p-1 shadow-sm" sideOffset={4}>
              <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded p-2 text-ui-danger outline-hidden data-highlighted:bg-ui-danger-fill focus-visible:ring-2 focus-visible:ring-ui-danger" onSelect={() => setState("confirming")}><Trash2 aria-hidden="true" size={16} />Delete sample</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <p role="status">{state === "removed" ? "Sample deleted." : "Sample is present."}</p>
      <Badge tone="danger" className="justify-self-start"><CircleX aria-hidden="true" size={14} />Save failed</Badge>
      <label className="grid gap-2">Sample name<TextInput defaultValue="" error="Enter a name before saving." /></label>
      <p className="text-ui-danger"><CircleX aria-hidden="true" className="inline" size={16} /> Error: the sample could not be saved.</p>
    </main>
  );
}

export const Danger: Story = { render: () => <DangerExample /> };
