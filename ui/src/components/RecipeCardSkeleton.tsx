import './RecipeSkeleton.css';

export function RecipeCardSkeleton() {
  return (
    <div className="recipe recipe-skeleton-card" aria-hidden="true">
      <div className="recipe-header">
        <div className="recipe-header-content">
          <div className="skeleton skeleton-card-title"></div>
          <div className="recipe-preview-meta">
            <div className="skeleton skeleton-card-chip"></div>
            <div className="skeleton skeleton-card-chip short"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
