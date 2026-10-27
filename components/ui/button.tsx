import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg shadow-sm hover:bg-accent-hover",
  secondary: "border border-border bg-surface text-fg shadow-sm hover:border-border-strong hover:bg-surface-muted",
  soft: "bg-accent-soft text-accent-text hover:bg-accent-soft-strong",
  ghost: "text-muted hover:bg-surface-muted hover:text-fg",
  danger: "bg-danger text-white shadow-sm hover:brightness-110 dark:text-[#1a0b0b]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 gap-1.5 px-3 text-sm",
  md: "h-11 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-5 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: { variant?: Variant; size?: Size; fullWidth?: boolean; className?: string } = {}): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-xl font-medium whitespace-nowrap transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );
}

type StyleProps = { variant?: Variant; size?: Size; fullWidth?: boolean };

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return <button type={type} className={buttonStyles({ variant, size, fullWidth, className })} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonStyles({ variant, size, fullWidth, className })} {...props} />;
}
