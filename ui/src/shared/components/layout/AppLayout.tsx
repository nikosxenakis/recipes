import type { ReactNode } from "react";
import { LanguageSelector } from "@/shared/components/layout/LanguageSelector";
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
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <header className="relative mb-8 flex items-center justify-center md:mb-10">
        <h1 className="bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-3xl font-extrabold uppercase tracking-widest text-transparent md:text-4xl">
          Rezeptbuch
        </h1>
        <div className="absolute right-0 flex items-center gap-2 md:gap-3">
          <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
          <ThemeToggle darkMode={darkMode} onToggle={onToggleDarkMode} />
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        <p>
          Version {__APP_VERSION__} • Built on {formatDate(__BUILD_DATE__)}
        </p>
      </footer>
    </div>
  );
}
