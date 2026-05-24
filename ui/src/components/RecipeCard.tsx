import React from 'react';
import type { Recipe, User } from '../types/recipe';
import type { Language } from '../utils/translator';
import { useTranslatedRecipe } from '../hooks/useTranslatedRecipe';
import { useTranslatedText } from '../hooks/useTranslatedText';
import { useWakeLock } from '../hooks/useWakeLock';
import { useWakeLockPreference } from '../hooks/useWakeLockPreference';
import { getLabel, getCategoryLabel } from '../utils/labels';
import { RecipeSkeleton } from './RecipeSkeleton';
import { Avatar } from './Avatar';
import { WakeLockToggle } from './WakeLockToggle';

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
  mergeIngredientSections
}) => {
  // Translate the full recipe when expanded
  const recipe = useTranslatedRecipe(originalRecipe, currentLanguage, isExpanded);

  // Translate the title via the live translator; categories are already i18n keys.
  const titleResult = useTranslatedText(originalRecipe.title, currentLanguage);
  const categoryLabel = getCategoryLabel(originalRecipe.category, currentLanguage);
  const previewTranslating = !isExpanded && titleResult.isTranslating;

  const [wakeLockEnabled, setWakeLockEnabled] = useWakeLockPreference();
  useWakeLock(isExpanded && wakeLockEnabled);

  return (
    <div key={index} className="recipe" data-recipe-index={index}>
      <div className="recipe-header" onClick={onToggle}>
        {!isExpanded && recipe.photo && (
          <div className="recipe-thumbnail">
            <img src={recipe.photo} alt={titleResult.text} />
          </div>
        )}
        <div className="recipe-header-content">
          {previewTranslating ? (
            <>
              <div className="skeleton skeleton-card-title"></div>
              <div className="recipe-preview-meta">
                <div className="skeleton skeleton-card-chip"></div>
                {recipe.duration && <div className="skeleton skeleton-card-chip short"></div>}
              </div>
            </>
          ) : (
            <>
              <h2>{titleResult.text}</h2>
              {!isExpanded && (
                <div className="recipe-preview-meta">
                  <span className="preview-category">{categoryLabel}</span>
                  {recipe.duration && <span className="preview-duration">⌛ {recipe.duration}</span>}
                </div>
              )}
            </>
          )}
        </div>
        {isExpanded && (
          <div className="recipe-header-actions">
            {recipe.creator && (
              <span className="creator-badge-header">
                <Avatar
                  photoUrl={getUserPhoto(recipe.creator)}
                  name={getUserName(recipe.creator)}
                  imgClassName="user-avatar-small"
                  initialsClassName="user-avatar-small user-avatar-initials"
                />
                {getUserName(recipe.creator)}
              </span>
            )}
            <WakeLockToggle
              enabled={wakeLockEnabled}
              onChange={setWakeLockEnabled}
              language={currentLanguage}
            />
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
              <span className="category-tag">🍽️ {categoryLabel}</span>
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
                      <Avatar
                        photoUrl={userPhoto}
                        name={userName}
                        imgClassName="comment-avatar-img"
                        initialsClassName="comment-avatar"
                      />
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
