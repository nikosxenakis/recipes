import React from 'react';
import Recipe from './Recipe';

const RecipeList = ({ recipes }) => (
  <div className="recipe-list">
    {recipes.map((recipe, index) => (
      <Recipe
        key={index}
        title={recipe.title}
        ingredients={recipe.ingredients}
        instructions={recipe.instructions}
      />
    ))}
  </div>
);

export default RecipeList;