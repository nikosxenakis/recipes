import React, { useEffect, useState } from 'react';
import RecipeList from './components/RecipeList';
import './App.css';

const App = () => {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetch('./Rezeptbuch.md')
      .then(response => response.text())
      .then(text => parseMarkdown(text));
  }, []);

  const parseMarkdown = (text) => {
    const recipeSections = text.split('## ').slice(1);
    const parsedRecipes = recipeSections.map(section => {
      const [title, ...content] = section.split('\n');
      const ingredientsIndex = content.findIndex(line => line.startsWith('### Zutaten'));
      const instructionsIndex = content.findIndex(line => line.startsWith('### Zubereitung'));

      const ingredients = content.slice(ingredientsIndex + 1, instructionsIndex).join('\n');
      const instructions = content.slice(instructionsIndex + 1).join('\n');

      return { title, ingredients, instructions };
    });

    setRecipes(parsedRecipes);
  };

  return (
    <div className="App">
      <h1>Rezeptbuch</h1>
      <RecipeList recipes={recipes} />
    </div>
  );
};

export default App;