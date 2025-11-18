import React from 'react';
import type { Recipe, User } from '../types/recipe';
import type { Language } from '../utils/translator';
import { useTranslatedRecipe } from '../hooks/useTranslatedRecipe';
import { useTranslatedText } from '../hooks/useTranslatedText';
import { getLabel } from '../utils/labels';
import { RecipeSkeleton } from './RecipeSkeleton';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  isExpanded: boolean;
  currentLanguage: Language;
  onToggle: () => void;
  onCopyLink: (title: string, event: React.MouseEvent) => void;
  formatDate: (date: string) => string;
  getUserName: (user: User | string | undefined) => string;
  getUserPhoto: (user: User | string | undefined) => string | undefined;
  getInitials: (name: string) => string;
  getColorFromString: (str: string) => string;
  mergeIngredientSections: (sections: { title?: string; items: string[] }[]) => { title?: string; items: string[] }[];
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe: originalRecipe,
  index,
  isExpanded,
  currentLanguage,
  onToggle,
  onCopyLink,
  formatDate,
  getUserName,
  getUserPhoto,
  getInitials,
  getColorFromString,
  mergeIngredientSections
}) => {
  // Translate the full recipe when expanded
  const recipe = useTranslatedRecipe(originalRecipe, currentLanguage, isExpanded);

  // Always translate title and category for preview (even when collapsed)
  const translatedTitle = useTranslatedText(originalRecipe.title, currentLanguage);
  const translatedCategory = useTranslatedText(originalRecipe.category, currentLanguage);

  return (
    <div key={index} className="recipe" data-recipe-index={index}>
      <div className="recipe-header" onClick={onToggle}>
        {!isExpanded && recipe.photo && (
          <div className="recipe-thumbnail">
            <img src={recipe.photo} alt={translatedTitle} />
          </div>
        )}
        <div className="recipe-header-content">
          <h2>{translatedTitle}</h2>
          {!isExpanded && (
            <div className="recipe-preview-meta">
              <span className="preview-category">{translatedCategory}</span>
              {recipe.duration && <span className="preview-duration">⌛ {recipe.duration}</span>}
            </div>
          )}
        </div>
        {isExpanded && (
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
              onClick={(e) => onCopyLink(originalRecipe.title, e)}
              title="Copy recipe link"
            >
              🔗
            </button>
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="recipe-details">
          {recipe.isTranslating ? (
            <RecipeSkeleton />
          ) : (
            <>
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
          {recipe.photo && (
            <div className="recipe-photo">
              <img src={recipe.photo} alt={recipe.title} />
            </div>
          )}
          <h3>{"🛒 " + getLabel('ingredients', currentLanguage)}</h3>
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
          <h3>{"📜 " + getLabel('instructions', currentLanguage)}</h3>
          <ul>
            {recipe.instructions.map((instruction: string, i: number) => (
              <li key={i}>{instruction}</li>
            ))}
          </ul>
          {recipe.tips && recipe.tips.length > 0 && (
            <>
              <h3>{"💁 " + getLabel('tips', currentLanguage)}</h3>
              <ul>
                {recipe.tips.map((tip: string, i: number) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </>
          )}
          {recipe.info && recipe.info.length > 0 && (
            <>
              <h3>{"ℹ️ " + getLabel('info', currentLanguage)}</h3>
              <ul>
                {recipe.info.map((x: string, i: number) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </>
          )}
          {recipe.comments && recipe.comments.length > 0 && (
            <>
              <h3>{"💬 " + getLabel('comment', currentLanguage)}</h3>
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
          </>
        )}
        </div>
      )}
    </div>
  );
};
