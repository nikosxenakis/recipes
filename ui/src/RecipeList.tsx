import React, { useState, useEffect } from "react";
import type { Recipe, User } from "./types/recipe";
import type { Language } from "./utils/translator";
import { getLabel } from "./utils/labels";
import { RecipeCard } from "./components/RecipeCard";
import { SearchFilter } from "./components/SearchFilter";
import "./RecipeList.css";

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

interface RecipeListProps {
  recipes: Recipe[];
  currentLanguage: Language;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, currentLanguage }) => {
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDuration, setSelectedDuration] = useState<string>("all");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
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

  // Extract unique creators from recipes
  const creators = Array.from(
    new Set(
      recipes
        .map((r) => r.creator)
        .filter((c) => c !== undefined)
        .map((c) => (typeof c === "string" ? c : c.name))
    )
  ).sort();

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

  const handleCreatorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCreator(event.target.value);
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

    // Filter by creator
    const matchesCreator =
      selectedCreator === "all" ||
      (recipe.creator && getUserName(recipe.creator) === selectedCreator);

    return matchesSearch && matchesCategory && matchesDuration && matchesCreator;
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
      <SearchFilter
        searchQuery={searchQuery}
        searchTerms={searchTerms}
        selectedCategory={selectedCategory}
        selectedDuration={selectedDuration}
        selectedCreator={selectedCreator}
        categories={categories}
        creators={creators}
        currentLanguage={currentLanguage}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onRemoveSearchTerm={handleRemoveSearchTerm}
        onCategoryChange={handleCategoryChange}
        onDurationChange={handleDurationChange}
        onCreatorChange={handleCreatorChange}
      />
      <div className="recipe-header-bar">
        <div className="recipe-count">
          <span>{filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found</span>
        </div>
        <a
          href="https://forms.gle/GC1GtuCSwFZEyE69A"
          target="_blank"
          rel="noopener noreferrer"
          className="add-recipe-button"
          title="Add a new recipe"
        >
          ➕ Add Recipe
        </a>
      </div>
      {currentRecipes.map((recipe, index) => (
        <RecipeCard
          key={indexOfFirstRecipe + index}
          recipe={recipe}
          index={indexOfFirstRecipe + index}
          isExpanded={expandedRecipe === indexOfFirstRecipe + index}
          currentLanguage={currentLanguage}
          onToggle={() => toggleVisibility(indexOfFirstRecipe + index)}
          onCopyLink={copyRecipeLink}
          formatDate={formatDate}
          getUserName={getUserName}
          getUserPhoto={getUserPhoto}
          getInitials={getInitials}
          getColorFromString={getColorFromString}
          mergeIngredientSections={mergeIngredientSections}
        />
      ))}
      <div className="pagination">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>
          {getLabel('previous', currentLanguage)}
        </button>
        <span>
          {getLabel('page', currentLanguage)} {currentPage} {getLabel('of', currentLanguage)} {totalPages}
        </span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
          {getLabel('next', currentLanguage)}
        </button>
      </div>
    </div>
  );
};

export default RecipeList;
