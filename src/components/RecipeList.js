import React, { useState } from 'react';
import './RecipeList.css';

const RecipeList = ({ recipes }) => {
  const [visibleRecipes, setVisibleRecipes] = useState({});

  const toggleVisibility = (index) => {
    setVisibleRecipes(prevState => ({
      ...prevState,
      [index]: !prevState[index]
    }));
  };

  return (
    <div className="recipe-list">
      {recipes.map((recipe, index) => (
        <div key={index} className="recipe">
          <h2 onClick={() => toggleVisibility(index)}>{recipe.title}</h2>
          {visibleRecipes[index] && (
            <div className="recipe-details">
              <h3>Zutaten</h3>
              <ul>
                {recipe.ingredients.split('\n').map((ingredient, i) => (
                  <li key={i}>{ingredient}</li>
                ))}
              </ul>
              <h3>Zubereitung</h3>
              <p>{recipe.instructions}</p>
              {recipe.comments && (
                <>
                  <h3>Kommentar</h3>
                  <p>{recipe.comments}</p>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RecipeList;