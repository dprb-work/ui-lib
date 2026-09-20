import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { ComposerFrame } from "./ComposerFrame";
import { ComposerInput } from "./ComposerInput";
import { ComposerSubmitButton } from "./ComposerSubmitButton";
import { ModelControls } from "./ModelControls";

const meta = {
  title: "Chat/Composer",
  component: ComposerExample,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ComposerExample>;

export default meta;
type Story = StoryObj<typeof meta>;

function ComposerExample() {
  const [value, setValue] = useState("");
  const [model, setModel] = useState("terra");
  const [reasoning, setReasoning] = useState("medium");
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <div className="w-full max-w-2xl">
      <ComposerFrame
        running={false}
        onSubmit={() => {
          setSubmitted(value);
          setValue("");
        }}
        context={
          <p className="mb-2 text-sm text-ui-muted-foreground">New chat</p>
        }
        controls={
          <ModelControls
            value={model}
            options={[
              { value: "luna", label: "Luna" },
              { value: "terra", label: "Terra" },
              { value: "astra", label: "Astra", disabled: true },
            ]}
            onValueChange={setModel}
            reasoning={{
              value: reasoning,
              values: ["low", "medium", "high"],
              onValueChange: setReasoning,
            }}
          />
        }
        actions={
          <ComposerSubmitButton
            running={false}
            hasText={value.length > 0}
            canSend={value.trim().length > 0}
            canStop={false}
            onStop={() => {}}
          />
        }
      >
        <ComposerInput
          value={value}
          onValueChange={setValue}
          onSubmit={() => {
            setSubmitted(value);
            setValue("");
          }}
          commands={[
            { name: "review", description: "Review the current change" },
          ]}
          skills={[
            {
              name: "research",
              description: "Research a topic",
              invocation: "$research",
            },
          ]}
        />
      </ComposerFrame>
      {submitted && (
        <p className="mt-2 text-sm text-ui-muted-foreground">
          Sent: {submitted}
        </p>
      )}
    </div>
  );
}

export const Light: Story = { render: () => <ComposerExample /> };

export const Dark: Story = {
  ...Light,
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
};
