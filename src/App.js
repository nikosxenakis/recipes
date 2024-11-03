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

  const downloadJson = (data, filename = 'recipes.json') => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
        if (currentRecipe && currentRecipe.title) {
          parsedRecipes.push(currentRecipe);
        }
        currentRecipe = {
          category: category,
          ingredients: [],
          instructions: [],
          tips: [],
          info: [],
          comments: [],
        };
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
          else if (token.content.startsWith('Tipp')) {
            currentSection = 'tips';
          }
          else if (token.content.startsWith('Info')) {
            currentSection = 'info';
          }
          firstElement = true;
        }

        if(firstElement) {
          firstElement = false;
        }
        else {
          if (currentSection === 'ingredients') {
            const ingredients = token.content.trim().split('\n').filter(x => x !== '');
            ingredients.forEach(ingredient => {
              currentRecipe.ingredients.push(ingredient);
            });
          }
          else if (currentSection === 'instructions') {
            const instructions = token.content.trim().split('\n');
            if(
              instructions.length >= 1 &&
              (
                instructions[0].toLowerCase().includes('minute') ||
                instructions[0].toLowerCase().includes('stunde') ||
                instructions[0].toLowerCase().includes('std') ||
                instructions[0].toLowerCase().includes('min')
              ) &&
              instructions[0].length <= 40
            ) {
              currentRecipe.duration = instructions[0];
              instructions.shift();
            }
            instructions.filter(x => x !== '').forEach(instruction => {
              currentRecipe.instructions.push(instruction);
            });
          }
          else if (currentSection === 'comments') {
            const comments = token.content.trim().split('\n').filter(x => x !== '');
            comments.forEach(comment => {
              currentRecipe.comments.push(comment);
            });
          }
          else if (currentSection === 'tips') {
            const tips = token.content.trim().split('\n').filter(x => x !== '');
            tips.forEach(tip => {
              currentRecipe.tips.push(tip);
            });
          }
          else if (currentSection === 'info') {
            const info = token.content.trim().split('\n').filter(x => x !== '');
            info.forEach(x => {
              currentRecipe.info.push(x);
            });
          }
        }
      }
    });

    if (currentRecipe && currentRecipe.title) {
      parsedRecipes.push(currentRecipe);
    }

    console.log(`Parsed ${parsedRecipes.length} recipes`);
    setRecipes(parsedRecipes);
    // downloadJson(parsedRecipes);
  };

  return (
    <div className="App">
      <h1>REZEPTBUCH</h1>
      <RecipeList recipes={recipes} />
    </div>
  );
};

export default App;