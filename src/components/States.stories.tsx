import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pin, Search } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button } from "./Button";
import { Checkbox, Switch } from "./BinaryControls";
import { Calendar } from "./Calendar";
import { ColorSelector } from "./ColorSelector";
import { IconButton } from "./IconButton";
import { CopyButton, Tabs } from "./Interactions";
import { NativeSelect } from "./NativeSelect";
import { NumberInput, SelectInput, TextareaInput, TextInput } from "./Inputs";
import { PortalProvider } from "./portal-context";
import { SegmentedControl } from "./SegmentedControl";

const meta = {
  title: "Foundations/States",
  globals: { theme: "light" },
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

type Theme = "light" | "dark";
const themes = ["light", "dark"] as const;
const choices = [{ value: "one", label: "One" }, { value: "two", label: "Two" }];
const views = [{ value: "graph", label: "Graph" }, { value: "data", label: "Data" }];

function ThemeScope({ theme, label, children }: { theme: Theme; label: string; children: ReactNode }) {
  // Portaled overlays render inside the section so they take its theme, as in an application's nested theme region.
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  return (
    <section ref={setPortal} data-theme={theme} aria-label={label} className="grid min-w-0 content-start gap-6 rounded-lg border border-ui-border bg-ui-background p-4 text-sm text-ui-foreground">
      {portal && <PortalProvider container={portal}>{children}</PortalProvider>}
    </section>
  );
}

function StateExample({ theme }: { theme: Theme }) {
  const [pinned, setPinned] = useState(true);
  const [selected, setSelected] = useState(true);
  const [tab, setTab] = useState("graph");
  const [segment, setSegment] = useState("one");
  const [month, setMonth] = useState(new Date(2026, 0, 1));
  const [day, setDay] = useState<Date | null>(new Date(2026, 0, 16));
  const [colors, setColors] = useState(["#4c88c5", "#aa7a35"]);
  const [message, setMessage] = useState("Use Tab to inspect keyboard focus. Hold Space or the pointer to inspect press feedback.");
  return (
    <ThemeScope theme={theme} label={`${theme} shared control states`}>
      <h2 className="text-lg font-semibold">{theme === "light" ? "Light" : "Dark"}</h2>
      <div className="grid gap-3">
        <h3 className="font-semibold">Actions and availability</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setMessage("Changes saved.")}>Save changes</Button>
          <Button variant="secondary" onClick={() => setMessage("Secondary action activated.")}>Secondary</Button>
          <Button variant="danger" onClick={() => setMessage("Deletion requires confirmation.")}>Delete</Button>
          <Button variant="secondary" disabled>Unavailable</Button>
          <Button variant="secondary" aria-busy="true" onClick={() => setMessage("Work remains in progress; busy alone does not disable the action.")}>Saving</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <IconButton label="Pin view" aria-pressed={pinned} onClick={() => setPinned(!pinned)}><Pin aria-hidden="true" /></IconButton>
          <IconButton label="Search" onClick={() => setMessage("Search activated.")}><Search aria-hidden="true" /></IconButton>
          <IconButton label="Search in progress" aria-busy="true"><Search aria-hidden="true" /></IconButton>
          <CopyButton text="Shared state rules" label="Copy state rules" />
        </div>
        <p role="status" className="text-ui-muted-foreground">{message}</p>
      </div>
      <div className="grid gap-3">
        <h3 className="font-semibold">Fields and invalid drafts</h3>
        <label className="grid gap-1">Name<TextInput defaultValue="Sample" /></label>
        <label className="grid gap-1">Count<NumberInput defaultValue={2} /></label>
        <label className="grid gap-1">Notes<TextareaInput defaultValue="A draft stays editable during focus." rows={2} /></label>
        <label className="grid gap-1">Native choice<NativeSelect defaultValue="one">{choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</NativeSelect></label>
        <div className="grid gap-1"><span>Shared choice</span><SelectInput label="Shared choice" defaultValue="one" options={choices} /></div>
        <label className="grid gap-1">Required name<TextInput error="Enter a name before saving." /></label>
        <label className="grid gap-1">Order number<TextInput defaultValue="12-AB" aria-invalid /></label>
        <label className="grid gap-1">Unavailable field<TextInput defaultValue="Unavailable" disabled /></label>
      </div>
      <div className="grid gap-3">
        <h3 className="font-semibold">Persistent choice, separate from focus</h3>
        <Button variant="secondary" aria-pressed={selected} onClick={() => setSelected(!selected)} className="justify-self-start">Keep this choice</Button>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2"><Checkbox label={`${theme} include notes`} defaultChecked />Include notes</label>
          <label className="flex items-center gap-2"><Switch label={`${theme} show details`} defaultChecked />Show details</label>
        </div>
        <SegmentedControl ariaLabel={`${theme} layout`} value={segment} onValueChange={setSegment} options={choices} />
        <Tabs ariaLabel={`${theme} panels`} tabs={views} value={tab} onValueChange={setTab}>
          {(view) => <p className="p-3">{view.label} view. Keyboard focus stays distinct from the selected tab.</p>}
        </Tabs>
      </div>
      <div className="grid justify-items-start gap-3">
        <h3 className="font-semibold">Calendar and user-owned color</h3>
        <Calendar ariaLabel={`${theme} date choice`} month={month} onMonthChange={setMonth} value={day} onValueChange={setDay} />
        <ColorSelector label={`${theme} data color`} colors={colors} onValueChange={(index, value) => setColors(colors.map((color, slot) => slot === index ? value : color))} />
      </div>
    </ThemeScope>
  );
}

export const SharedControls: Story = {
  render: () => (
    <main className="mx-auto grid max-w-6xl gap-6 text-ui-foreground">
      <header className="grid gap-2 text-sm">
        <h1 className="text-xl font-semibold">Color, fill and keyboard shape</h1>
        <p>Color carries selected/on or status meaning. Hover adds a faint fill; held press adds a stronger fill. An outlined delete action fills with red under the pointer. Focus uses an inside edge, field underline or icon plate, never a floating offset ring.</p>
        <p>Disabled fades. Busy shows one spinner without becoming disabled or faded. An invalid draft colors only its underline; the application decides whether an explanation appears below it.</p>
        <p>Selected tabs and segments take the accent fill with ordinary text. A pressed toggle button gets an accent edge on a tinted fill, never the primary action's solid fill.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">{themes.map((theme) => <StateExample key={theme} theme={theme} />)}</div>
    </main>
  ),
};
