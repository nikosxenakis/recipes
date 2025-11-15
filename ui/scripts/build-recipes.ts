import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';
import type { Recipe, RecipeCollection, Comment, IngredientSection } from '../src/types/recipe.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parseComment = (commentText: string): Comment => {
  // Check if comment has format "User: Comment text"
  const match = commentText.match(/^([^:]+):\s*(.+)$/);

  if (match) {
    return {
      user: match[1].trim(),
      text: match[2].trim(),
    };
  }

  // No user specified, just the comment text
  return {
    text: commentText.trim(),
  };
};

const parseMarkdown = (text: string): Recipe[] => {
  const md = new MarkdownIt();
  const tokens = md.parse(text, {});

  const parsedRecipes: Recipe[] = [];
  let currentRecipe: Partial<Recipe> | null = null;
  let isH1 = false;
  let isH2 = false;
  let isH3 = false;
  let currentSection = '';
  let firstElement = true;
  let category = '';
  let recipeCounter = 0;

  tokens.forEach((token: any) => {
    if (token.type === 'heading_open' && token.tag === 'h1') {
      isH1 = true;
    } else if (token.type === 'heading_close' && token.tag === 'h1') {
      isH1 = false;
    } else if (token.type === 'heading_open' && token.tag === 'h2') {
      if (currentRecipe && currentRecipe.title) {
        parsedRecipes.push(currentRecipe as Recipe);
      }
      currentRecipe = {
        id: `recipe-${++recipeCounter}`,
        category: category || 'Uncategorized',
        ingredients: [],
        instructions: [],
        tips: [],
        info: [],
        comments: [],
      };
      isH2 = true;
      currentSection = '';
    } else if (token.type === 'heading_close' && token.tag === 'h2') {
      isH2 = false;
    } else if (token.type === 'heading_open' && token.tag === 'h3') {
      isH3 = true;
      currentSection = '';
    } else if (token.type === 'heading_close' && token.tag === 'h3') {
      isH3 = false;
    } else if (token.type === 'inline' && token.content) {
      if (isH1) {
        category = token.content;
      }
      if (isH2) {
        currentRecipe!.title = token.content;
      } else if (isH3) {
        if (token.content.startsWith('Zutaten')) {
          currentSection = 'ingredients';
          // Extract servings from "Zutaten (für X Portionen)" format
          const servingsMatch = token.content.match(/\(für (.+?)\)/);
          if (servingsMatch) {
            currentRecipe!.servings = servingsMatch[1];
          }
        } else if (token.content.startsWith('Zubereitung') || token.content.startsWith('Zubereitungszeit')) {
          currentSection = 'instructions';
        } else if (token.content.startsWith('Kommentar')) {
          currentSection = 'comments';
        } else if (token.content.startsWith('Tipp')) {
          currentSection = 'tips';
        } else if (token.content.startsWith('Info')) {
          currentSection = 'info';
        }
        firstElement = true;
      }

      if (firstElement) {
        firstElement = false;
      } else {
        if (currentSection === 'ingredients') {
          const lines = token.content.trim().split('\n').filter((x: string) => x !== '');

          let currentIngredientSection: IngredientSection = { items: [] };

          lines.forEach((line: string) => {
            // Check if line is a section header (italic format: *Text:* or _Text:_)
            const sectionMatch = line.match(/^[*_](.+?)[*_]$/);

            if (sectionMatch) {
              // Save previous section if it has items
              if (currentIngredientSection.items.length > 0) {
                currentRecipe!.ingredients!.push(currentIngredientSection);
              }
              // Start new section
              currentIngredientSection = {
                title: sectionMatch[1].replace(/:\s*$/, ''), // Remove trailing colon
                items: [],
              };
            } else if (line.trim()) {
              // Regular ingredient
              currentIngredientSection.items.push(line);
            }
          });

          // Push the last section
          if (currentIngredientSection.items.length > 0) {
            currentRecipe!.ingredients!.push(currentIngredientSection);
          }
        } else if (currentSection === 'instructions') {
          const instructions = token.content.trim().split('\n');
          if (
            instructions.length >= 1 &&
            (instructions[0].toLowerCase().includes('minute') ||
              instructions[0].toLowerCase().includes('stunde') ||
              instructions[0].toLowerCase().includes('std') ||
              instructions[0].toLowerCase().includes('min')) &&
            instructions[0].length <= 40
          ) {
            currentRecipe!.duration = instructions[0];
            instructions.shift();
          }
          instructions
            .filter((x: string) => x !== '')
            .forEach((instruction: string) => {
              // Check if this instruction looks like a comment (User: text pattern)
              if (instruction.match(/^[^:]+:\s*.+$/)) {
                currentRecipe!.comments!.push(parseComment(instruction));
              } else {
                currentRecipe!.instructions!.push(instruction);
              }
            });
        } else if (currentSection === 'comments') {
          const comments = token.content
            .trim()
            .split('\n')
            .filter((x: string) => x !== '');
          comments.forEach((commentText: string) => {
            currentRecipe!.comments!.push(parseComment(commentText));
          });
        } else if (currentSection === 'tips') {
          const tips = token.content
            .trim()
            .split('\n')
            .filter((x: string) => x !== '');
          tips.forEach((tip: string) => {
            currentRecipe!.tips!.push(tip);
          });
        } else if (currentSection === 'info') {
          const info = token.content
            .trim()
            .split('\n')
            .filter((x: string) => x !== '');
          info.forEach((x: string) => {
            currentRecipe!.info!.push(x);
          });
        }
      }
    }
  });

  if (currentRecipe && currentRecipe.title) {
    parsedRecipes.push(currentRecipe as Recipe);
  }

  return parsedRecipes;
};

const buildRecipes = () => {
  console.log('📖 Reading Rezeptbuch.md...');
  const markdownPath = join(__dirname, '../public/Rezeptbuch.md');
  let markdown = readFileSync(markdownPath, 'utf-8');

  // Remove BOM (Byte Order Mark) if present
  if (markdown.charCodeAt(0) === 0xFEFF) {
    markdown = markdown.slice(1);
  }

  console.log('🔄 Parsing recipes...');
  const recipes = parseMarkdown(markdown);

  // Clean up recipes by removing empty optional fields
  const cleanedRecipes = recipes.map((recipe) => {
    const cleaned: any = { ...recipe };

    // Remove empty optional arrays
    if (cleaned.tips && cleaned.tips.length === 0) {
      delete cleaned.tips;
    }
    if (cleaned.info && cleaned.info.length === 0) {
      delete cleaned.info;
    }
    if (cleaned.comments && cleaned.comments.length === 0) {
      delete cleaned.comments;
    }

    return cleaned as Recipe;
  });

  // Extract unique categories
  const categories = [...new Set(cleanedRecipes.map((r) => r.category))].sort();

  const collection: RecipeCollection = {
    version: '1.0.0',
    totalRecipes: cleanedRecipes.length,
    categories,
    recipes: cleanedRecipes,
    generatedAt: new Date().toISOString(),
  };

  console.log(`✅ Parsed ${cleanedRecipes.length} recipes across ${categories.length} categories`);

  const outputPath = join(__dirname, '../public/recipes.json');
  writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf-8');

  console.log(`💾 Saved to ${outputPath}`);
  console.log('✨ Build complete!');
};

buildRecipes();
