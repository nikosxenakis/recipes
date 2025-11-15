import { useEffect, useState } from 'react';
import RecipeList from './RecipeList';
import type { Recipe, RecipeCollection } from './types/recipe';
import './App.css';

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const App = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const response = await fetch('/recipes/recipes.json');
        if (!response.ok) {
          throw new Error('Failed to load recipes');
        }
        const data: RecipeCollection = await response.json();
        console.log(`✅ Loaded ${data.totalRecipes} recipes from ${data.categories.length} categories`);
        console.log(`📅 Generated at: ${data.generatedAt}`);
        setRecipes(data.recipes);
      } catch (err) {
        console.error('Error loading recipes:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

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
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>REZEPTBUCH</h1>
      <RecipeList recipes={recipes} />
      <footer className="app-footer">
        <p>Version {__APP_VERSION__} • Built on {formatDate(__BUILD_DATE__)}</p>
      </footer>
    </div>
  );
};

export default App;