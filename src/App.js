import React, { useEffect, useState } from 'react';
import RecipeList from './RecipeList';
import MarkdownIt from 'markdown-it';
import './assets/styles/App.css';
import cookbook from './assets/Rezeptbuch.md';

const App = () => {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    parseMarkdown(cookbook);
  }, []);

  const parseMarkdown = (text) => {
    const md = new MarkdownIt();
    const tokens = md.parse(text, {});

    const parsedRecipes = [];
    let currentRecipe = null;
    let isH1 = false;
    let isH2 = false;
    let isH3 = false;
    let currentSection = '';
    let firstElement = true;
    let category = '';

    tokens.forEach(token => {
      if (token.type === 'heading_open' && token.tag === 'h1') {
        isH1 = true;
      }
      else if (token.type === 'heading_close' && token.tag === 'h1') {
        isH1 = false;
      }
      else if (token.type === 'heading_open' && token.tag === 'h2') {
        if (currentRecipe) {
          parsedRecipes.push(currentRecipe);
        }
        currentRecipe = { title: '', category: category, ingredients: '', instructions: '', comments: '' };
        isH2 = true;
        currentSection = '';
      }
      else if (token.type === 'heading_close' && token.tag === 'h2') {
        isH2 = false;
      }
      else if (token.type === 'heading_open' && token.tag === 'h3') {
        isH3 = true;
        currentSection = '';
      }
      else if (token.type === 'heading_close' && token.tag === 'h3') {
        isH3 = false;
      }
      else if (token.type === 'inline' && token.content) {
        if (isH1) {
          category = token.content;
        }
        if (isH2) {
          currentRecipe.title = token.content;
        }
        else if(isH3) {
          if (token.content.startsWith('Zutaten')) {
            currentSection = 'ingredients';
          }
          else if (token.content.startsWith('Zubereitung') ){
            currentSection = 'instructions';
          }
          else if (token.content.startsWith('Kommentar')) {
            currentSection = 'comments';
          }
          firstElement = true;
        }

        if(firstElement) {
          firstElement = false;
        }
        else {
          if (currentSection === 'ingredients') {
            // currentRecipe.ingredients += token.content.split('\n').map(line => `${line.trim()}`).join('\n');
            if(token.content.trim()) {
              currentRecipe.ingredients += token.content.trim() + '\n';
            }
          }
          else if (currentSection === 'instructions') {
            currentRecipe.instructions += token.content + '\n';
          }
          else if (currentSection === 'comments') {
            currentRecipe.comments += token.content + '\n';
          }
        }
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