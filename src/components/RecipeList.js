import React, { useState } from 'react';
import './RecipeList.css';

const RecipeList = ({ recipes }) => {
  const [visibleRecipes, setVisibleRecipes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const recipesPerPage = 5;

  const toggleVisibility = (index) => {
    setVisibleRecipes(prevState => ({
      ...prevState,
      [index]: !prevState[index]
    }));
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.ingredients.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.instructions.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.comments.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = filteredRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe);

  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="recipe-list">
      <input
        type="text"
        placeholder="Search recipes..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-bar"
      />
      {currentRecipes.map((recipe, index) => (
        <div key={indexOfFirstRecipe + index} className="recipe">
          <h2 onClick={() => toggleVisibility(indexOfFirstRecipe + index)}>{recipe.title}</h2>
          {visibleRecipes[indexOfFirstRecipe + index] && (
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
      <div className="pagination">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
      </div>
    </div>
  );
};

export default RecipeList;