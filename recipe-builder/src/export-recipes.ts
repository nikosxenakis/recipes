import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";
import type {
  Recipe,
  RecipeCollection,
} from "../../ui/src/types/recipe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exportRecipes = () => {
  const distDir = join(__dirname, "../dist");
  const outputPath = join(__dirname, "../../ui/public/recipes.json");

  if (!existsSync(distDir)) {
    console.error("❌ Error: dist/ folder not found!");
    console.error("   Run 'npm run build:recipes' first to generate recipe JSONs");
    process.exit(1);
  }

  console.log("📦 Exporting recipes to UI...\n");

  // Get all JSON files from dist/
  const files = readdirSync(distDir).filter((file) => {
    return extname(file).toLowerCase() === ".json";
  });

  if (files.length === 0) {
    console.error("❌ Error: No JSON files found in dist/!");
    console.error("   Run 'npm run build:recipes' first to generate recipe JSONs");
    process.exit(1);
  }

  const allRecipes: Recipe[] = [];

  files.forEach((file) => {
    const filePath = join(distDir, file);
    console.log(`📄 Loading: ${file}...`);
    const content = readFileSync(filePath, "utf-8");
    const recipes = JSON.parse(content) as Recipe[];
    console.log(`   ✓ Loaded ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}`);
    allRecipes.push(...recipes);
  });

  // Extract unique categories
  const categories = Array.from(new Set(allRecipes.map((r) => r.category))).sort();

  // Create merged collection
  const collection: RecipeCollection = {
    version: "1.0.0",
    totalRecipes: allRecipes.length,
    categories,
    recipes: allRecipes,
    generatedAt: new Date().toISOString(),
  };

  // Save recipes.json
  writeFileSync(outputPath, JSON.stringify(collection, null, 2), "utf-8");

  console.log(`\n✅ Export complete!`);
  console.log(`   Exported ${allRecipes.length} recipes across ${categories.length} categories`);
  console.log(`   Output: ui/public/recipes.json`);
};

exportRecipes();
