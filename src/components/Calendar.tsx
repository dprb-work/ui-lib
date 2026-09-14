import { ChevronLeft, ChevronRight } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef } from "react";
import { cn } from "../cn";

export type CalendarProps = {
  value: Date | null;
  onValueChange: (value: Date) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
  locale?: string | undefined;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  min?: Date | undefined;
  max?: Date | undefined;
  disabled?: (date: Date) => boolean;
  className?: string | undefined;
  ariaLabel?: string | undefined;
};


function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sameDay(left: Date | null, right: Date) {
  return left !== null && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function daysForMonth(month: Date, weekStartsOn: number) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  return Array.from({ length: 42 }, (_, index) => addDays(first, index - offset));
}

function defaultWeekStartsOn(locale: string) {
  try {
    const info = (new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number } }).getWeekInfo?.();
    return info ? (info.firstDay % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6 : 0;
  } catch {
    return 0;
  }
}

export function Calendar({
  value,
  onValueChange,
  month,
  onMonthChange,
  locale = undefined,
  weekStartsOn,
  min,
  max,
  disabled,
  className,
  ariaLabel = "Calendar",
}: CalendarProps) {
  const resolvedLocale = locale ?? (typeof navigator === "undefined" ? "en-US" : navigator.language);
  const resolvedWeekStartsOn = weekStartsOn ?? defaultWeekStartsOn(resolvedLocale);
  const labelId = useId();
  const calendarRef = useRef<HTMLElement>(null);
  const previousMonthButton = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<{ day: Date; direction: -1 | 1 } | null>(null);
  const normalizedYear = month.getFullYear();
  const normalizedMonthIndex = month.getMonth();
  const normalizedMonth = new Date(normalizedYear, normalizedMonthIndex, 1);
  const days = daysForMonth(new Date(normalizedYear, normalizedMonthIndex, 1), resolvedWeekStartsOn);
  const weekdayNames = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(resolvedLocale, { weekday: "short" }).format(addDays(new Date(2023, 0, 1), (resolvedWeekStartsOn + index) % 7)));
  const monthLabel = new Intl.DateTimeFormat(resolvedLocale, { month: "long", year: "numeric" }).format(normalizedMonth);
  const dateLabel = new Intl.DateTimeFormat(resolvedLocale, { dateStyle: "full" });
  const today = startOfDay(new Date());

  function unavailable(day: Date) {
    const normalized = startOfDay(day);
    return (min !== undefined && normalized < startOfDay(min)) || (max !== undefined && normalized > startOfDay(max)) || disabled?.(normalized) === true;
  }

  function resolveFocusableDay(target: Date, direction: -1 | 1 = 1) {
    const targetIndex = days.findIndex((day) => sameDay(day, target));
    const startIndex = targetIndex === -1 ? (direction === 1 ? 0 : days.length - 1) : targetIndex;
    const candidates = direction === 1
      ? days.slice(startIndex)
      : days.slice(0, startIndex + 1).reverse();
    return candidates.find((day) => !unavailable(day)) ?? null;
  }

  function focusResolvedDay(target: Date, direction: -1 | 1) {
    const resolved = resolveFocusableDay(target, direction);
    if (resolved) calendarRef.current?.querySelector<HTMLButtonElement>(`[data-calendar-day="${dateKey(resolved)}"]`)?.focus();
    else previousMonthButton.current?.focus();
  }

  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    const { day, direction } = target;
    pendingFocus.current = null;
    focusResolvedDay(day, direction);
  }, [normalizedYear, normalizedMonthIndex]);

  function moveFocus(day: Date, direction: -1 | 1) {
    const target = startOfDay(day);
    const pending = { day: target, direction };
    pendingFocus.current = pending;
    if (target.getFullYear() !== normalizedMonth.getFullYear() || target.getMonth() !== normalizedMonth.getMonth()) {
      onMonthChange(new Date(target.getFullYear(), target.getMonth(), 1));
    } else {
      requestAnimationFrame(() => {
        if (pendingFocus.current !== pending) return;
        pendingFocus.current = null;
        focusResolvedDay(target, direction);
      });
    }
  }

  function onDayKeyDown(event: KeyboardEvent<HTMLButtonElement>, day: Date) {
    let next: Date | null = null;
    if (event.key === "ArrowLeft") next = addDays(day, -1);
    else if (event.key === "ArrowRight") next = addDays(day, 1);
    else if (event.key === "ArrowUp") next = addDays(day, -7);
    else if (event.key === "ArrowDown") next = addDays(day, 7);
    else if (event.key === "Home") next = addDays(day, -((day.getDay() - resolvedWeekStartsOn + 7) % 7));
    else if (event.key === "End") next = addDays(day, 6 - ((day.getDay() - resolvedWeekStartsOn + 7) % 7));
    else if (event.key === "PageUp") next = addMonths(day, event.shiftKey ? -12 : -1);
    else if (event.key === "PageDown") next = addMonths(day, event.shiftKey ? 12 : 1);
    if (next) {
      event.preventDefault();
      moveFocus(next, next < day ? -1 : 1);
    }
  }

  const preferredFocusDate = value && value.getFullYear() === normalizedMonth.getFullYear() && value.getMonth() === normalizedMonth.getMonth() ? value : days.find((day) => sameDay(day, today) && day.getMonth() === normalizedMonth.getMonth()) ?? days.find((day) => day.getMonth() === normalizedMonth.getMonth()) ?? normalizedMonth;
  const focusDate = resolveFocusableDay(preferredFocusDate);

  return (
    <section ref={calendarRef} aria-label={ariaLabel} className={cn("w-fit rounded-lg border border-ui-border bg-ui-surface p-3 text-ui-surface-foreground", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button ref={previousMonthButton} type="button" aria-label="Previous month" onClick={() => onMonthChange(addMonths(normalizedMonth, -1))} className="grid size-8 place-items-center rounded-md text-ui-muted-foreground hover:bg-ui-muted focus-visible:outline-2 focus-visible:outline-ui-accent"><ChevronLeft aria-hidden="true" size={16} /></button>
        <h2 id={labelId} className="text-sm font-medium">{monthLabel}</h2>
        <button type="button" aria-label="Next month" onClick={() => onMonthChange(addMonths(normalizedMonth, 1))} className="grid size-8 place-items-center rounded-md text-ui-muted-foreground hover:bg-ui-muted focus-visible:outline-2 focus-visible:outline-ui-accent"><ChevronRight aria-hidden="true" size={16} /></button>
      </div>
      <div role="grid" aria-labelledby={labelId} className="grid grid-cols-7 gap-1">
        {weekdayNames.map((name) => <div key={name} role="columnheader" className="grid size-8 place-items-center text-xs text-ui-muted-foreground">{name}</div>)}
        {days.map((day) => {
          const currentMonth = day.getMonth() === normalizedMonth.getMonth();
          const isUnavailable = unavailable(day);
          const selected = sameDay(value, day);
          const focusable = sameDay(focusDate, day);
          return <button
            key={dateKey(day)}
            type="button"
            role="gridcell"
            data-calendar-day={dateKey(day)}
            tabIndex={focusable ? 0 : -1}
            disabled={isUnavailable}
            aria-label={dateLabel.format(day)}
            aria-selected={selected}
            onClick={() => onValueChange(startOfDay(day))}
            onKeyDown={(event) => onDayKeyDown(event, day)}
            className={cn("grid size-8 place-items-center rounded-md text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-ui-accent disabled:cursor-not-allowed disabled:opacity-40", !currentMonth && "text-ui-muted-foreground", selected ? "bg-ui-accent text-ui-on-accent" : "hover:bg-ui-muted")}
          >{day.getDate()}</button>;
        })}
      </div>
    </section>
  );
}
