"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SeparatorProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & SeparatorProps
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => {
    const ariaProps = decorative
      ? { "aria-hidden": true, role: "none" }
      : { role: "separator" };

    return (
      <div
        ref={ref}
        className={cn(
          "shrink-0 bg-neutral-700",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        {...ariaProps}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";

export { Separator };
