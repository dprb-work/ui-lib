import {
  type KeyboardEvent,
  type Ref,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { TextareaInput } from "../../components/Inputs";

export type ComposerCommand = {
  name: string;
  description?: string | undefined;
  input?:
    | string
    | { hint?: string | undefined; attachments?: boolean | undefined }
    | undefined;
};

export type ComposerSkill = {
  name: string;
  description?: string | undefined;
  invocation: string | { modelInvocable: boolean; userInvocable: boolean };
};

export type ComposerInputProps = {
  id?: string;
  inputRef?: Ref<HTMLTextAreaElement>;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  commands: readonly ComposerCommand[];
  skills: readonly ComposerSkill[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  ariaDescribedBy?: string;
  submitOnEnter?: boolean;
};

type Completion = {
  value: string;
  description?: string;
  start: number;
  end: number;
  kind: "command" | "skill";
};

function completionsFor(
  value: string,
  cursor: number,
  commands: readonly ComposerCommand[],
  skills: readonly ComposerSkill[],
): Completion[] {
  const beforeCursor = value.slice(0, cursor);
  const command = /^\/(\S*)$/.exec(beforeCursor);
  if (command) {
    const query = command[1];
    if (query === undefined) return [];
    return commands
      .filter((item) =>
        item.name.toLocaleLowerCase().startsWith(query.toLocaleLowerCase()),
      )
      .map((item) => ({
        value: typeof item.input === "string" ? item.input : `/${item.name}`,
        description: item.description,
        start: 0,
        end: cursor,
        kind: "command" as const,
      }));
  }

  const skill = /\$([\w-]*)$/.exec(beforeCursor);
  if (!skill) return [];
  const query = skill[1];
  const matched = skill[0];
  if (query === undefined || matched === undefined) return [];
  const start = cursor - matched.length;
  return skills
    .filter(
      (item) =>
        item.name.toLocaleLowerCase().startsWith(query.toLocaleLowerCase()) &&
        (typeof item.invocation === "string" || item.invocation.userInvocable),
    )
    .map((item) => ({
      value:
        typeof item.invocation === "string" ? item.invocation : `$${item.name}`,
      description: item.description,
      start,
      end: cursor,
      kind: "skill" as const,
    }));
}

export function ComposerInput({
  id,
  inputRef,
  value,
  onValueChange,
  onSubmit,
  commands,
  skills,
  disabled = false,
  placeholder = "Message…",
  className,
  ariaDescribedBy,
  submitOnEnter = true,
}: ComposerInputProps) {
  const listboxId = useId();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState(value.length);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const completions = useMemo(
    () => completionsFor(value, cursor, commands, skills),
    [commands, cursor, skills, value],
  );
  useImperativeHandle(inputRef, () => textarea.current!, []);
  const visible = open && completions.length > 0;

  function updateValue(next: string, nextCursor: number) {
    onValueChange(next);
    setCursor(nextCursor);
    setActive(0);
    setOpen(true);
  }

  function select(completion: Completion) {
    const next = `${value.slice(0, completion.start)}${completion.value}${value.slice(completion.end)}`;
    const nextCursor = completion.start + completion.value.length;
    onValueChange(next);
    setCursor(nextCursor);
    setOpen(false);
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;
    if (visible && event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % completions.length);
      return;
    }
    if (visible && event.key === "ArrowUp") {
      event.preventDefault();
      setActive(
        (current) => (current - 1 + completions.length) % completions.length,
      );
      return;
    }
    if (visible && event.key === "Tab") {
      event.preventDefault();
      const completion = completions[active];
      if (completion) select(completion);
      return;
    }
    if (event.key === "Escape" && visible) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (
      submitOnEnter &&
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
      setOpen(false);
      onSubmit(value);
    }
  }

  return (
    <div className="relative">
      <TextareaInput
        ref={textarea}
        id={id}
        rows={1}
        value={value}
        onChange={(event) =>
          updateValue(
            event.target.value,
            event.target.selectionStart ?? event.target.value.length,
          )
        }
        onSelect={(event) =>
          setCursor(event.currentTarget.selectionStart ?? value.length)
        }
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onKeyDown={keyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        aria-describedby={ariaDescribedBy}
        aria-autocomplete="list"
        aria-controls={visible ? listboxId : undefined}
      />
      <p className="sr-only" aria-live="polite">
        {visible
          ? `${completions[active]?.kind === "command" ? "Command" : "Skill"} completion ${active + 1} of ${completions.length}: ${completions[active]?.value ?? ""}${completions[active]?.description ? `. ${completions[active].description}` : ""}`
          : ""}
      </p>
      {visible && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Composer completions"
          className="absolute bottom-full z-30 mb-2 max-h-60 w-full overflow-y-auto rounded-md border border-ui-border bg-ui-surface p-1 shadow-lg"
        >
          {completions.map((completion, index) => (
            <button
              key={`${completion.kind}:${completion.value}`}
              type="button"
              role="option"
              aria-selected={index === active}
              className={`block w-full rounded px-2 py-1.5 text-left text-sm ${index === active ? "bg-ui-muted text-ui-foreground" : "text-ui-muted-foreground hover:bg-ui-muted"}`}
              onMouseDown={(event) => {
                event.preventDefault();
                select(completion);
              }}
            >
              <span className="font-mono text-ui-foreground">
                {completion.value}
              </span>
              {completion.description && (
                <span className="ml-2 text-xs">{completion.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
