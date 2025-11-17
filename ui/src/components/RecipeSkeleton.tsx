import React from 'react';
import './RecipeSkeleton.css';

export const RecipeSkeleton: React.FC = () => {
  return (
    <>
      {/* Metadata skeleton */}
      <div className="skeleton-section">
        <div className="skeleton skeleton-line long"></div>
        <div className="skeleton skeleton-line medium"></div>
        <div className="skeleton skeleton-line short"></div>
      </div>

      {/* Ingredients section */}
      <div className="skeleton skeleton-heading"></div>
      <div className="skeleton-section">
        <div className="skeleton skeleton-line long"></div>
        <div className="skeleton skeleton-line medium"></div>
        <div className="skeleton skeleton-line long"></div>
        <div className="skeleton skeleton-line short"></div>
        <div className="skeleton skeleton-line medium"></div>
      </div>

      {/* Instructions section */}
      <div className="skeleton skeleton-heading"></div>
      <div className="skeleton-section">
        <div className="skeleton skeleton-line long"></div>
        <div className="skeleton skeleton-line medium"></div>
        <div className="skeleton skeleton-line long"></div>
        <div className="skeleton skeleton-line medium"></div>
        <div className="skeleton skeleton-line short"></div>
      </div>

      {/* Tips section */}
      <div className="skeleton skeleton-heading short"></div>
      <div className="skeleton-section">
        <div className="skeleton skeleton-line medium"></div>
        <div className="skeleton skeleton-line long"></div>
      </div>
    </>
  );
};
