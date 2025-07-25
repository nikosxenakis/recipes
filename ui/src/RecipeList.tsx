import React, { useState } from "react";
import "./RecipeList.css";

const RecipeList = ({ recipes }: { recipes: any[] }) => {
    const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchTerms, setSearchTerms] = useState<string[]>([]);
    const recipesPerPage = 5;

    const toggleVisibility = (index: number) => {
        setExpandedRecipe((prevState) => (prevState === index ? null : index));
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

    const filteredRecipes = recipes.filter((recipe) =>
        searchTerms.every(
            (term) =>
                recipe.title.toLowerCase().includes(term.toLowerCase()) ||
                recipe.ingredients.some((ingredient: string) => ingredient.toLowerCase().includes(term.toLowerCase())),
        ),
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
                    <button className={`collapsible ${expandedRecipe === indexOfFirstRecipe + index ? "active" : ""}`}>
                        {expandedRecipe === indexOfFirstRecipe + index ? "−" : "+"}
                    </button>
                    <h2 onClick={() => toggleVisibility(indexOfFirstRecipe + index)}>{recipe.title}</h2>
                    {expandedRecipe === indexOfFirstRecipe + index && (
                        <div className="recipe-details">
                            <h3>🔠 {recipe.category}</h3>
                            {recipe.duration && <p>⌛ {recipe.duration}</p>}
                            <h3>🥗 Zutaten</h3>
                            <ul>
                                {recipe.ingredients.map((ingredient: string, i: number) => (
                                    <li key={i}>{ingredient}</li>
                                ))}
                            </ul>
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
                                    <h3>Kommentar 💬</h3>
                                    {recipe.comments.map((comment: string, i: number) => (
                                        <p key={i}>{comment}</p>
                                    ))}
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
