import React from 'react';
import ReactMarkdown from 'react-markdown';

const Recipe = ({ title, ingredients, instructions, comments }) => (
  <div className="recipe">
    <h2>{title}</h2>
    <h3>Zutaten</h3>
    <ReactMarkdown>{ingredients}</ReactMarkdown>
    <h3>Zubereitung</h3>
    <ReactMarkdown>{instructions}</ReactMarkdown>
    <h3>Kommentar</h3>
    <ReactMarkdown>{comments}</ReactMarkdown>
  </div>
);

export default Recipe;