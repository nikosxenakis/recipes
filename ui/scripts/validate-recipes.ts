import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Recipe, RecipeCollection } from '../src/types/recipe.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const validateRecipe = (recipe: Recipe, index: number): string[] => {
  const errors: string[] = [];

  if (!recipe.id) {
    errors.push(`Recipe at index ${index}: Missing id`);
  }
  if (!recipe.title || recipe.title.trim() === '') {
    errors.push(`Recipe at index ${index}: Missing or empty title`);
  }
  if (!recipe.category || recipe.category.trim() === '') {
    errors.push(`Recipe at index ${index} (${recipe.title}): Missing or empty category`);
  }
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    errors.push(`Recipe at index ${index} (${recipe.title}): Missing ingredients`);
  }
  if (!recipe.instructions || recipe.instructions.length === 0) {
    errors.push(`Recipe at index ${index} (${recipe.title}): Missing instructions`);
  }

  // Validate arrays are actually arrays
  if (!Array.isArray(recipe.ingredients)) {
    errors.push(`Recipe at index ${index} (${recipe.title}): ingredients is not an array`);
  }
  if (!Array.isArray(recipe.instructions)) {
    errors.push(`Recipe at index ${index} (${recipe.title}): instructions is not an array`);
  }

  return errors;
};

const validateCollection = (collection: RecipeCollection): string[] => {
  const errors: string[] = [];

  if (!collection.version) {
    errors.push('Collection: Missing version');
  }
  if (!collection.recipes || !Array.isArray(collection.recipes)) {
    errors.push('Collection: Missing or invalid recipes array');
    return errors; // Can't continue if recipes is not an array
  }
  if (collection.totalRecipes !== collection.recipes.length) {
    errors.push(
      `Collection: totalRecipes (${collection.totalRecipes}) doesn't match actual count (${collection.recipes.length})`
    );
  }

  // Validate each recipe
  collection.recipes.forEach((recipe, index) => {
    const recipeErrors = validateRecipe(recipe, index);
    errors.push(...recipeErrors);
  });

  // Check for duplicate IDs
  const ids = collection.recipes.map((r) => r.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Collection: Duplicate recipe IDs found: ${duplicateIds.join(', ')}`);
  }

  // Check for duplicate titles
  const titles = collection.recipes.map((r) => r.title);
  const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
  if (duplicateTitles.length > 0) {
    errors.push(`Collection: Duplicate recipe titles found: ${duplicateTitles.join(', ')}`);
  }

  return errors;
};

const validate = () => {
  console.log('🔍 Validating recipes.json...');

  const jsonPath = join(__dirname, '../public/recipes.json');
  const rawData = readFileSync(jsonPath, 'utf-8');
  const collection: RecipeCollection = JSON.parse(rawData);

  const errors = validateCollection(collection);

  console.log('✅ Validation complete!');
  console.log(`   Total recipes: ${collection.totalRecipes}`);
  console.log(`   Categories: ${collection.categories.length}`);
  console.log(`   Generated: ${collection.generatedAt}`);

  if (errors.length > 0) {
    console.warn(`\n⚠️  Found ${errors.length} validation warnings:`);
    errors.slice(0, 10).forEach((error) => console.warn(`   - ${error}`));
    if (errors.length > 10) {
      console.warn(`   ... and ${errors.length - 10} more warnings`);
    }
    console.warn('\n💡 These are data quality issues in the source markdown file.');
  } else {
    console.log('   No validation warnings!');
  }

  process.exit(0);
};

validate();
