import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeStatus = "pendiente" | "confirmada" | "cancelada" | "abierta" | "cerrada";

const statusClasses: Record<BadgeStatus, string> = {
  pendiente: "bg-amber-50 text-amber-700",
  confirmada: "bg-primary-50 text-primary-700",
  cancelada: "bg-red-50 text-red-700",
  abierta: "bg-primary-50 text-primary-700",
  cerrada: "bg-neutral-100 text-neutral-600",
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
