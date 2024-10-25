import React from 'react';
import ReactMarkdown from 'react-markdown';

const Recipe = ({ title, ingredients, instructions }) => (
  <div className="recipe">
    <h2>{title}</h2>
    <h3>Zutaten</h3>
    <ReactMarkdown>{ingredients}</ReactMarkdown>
    <h3>Zubereitung</h3>
    <ReactMarkdown>{instructions}</ReactMarkdown>
  </div>
);

export default Recipe;