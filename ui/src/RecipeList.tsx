import React, { useState, useEffect } from "react";
import type { Recipe, User } from "./types/recipe";
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDuration, setSelectedDuration] = useState<string>("all");
  const recipesPerPage = 10;

  // Handle hash navigation on mount and hash changes
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const decodedTitle = decodeURIComponent(hash);
        const recipeIndex = recipes.findIndex(r => r.title === decodedTitle);
        if (recipeIndex !== -1) {
          setExpandedRecipe(recipeIndex);
          // Calculate which page contains this recipe
          const page = Math.floor(recipeIndex / recipesPerPage) + 1;
          setCurrentPage(page);
          // Scroll to recipe after a short delay to ensure it's rendered
          setTimeout(() => {
            const recipeElement = document.querySelector(`[data-recipe-index="${recipeIndex}"]`);
            if (recipeElement) {
              recipeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      }
    };

    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
    return () => window.removeEventListener('hashchange', handleHashNavigation);
  }, [recipes, recipesPerPage]);

  // Extract unique categories from recipes
  const categories = Array.from(new Set(recipes.map((r) => r.category))).sort();

  // Define duration ranges
  const durationRanges = [
    { label: "All durations", value: "all" },
    { label: "Quick (< 30 min)", value: "quick" },
    { label: "Medium (30-60 min)", value: "medium" },
    { label: "Long (> 60 min)", value: "long" },
  ];

  const toggleVisibility = (index: number) => {
    setExpandedRecipe((prevState) => (prevState === index ? null : index));
  };

  const copyRecipeLink = (recipeTitle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(recipeTitle)}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Recipe link copied to clipboard!');
    });
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

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDuration(event.target.value);
    setCurrentPage(1);
  };

  // Extract duration in minutes from duration string
  const extractDurationMinutes = (duration?: string): number | null => {
    if (!duration) return null;

    const durationLower = duration.toLowerCase();
    let totalMinutes = 0;

    // Match hours (Stunde/Std/h)
    const hoursMatch = durationLower.match(/(\d+)\s*(stunde|std|h)/);
    if (hoursMatch) {
      totalMinutes += parseInt(hoursMatch[1]) * 60;
    }

    // Match minutes (Minute/Min/m)
    const minutesMatch = durationLower.match(/(\d+)\s*(minute|min|m(?!$))/);
    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1]);
    }

    return totalMinutes > 0 ? totalMinutes : null;
  };

  const filteredRecipes = recipes.filter((recipe) => {
    // Filter by search terms
    const matchesSearch =
      searchTerms.length === 0 ||
      searchTerms.every(
        (term) =>
          recipe.title.toLowerCase().includes(term.toLowerCase()) ||
          recipe.ingredients.some((section) =>
            section.items.some((ingredient: string) =>
              ingredient.toLowerCase().includes(term.toLowerCase())
            )
          )
      );

    // Filter by category
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;

    // Filter by duration
    let matchesDuration = true;
    if (selectedDuration !== "all") {
      const minutes = extractDurationMinutes(recipe.duration);
      if (minutes === null) {
        matchesDuration = false;
      } else if (selectedDuration === "quick") {
        matchesDuration = minutes < 30;
      } else if (selectedDuration === "medium") {
        matchesDuration = minutes >= 30 && minutes <= 60;
      } else if (selectedDuration === "long") {
        matchesDuration = minutes > 60;
      }
    }

    return matchesSearch && matchesCategory && matchesDuration;
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
      <div className="filters-section">
        <div className="filters-header">
          <h3 className="filters-title">🔍 Search & Filter</h3>
        </div>
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
          <div className="filter-dropdowns">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="filter-select"
            >
              <option value="all">🍽️ All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={selectedDuration}
              onChange={handleDurationChange}
              className="filter-select"
            >
              {durationRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  ⌛ {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {searchTerms.length > 0 && (
          <div className="active-filters">
            <span className="active-filters-label">Active filters:</span>
            {searchTerms.map((term, index) => (
              <span key={index} className="filter-chip">
                {term}
                <button onClick={() => handleRemoveSearchTerm(term)} className="filter-chip-remove">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="recipe-header-bar">
        <div className="recipe-count">
          <span>{filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found</span>
        </div>
        <a
          href="https://docs.google.com/forms/d/13e0Xg_iriYidQaxAbvvsUv-4fin-sbCFkG5sr4GcOg0/edit#responses"
          target="_blank"
          rel="noopener noreferrer"
          className="add-recipe-button"
          title="Add a new recipe"
        >
          ➕ Add Recipe
        </a>
      </div>
      {currentRecipes.map((recipe, index) => (
        <div
          key={indexOfFirstRecipe + index}
          className="recipe"
          data-recipe-index={indexOfFirstRecipe + index}
        >
          <div className="recipe-header" onClick={() => toggleVisibility(indexOfFirstRecipe + index)}>
            <h2>{recipe.title}</h2>
            {expandedRecipe !== indexOfFirstRecipe + index && (
              <div className="recipe-preview-meta">
                <span className="preview-category">{recipe.category}</span>
                {recipe.duration && <span className="preview-duration">⌛ {recipe.duration}</span>}
              </div>
            )}
            {expandedRecipe === indexOfFirstRecipe + index && (
              <div className="recipe-header-actions">
                {recipe.creator && (
                  <span className="creator-badge-header">
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
                <button
                  className="copy-link-button"
                  onClick={(e) => copyRecipeLink(recipe.title, e)}
                  title="Copy recipe link"
                >
                  🔗
                </button>
              </div>
            )}
          </div>
          {expandedRecipe === indexOfFirstRecipe + index && (
            <div className="recipe-details">
              <div className="recipe-meta">
                <div className="recipe-meta-left">
                  <span className="category-tag">🍽️ {recipe.category}</span>
                  {recipe.duration && <span className="meta-info">⌛ {recipe.duration}</span>}
                  {recipe.servings && <span className="meta-info">👥 {recipe.servings}</span>}
                </div>
                {recipe.createdAt && (
                  <div className="recipe-meta-right">
                    <span className="meta-info">📅 {formatDate(recipe.createdAt)}</span>
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
                            <img src={userPhoto} alt={userName} className="comment-avatar-img" />
                          ) : (
                            <div
                              className="comment-avatar"
                              style={{
                                backgroundColor: userName ? getColorFromString(userName) : "#999",
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
