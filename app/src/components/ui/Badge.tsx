import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "private" | "accent";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-surface-3 text-text-secondary border-border",
    success: "bg-success/10 text-success border-success/30",
    danger: "bg-danger/10 text-danger border-danger/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    private: "bg-accent-subtle text-accent border-accent/30",
    accent: "bg-accent/10 text-accent border-accent/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
