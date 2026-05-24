import type { ReactNode } from "react";
import { LanguageSelector } from "@/shared/components/layout/LanguageSelector";
import { Logo } from "@/shared/components/layout/Logo";
import { ThemeToggle } from "@/shared/components/layout/ThemeToggle";
import type { Language } from "@/shared/utils/translator";

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
};

interface AppLayoutProps {
  currentLanguage: Language;
  darkMode: boolean;
  onLanguageChange: (lang: Language) => void;
  onToggleDarkMode: () => void;
  children: ReactNode;
}

export function AppLayout({
  currentLanguage,
  darkMode,
  onLanguageChange,
  onToggleDarkMode,
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-glass backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Rezeptbuch
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
            <ThemeToggle darkMode={darkMode} onToggle={onToggleDarkMode} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">{children}</main>
      <footer className="mx-auto max-w-5xl border-t border-border px-4 py-6 text-center text-sm text-muted-foreground md:px-6">
        <p>
          Version {__APP_VERSION__} • Built on {formatDate(__BUILD_DATE__)}
        </p>
      </footer>
    </div>
  );
}
