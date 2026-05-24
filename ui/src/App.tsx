import { useEffect, useState } from "react";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { RecipesPage } from "@/features/recipes/pages/RecipesPage";
import {
  flushTranslationCache,
  getSavedLanguage,
  saveLanguage,
  type Language,
} from "@/shared/utils/translator";

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("darkMode");
      return saved ? JSON.parse(saved) === true : false;
    } catch {
      return false;
    }
  });
  const [language, setLanguage] = useState<Language>(() => getSavedLanguage());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleBeforeUnload = () => flushTranslationCache();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      flushTranslationCache();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleLanguageChange = (next: Language) => {
    setLanguage(next);
    saveLanguage(next);
  };

  return (
    <AppLayout
      currentLanguage={language}
      darkMode={darkMode}
      onLanguageChange={handleLanguageChange}
      onToggleDarkMode={() => setDarkMode((v) => !v)}
    >
      <RecipesPage currentLanguage={language} />
    </AppLayout>
  );
}

export default App;
