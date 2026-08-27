import { Popover as RadixPopover } from "radix-ui";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";

import { cn } from "../cn";

export type PopoverProps = ComponentPropsWithoutRef<typeof RadixPopover.Root>;
export type PopoverTriggerProps = ComponentPropsWithoutRef<typeof RadixPopover.Trigger>;
export type PopoverAnchorProps = ComponentPropsWithoutRef<typeof RadixPopover.Anchor>;
export type PopoverCloseProps = ComponentPropsWithoutRef<typeof RadixPopover.Close>;
export type PopoverArrowProps = ComponentPropsWithoutRef<typeof RadixPopover.Arrow>;

type AccessibleName =
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-label"?: never; "aria-labelledby": string };

type RadixPopoverContentProps = ComponentPropsWithoutRef<typeof RadixPopover.Content>;

export type PopoverContentProps = Omit<
  RadixPopoverContentProps,
  "aria-label" | "aria-labelledby"
> &
  AccessibleName & {
    portalContainer?: ComponentPropsWithoutRef<typeof RadixPopover.Portal>["container"];
  };

export function Popover(props: PopoverProps) {
  return <RadixPopover.Root {...props} />;
}

export const PopoverTrigger = forwardRef<
  ComponentRef<typeof RadixPopover.Trigger>,
  PopoverTriggerProps
>(function PopoverTrigger(props, ref) {
  return <RadixPopover.Trigger ref={ref} {...props} />;
});

export const PopoverAnchor = forwardRef<
  ComponentRef<typeof RadixPopover.Anchor>,
  PopoverAnchorProps
>(function PopoverAnchor(props, ref) {
  return <RadixPopover.Anchor ref={ref} {...props} />;
});

export const PopoverContent = forwardRef<
  ComponentRef<typeof RadixPopover.Content>,
  PopoverContentProps
>(function PopoverContent(
  {
    children,
    className,
    collisionPadding = 10,
    portalContainer,
    sideOffset = 8,
    ...contentProps
  },
  ref,
) {
  return (
    <RadixPopover.Portal container={portalContainer}>
      <RadixPopover.Content
        ref={ref}
        className={cn(
          "z-50 max-w-80 rounded-lg border border-ui-border bg-ui-surface p-3 text-sm text-ui-surface-foreground shadow-xl outline-hidden focus-visible:ring-2 focus-visible:ring-ui-accent",
          className,
        )}
        collisionPadding={collisionPadding}
        sideOffset={sideOffset}
        {...contentProps}
      >
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
});

export const PopoverArrow = forwardRef<
  ComponentRef<typeof RadixPopover.Arrow>,
  PopoverArrowProps
>(function PopoverArrow({ className, height = 6, width = 12, ...arrowProps }, ref) {
  return (
    <RadixPopover.Arrow
      ref={ref}
      className={cn("fill-ui-surface", className)}
      height={height}
      width={width}
      {...arrowProps}
    />
  );
});

export const PopoverClose = forwardRef<
  ComponentRef<typeof RadixPopover.Close>,
  PopoverCloseProps
>(function PopoverClose(props, ref) {
  return <RadixPopover.Close ref={ref} {...props} />;
});
