import { useEffect, useState } from "react";
import RecipeList from "./RecipeList";
import LanguageSelector from "./components/LanguageSelector";
import { getSavedLanguage, saveLanguage, flushTranslationCache, type Language } from "./utils/translator";
import "./App.css";

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [language, setLanguage] = useState<Language>(() => getSavedLanguage());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      flushTranslationCache();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      flushTranslationCache();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    saveLanguage(newLang);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>REZEPTBUCH</h1>
        <div className="header-controls">
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
          />
          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>
      <RecipeList currentLanguage={language} />
      <footer className="app-footer">
        <p>
          Version {__APP_VERSION__} • Built on {formatDate(__BUILD_DATE__)}
        </p>
      </footer>
    </div>
  );
};

export default App;
