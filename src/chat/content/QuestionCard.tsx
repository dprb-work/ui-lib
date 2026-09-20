import { useId, useState } from "react";
import { Button } from "../../components/Button";
import { TextInput } from "../../components/Inputs";
import { MessageCircleQuestion } from "lucide-react";
import { ChatBlock } from "./ChatBlock";
export type QuestionOption = {
  id: string;
  label: string;
  description?: string;
};
export type QuestionAnswer = { choices: string[]; text: string };
export type QuestionCardProps = {
  question: string;
  options?: QuestionOption[];
  multiple?: boolean;
  allowText?: boolean;
  state?: "pending" | "submitting" | "answered" | "cancelled" | "expired";
  answer?: QuestionAnswer | undefined;
  error?: string | undefined;
  onSubmit?: (answer: QuestionAnswer) => void;
};
export function QuestionCard(props: QuestionCardProps) {
  return (
    <QuestionForm
      key={JSON.stringify([
        props.question,
        props.options,
        props.allowText ?? true,
        props.multiple ?? false,
      ])}
      {...props}
    />
  );
}
function QuestionForm({
  question,
  options = [],
  multiple = false,
  allowText = true,
  state = "pending",
  answer,
  error,
  onSubmit,
}: QuestionCardProps) {
  const id = useId();
  const [choices, setChoices] = useState<string[]>([]);
  const [text, setText] = useState("");
  const locked = state !== "pending" || !onSubmit;
  const shownChoices = answer?.choices ?? choices;
  return (
    <ChatBlock
      title={question}
      icon={
        <MessageCircleQuestion
          className="shrink-0 text-ui-accent"
          size={18}
          aria-hidden="true"
        />
      }
      className="min-w-0 text-ui-foreground"
    >
      <form
        className="space-y-3 pt-6 px-4 pb-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!locked && (choices.length > 0 || text.trim()))
            onSubmit?.({ choices, text: text.trim() });
        }}
      >
        <fieldset disabled={locked} className="space-y-2">
          <legend className="sr-only">
            {multiple ? "Choose one or more answers" : "Choose an answer"}
          </legend>
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-start gap-2 py-1 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ui-accent"
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={id}
                value={option.id}
                checked={shownChoices.includes(option.id)}
                className="mt-0.5 accent-ui-accent"
                onChange={(event) =>
                  setChoices((previous) =>
                    multiple
                      ? event.target.checked
                        ? [...previous, option.id]
                        : previous.filter((choice) => choice !== option.id)
                      : [option.id],
                  )
                }
              />
              <span>
                <span>{option.label}</span>
                {option.description && (
                  <span className="ml-2 text-xs text-ui-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          ))}
        </fieldset>
        {allowText && (
          <label className="block text-sm">
            <span className="sr-only">
              {options.length ? "Different answer" : "Your answer"}
            </span>
            <TextInput
              placeholder={options.length ? "Different answer" : "Your answer"}
              value={answer?.text ?? text}
              disabled={locked}
              onChange={(event) => setText(event.target.value)}
              className="w-full"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-ui-danger">
            Answer not sent: {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={locked || (!choices.length && !text.trim())}
          >
            {state === "submitting" ? "Submitting…" : "Submit"}
          </Button>
          <p aria-live="polite" className="text-xs text-ui-muted-foreground">
            {state === "answered"
              ? "Answer submitted"
              : state === "cancelled"
                ? "This question was cancelled"
                : state === "expired"
                  ? "This question has expired"
                  : state === "submitting"
                    ? "Submitting answer…"
                    : !onSubmit
                      ? "Read-only question"
                      : ""}
          </p>
        </div>
      </form>
    </ChatBlock>
  );
}
