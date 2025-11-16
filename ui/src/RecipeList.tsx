import React, { useState } from "react";
import type { Recipe, User, Comment } from "./types/recipe";
import "./RecipeList.css";

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const RecipeList = ({ recipes }: { recipes: Recipe[] }) => {
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const recipesPerPage = 5;

  const toggleVisibility = (index: number) => {
    setExpandedRecipe((prevState) => (prevState === index ? null : index));
  };

  // Helper to get user name from User object or string
  const getUserName = (user: User | string | undefined): string => {
    if (!user) return "";
    return typeof user === "string" ? user : user.name;
  };

  // Helper to get user photo from User object
  const getUserPhoto = (user: User | string | undefined): string | undefined => {
    if (!user || typeof user === "string") return undefined;
    // Use relative path that works with Vite's base path
    return user.photo ? `./users/${user.photo}` : undefined;
  };

  // Get initials from name for avatar
  const getInitials = (name: string): string => {
    const parts = name.trim().split(" ");
    return parts[0][0].toUpperCase();
  };

  // Generate color from string
  const getColorFromString = (str: string): string => {
    const colors = ["#b87c7c", "#7cb8b8", "#b8b87c", "#b87ca8", "#7ca8b8", "#a8b87c"];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Merge consecutive ingredient sections without titles
  const mergeIngredientSections = (sections: { title?: string; items: string[] }[]) => {
    const merged: { title?: string; items: string[] }[] = [];
    let currentUntitledSection: string[] = [];

    sections.forEach((section) => {
      if (section.title) {
        // If we have accumulated untitled items, push them as a single section
        if (currentUntitledSection.length > 0) {
          merged.push({ items: currentUntitledSection });
          currentUntitledSection = [];
        }
        // Push the titled section
        merged.push(section);
      } else {
        // Accumulate items from untitled sections
        currentUntitledSection.push(...section.items);
      }
    });

    // Push any remaining untitled items
    if (currentUntitledSection.length > 0) {
      merged.push({ items: currentUntitledSection });
    }

    return merged;
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchQuery.trim() && !searchTerms.includes(searchQuery.trim())) {
      setSearchTerms([...searchTerms, searchQuery.trim()]);
      setSearchQuery("");
      setCurrentPage(1); // Reset to first page on new search
    }
  };

  const handleRemoveSearchTerm = (term: string) => {
    setSearchTerms(searchTerms.filter((t) => t !== term));
  };

  const filteredRecipes = recipes.filter((recipe) => {
    // Filter by search terms
    const matchesSearch = searchTerms.every(
      (term) =>
        recipe.title.toLowerCase().includes(term.toLowerCase()) ||
        recipe.ingredients.some((section) =>
          section.items.some((ingredient: string) =>
            ingredient.toLowerCase().includes(term.toLowerCase())
          )
        )
    );

    return matchesSearch;
  });

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
      <div className="filters-container">
        <form onSubmit={handleSearchSubmit} className="search-bar-container">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-bar"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>
      <div className="breadcrumbs">
        {searchTerms.map((term, index) => (
          <span key={index} className="breadcrumb">
            {term}
            <button onClick={() => handleRemoveSearchTerm(term)} className="remove-button">
              x
            </button>
          </span>
        ))}
      </div>
      {currentRecipes.map((recipe, index) => (
        <div key={indexOfFirstRecipe + index} className="recipe">
          <button
            className={`collapsible ${
              expandedRecipe === indexOfFirstRecipe + index ? "active" : ""
            }`}
          >
            {expandedRecipe === indexOfFirstRecipe + index ? "−" : "+"}
          </button>
          <h2 onClick={() => toggleVisibility(indexOfFirstRecipe + index)}>{recipe.title}</h2>
          {expandedRecipe === indexOfFirstRecipe + index && (
            <div className="recipe-details">
              <div className="recipe-meta">
                <div className="recipe-meta-left">
                  <span className="category-tag">🍽️ {recipe.category}</span>
                  {recipe.duration && <span className="meta-info">⌛ {recipe.duration}</span>}
                  {recipe.servings && <span className="meta-info">👥 {recipe.servings}</span>}
                </div>
                {(recipe.creator || recipe.createdAt) && (
                  <div className="recipe-meta-right">
                    {recipe.creator && (
                      <span className="meta-info creator-badge">
                        {getUserPhoto(recipe.creator) ? (
                          <img
                            src={getUserPhoto(recipe.creator)}
                            alt={getUserName(recipe.creator)}
                            className="user-avatar-small"
                          />
                        ) : (
                          <div
                            className="user-avatar-small user-avatar-initials"
                            style={{
                              backgroundColor: getColorFromString(getUserName(recipe.creator)),
                            }}
                          >
                            {getInitials(getUserName(recipe.creator))}
                          </div>
                        )}
                        {getUserName(recipe.creator)}
                      </span>
                    )}
                    {recipe.createdAt && (
                      <span className="meta-info">📅 {formatDate(recipe.createdAt)}</span>
                    )}
                  </div>
                )}
              </div>
              <h3>🛒 Zutaten</h3>
              {mergeIngredientSections(recipe.ingredients).map((section, sectionIndex: number) => (
                <div key={sectionIndex} className="ingredient-section">
                  {section.title && <h4 className="ingredient-section-title">{section.title}</h4>}
                  <ul>
                    {section.items.map((ingredient: string, i: number) => (
                      <li key={i}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <h3>📜 Zubereitung</h3>
              <ul>
                {recipe.instructions.map((instruction: string, i: number) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ul>
              {recipe.tips && recipe.tips.length > 0 && (
                <>
                  <h3>💁 Tipp</h3>
                  <ul>
                    {recipe.tips.map((tip: string, i: number) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </>
              )}
              {recipe.info && recipe.info.length > 0 && (
                <>
                  <h3>ℹ️ Info</h3>
                  <ul>
                    {recipe.info.map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </>
              )}
              {recipe.comments && recipe.comments.length > 0 && (
                <>
                  <h3>💬 Kommentar</h3>
                  <div className="comments-section">
                    {recipe.comments.map((comment, i: number) => {
                      const userName = getUserName(comment.user);
                      const userPhoto = getUserPhoto(comment.user);
                      return (
                        <div key={i} className="comment">
                          {userPhoto ? (
                            <img
                              src={userPhoto}
                              alt={userName}
                              className="comment-avatar-img"
                            />
                          ) : (
                            <div
                              className="comment-avatar"
                              style={{
                                backgroundColor: userName
                                  ? getColorFromString(userName)
                                  : "#999",
                              }}
                            >
                              {userName ? getInitials(userName) : "?"}
                            </div>
                          )}
                          <div className="comment-content">
                            {userName && <div className="comment-author">{userName}</div>}
                            <div className="comment-text">{comment.text}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
      <div className="pagination">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default RecipeList;
