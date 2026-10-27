"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: ReactNode;
  /** Accessible label when `label` is not plain text. */
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * A segmented control built from native radio inputs, so arrow-key navigation
 * and screen-reader semantics come for free.
 */
export function SegmentedControl<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  error,
  hint,
  name,
  className,
}: {
  legend: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
  hint?: ReactNode;
  name?: string;
  className?: string;
}) {
  const generatedName = useId();
  const messageId = useId();
  const groupName = name ?? generatedName;

  return (
    <fieldset className={className} aria-describedby={error || hint ? messageId : undefined}>
      <legend className="mb-2 text-sm font-medium text-fg">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={String(option.value)}
              className={cn(
                "relative inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border px-3.5 text-sm font-medium transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                checked
                  ? "border-accent bg-accent text-accent-fg shadow-sm"
                  : "border-border bg-surface text-fg hover:border-border-strong hover:bg-surface-muted",
                option.disabled && "cursor-not-allowed opacity-50",
                error && !checked && "border-danger-border",
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={groupName}
                value={String(option.value)}
                checked={checked}
                disabled={option.disabled}
                aria-label={option.ariaLabel ?? (typeof option.label === "string" ? option.label : undefined)}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={messageId} className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}

export function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium text-fg">
          {label}
        </p>
        {description ? (
          <p id={descriptionId} className="mt-0.5 text-sm text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={description ? descriptionId : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-accent" : "bg-border-strong",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-6 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-fg shadow-sm transition-colors hover:border-border-strong"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
