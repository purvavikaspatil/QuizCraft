"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { quizStore } from "@/lib/storage/store";
import { useQuizStore } from "@/lib/storage/use-quiz-store";
import type { ThemePreference } from "@/types/quiz";

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Compact three-way theme switcher used in the navigation. */
export function ThemeToggle({ className }: { className?: string }) {
  const { ready, preferences } = useQuizStore();
  const toast = useToast();

  return (
    <div role="group" aria-label="Theme" className={cn("flex rounded-xl border border-border bg-surface-muted p-1", className)}>
      {THEMES.map(({ value, label, icon: Icon }) => {
        const active = ready && preferences.theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            disabled={!ready}
            onClick={() => {
              if (!quizStore.updatePreferences({ theme: value }).persisted) {
                toast({
                  tone: "warning",
                  title: "Theme applied for this visit only",
                  description: "This browser isn't allowing QuizCraft to save preferences.",
                });
              }
            }}
            className={cn(
              "grid h-8 flex-1 place-items-center rounded-lg transition-colors",
              active ? "bg-surface text-accent-text shadow-sm" : "text-muted hover:text-fg",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
