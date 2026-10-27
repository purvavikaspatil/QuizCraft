import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <div className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent-text [&_svg]:size-6" aria-hidden>
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/** Shown while browser storage is being read; this is a real (if brief) load. */
export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-muted">
      <LoaderCircle className="size-6 animate-spin text-accent-text" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-warning-soft text-warning [&_svg]:size-7" aria-hidden>
        {icon}
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-fg">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>
    </div>
  );
}
