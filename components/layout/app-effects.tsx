"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { quizStore } from "@/lib/storage/store";
import { useQuizStore } from "@/lib/storage/use-quiz-store";
import type { ThemePreference } from "@/types/quiz";

export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Keeps <html data-theme> in sync with the saved preference (and with the OS
 * setting in System mode) and surfaces storage problems as toasts.
 */
export function AppEffects() {
  const { ready, preferences, notices } = useQuizStore();
  const toast = useToast();
  const theme = preferences.theme;

  useEffect(() => {
    if (!ready) return;
    const apply = () => document.documentElement.setAttribute("data-theme", resolveTheme(theme));
    apply();
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [ready, theme]);

  useEffect(() => {
    if (notices.length === 0) return;
    for (const message of notices) toast({ tone: "warning", title: "Storage notice", description: message });
    quizStore.dismissNotices();
  }, [notices, toast]);

  return null;
}
