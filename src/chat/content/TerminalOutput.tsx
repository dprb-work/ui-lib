import stripAnsi from "strip-ansi";
import { ToolOperation } from "./ToolOperation";
export type TerminalStatus = "running" | "success" | "error" | "cancelled";
export type TerminalOutputProps = {
  command: string;
  cwd?: string;
  status: TerminalStatus;
  output: string;
};
function plainTerminalText(value: string) {
  let text = "";
  for (const character of stripAnsi(value).replace(/[^\n]*\r(?!\n)/g, "")) {
    const code = character.charCodeAt(0);
    if (code === 9 || code === 10 || (code >= 32 && code !== 127))
      text += character;
  }
  return text;
}
export function TerminalOutput({
  command,
  cwd,
  status,
  output,
}: TerminalOutputProps) {
  return (
    <ToolOperation
      operation={{
        name: "Bash",
        input: command,
        language: "bash",
        ...(cwd ? { path: cwd } : {}),
        state:
          status === "success"
            ? "completed"
            : status === "cancelled"
              ? "stopped"
              : status,
        output: plainTerminalText(output) || "No output yet.",
      }}
    />
  );
}
