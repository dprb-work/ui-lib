import { CircleX } from "lucide-react";

import { Button, StatusPanel, type StatusPanelProps } from "../../index";

// The application typecheck includes src/test/fixtures. Keep the useful public
// composition accepted while making the removed slot a consumer compile error.
export const supportedStatusPanelProps = {
  title: "Analysis could not finish",
  description: <p>Fetch the missing revision before retrying.</p>,
  icon: <CircleX aria-hidden="true" />,
  actions: <Button>Retry analysis</Button>,
  tone: "danger",
} satisfies StatusPanelProps;

export const supportedStatusPanel = <StatusPanel {...supportedStatusPanelProps} />;

export const removedStatusPanelEyebrow = (
  // @ts-expect-error Operation context belongs in title/description, not an eyebrow slot.
  <StatusPanel title="Analysis could not finish" eyebrow="Analysis" />
);
