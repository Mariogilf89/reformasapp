import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeStatus = "pendiente" | "confirmada" | "cancelada" | "abierta" | "cerrada";

const statusClasses: Record<BadgeStatus, string> = {
  pendiente: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmada: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
  cancelada: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  abierta: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
  cerrada: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
}

export function Badge({ status, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium",
        statusClasses[status],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
