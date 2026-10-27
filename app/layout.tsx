import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppEffects } from "@/components/layout/app-effects";
import { ToastProvider } from "@/components/ui/toast";
import { STORAGE_KEYS } from "@/lib/storage/repository";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "QuizCraft", template: "%s · QuizCraft" },
  description: "Practice quizzes, track your progress and learn from your mistakes.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0f1d" },
  ],
};

// Applies the saved theme before first paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t;var raw=localStorage.getItem(${JSON.stringify(
  STORAGE_KEYS.preferences,
)});if(raw){var p=JSON.parse(raw);t=p&&p.preferences&&p.preferences.theme}if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-canvas text-fg">
        <ToastProvider>
          <AppEffects />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
