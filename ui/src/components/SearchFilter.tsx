import React from 'react';
import type { Language } from '../utils/translator';
import { getLabel, getCategoryLabel } from '../utils/labels';
import './SearchFilter.css';

interface SearchFilterProps {
  searchQuery: string;
  searchTerms: string[];
  selectedCategory: string;
  selectedCreator: string;
  categories: string[];
  creators: string[];
  currentLanguage: Language;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onRemoveSearchTerm: (term: string) => void;
  onCategoryChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onCreatorChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchQuery,
  searchTerms,
  selectedCategory,
  selectedCreator,
  categories,
  creators,
  currentLanguage,
  onSearchChange,
  onSearchSubmit,
  onRemoveSearchTerm,
  onCategoryChange,
  onCreatorChange
}) => {
  return (
    <div className="filters-section">
      <div className="filters-header">
        <h3 className="filters-title">🔍 {getLabel('searchAndFilter', currentLanguage)}</h3>
      </div>
      <div className="filters-container">
        <form onSubmit={onSearchSubmit} className="search-bar-container">
          <input
            type="text"
            placeholder={getLabel('searchPlaceholder', currentLanguage)}
            value={searchQuery}
            onChange={onSearchChange}
            className="search-bar"
          />
          <button type="submit" className="search-button">
            {getLabel('searchButton', currentLanguage)}
          </button>
        </form>
        <div className="filter-dropdowns">
          <select
            value={selectedCategory}
            onChange={onCategoryChange}
            className="filter-select"
          >
            <option value="all">🍽️ {getLabel('allCategories', currentLanguage)}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {getCategoryLabel(category, currentLanguage)}
              </option>
            ))}
          </select>
          <select
            value={selectedCreator}
            onChange={onCreatorChange}
            className="filter-select"
          >
            <option value="all">👨‍🍳 {getLabel('allCreators', currentLanguage)}</option>
            {creators.map((creator) => (
              <option key={creator} value={creator}>
                {creator}
              </option>
            ))}
          </select>
        </div>
      </div>
      {searchTerms.length > 0 && (
        <div className="active-filters">
          <span className="active-filters-label">{getLabel('activeFilters', currentLanguage)}</span>
          {searchTerms.map((term, index) => (
            <span key={index} className="filter-chip">
              {term}
              <button onClick={() => onRemoveSearchTerm(term)} className="filter-chip-remove">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
