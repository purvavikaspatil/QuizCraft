import { GraduationCap } from "lucide-react";
import Link from "next/link";

export function Logo({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 rounded-lg" aria-label="QuizCraft home">
      <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-fg shadow-sm" aria-hidden>
        <GraduationCap className="size-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-fg">QuizCraft</span>
    </Link>
  );
}
