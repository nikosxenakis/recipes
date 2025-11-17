import { useEffect, useState } from "react";
import RecipeList from "./RecipeList";
import LanguageSelector from "./components/LanguageSelector";
import { getSavedLanguage, saveLanguage, flushTranslationCache, type Language } from "./utils/translator";
import type { Recipe, RecipeCollection } from "./types/recipe";
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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [language, setLanguage] = useState<Language>(() => getSavedLanguage());

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const response = await fetch("/recipes/recipes.json");
        if (!response.ok) {
          throw new Error("Failed to load recipes");
        }
        const data: RecipeCollection = await response.json();
        console.log(
          `✅ Loaded ${data.totalRecipes} recipes from ${data.categories.length} categories`
        );
        console.log(`📅 Generated at: ${data.generatedAt}`);

        // Don't translate upfront - translation will happen lazily in RecipeList
        setRecipes(data.recipes);
      } catch (err) {
        console.error("Error loading recipes:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Flush translation cache when the component unmounts or page unloads
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

    // Reload page to apply translation
    // The translation will be applied on mount based on saved language
    if (newLang !== language) {
      // Page will reload in LanguageSelector component
    }
  };

  if (loading) {
    return (
      <div className="App">
        <h1>REZEPTBUCH</h1>
        <p>Loading recipes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <h1>REZEPTBUCH</h1>
        <p style={{ color: "var(--primary-gradient-start)" }}>Error: {error}</p>
      </div>
    );
  }

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
      <RecipeList recipes={recipes} currentLanguage={language} />
      <footer className="app-footer">
        <p>
          Version {__APP_VERSION__} • Built on {formatDate(__BUILD_DATE__)}
        </p>
      </footer>
    </div>
  );
};

export default App;
