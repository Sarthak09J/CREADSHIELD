import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-xl p-6",
        glow && "shadow-glow border-accent/30",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-lg font-semibold text-text-primary", className)}>
      {children}
    </h2>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm text-text-secondary mt-1", className)}>
      {children}
    </p>
  );
}
