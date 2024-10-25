import React, { useEffect, useState } from 'react';
import RecipeList from './components/RecipeList';
import MarkdownIt from 'markdown-it';
import './App.css';

const App = () => {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetch('./sample.md')
      .then(response => response.text())
      .then(text => parseMarkdown(text));
  }, []);

  const parseMarkdown = (text) => {
    const md = new MarkdownIt();
    const tokens = md.parse(text, {});

    const parsedRecipes = [];
    let currentRecipe = null;

    tokens.forEach(token => {
      console.log(token);
      if (token.type === 'heading_open' && token.tag === 'h2') {
        currentRecipe = { title: '', ingredients: '', instructions: '', comments: '' };
      }
      else if (token.type === 'heading_close' && token.tag === 'h2') {
        if (currentRecipe) {
          parsedRecipes.push(currentRecipe);
        }
      }
      else if (token.type === 'inline' && token.content) {
        if (token.content.startsWith('### Zutaten')) {
          currentRecipe.ingredients = token.content.split('\n').slice(1).map(line => line.trim()).filter(line => line).join('\n');
        } else if (token.content.startsWith('### Zubereitung')) {
          currentRecipe.instructions = token.content.split('\n').slice(1).map(line => line.trim()).filter(line => line).join('\n');
        } else if (token.content.startsWith('### Kommentar')) {
          currentRecipe.comments = token.content.split('\n').slice(1).map(line => line.trim()).filter(line => line).join('\n');
        } 
        // else if (!currentRecipe.title) {
        //   currentRecipe.title = token.content;
        // }
      }
    });

    if (currentRecipe) {
      parsedRecipes.push(currentRecipe);
    }

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