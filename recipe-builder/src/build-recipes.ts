import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from "fs";
import { join, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import MarkdownIt from "markdown-it";
import type {
  Recipe,
  RecipeCollection,
  Comment,
  IngredientSection,
} from "../../ui/src/types/recipe.js";

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

  // No user specified, default to Christine
  return {
    user: "Christine",
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
  let currentSection = "";
  let firstElement = true;
  let category = "";
  let recipeCounter = 0;

  tokens.forEach((token: unknown) => {
    const tkn = token as { type: string; tag: string; content: string };
    if (tkn.type === "heading_open" && tkn.tag === "h1") {
      isH1 = true;
    } else if (tkn.type === "heading_close" && tkn.tag === "h1") {
      isH1 = false;
    } else if (tkn.type === "heading_open" && tkn.tag === "h2") {
      if (currentRecipe && currentRecipe.title) {
        parsedRecipes.push(currentRecipe as Recipe);
      }
      currentRecipe = {
        id: `recipe-${++recipeCounter}`,
        category: category || "Uncategorized",
        ingredients: [],
        instructions: [],
        tips: [],
        info: [],
        comments: [],
      };
      isH2 = true;
      currentSection = "";
    } else if (tkn.type === "heading_close" && tkn.tag === "h2") {
      isH2 = false;
    } else if (tkn.type === "heading_open" && tkn.tag === "h3") {
      isH3 = true;
      currentSection = "";
    } else if (tkn.type === "heading_close" && tkn.tag === "h3") {
      isH3 = false;
    } else if (tkn.type === "inline" && tkn.content) {
      if (isH1) {
        category = tkn.content;
      }
      if (isH2) {
        currentRecipe!.title = tkn.content;
      } else if (isH3) {
        if (tkn.content.startsWith("Zutaten")) {
          currentSection = "ingredients";
          // Extract servings from "Zutaten (für X Portionen)" format
          const servingsMatch = tkn.content.match(/\(für (.+?)\)/);
          if (servingsMatch) {
            currentRecipe!.servings = servingsMatch[1];
          }
        } else if (
          tkn.content.startsWith("Zubereitung") ||
          tkn.content.startsWith("Zubereitungszeit")
        ) {
          currentSection = "instructions";
        } else if (tkn.content.startsWith("Kommentar")) {
          currentSection = "comments";
        } else if (tkn.content.startsWith("Tipp")) {
          currentSection = "tips";
        } else if (tkn.content.startsWith("Info")) {
          currentSection = "info";
        }
        firstElement = true;
      }

      if (firstElement) {
        firstElement = false;
      } else {
        if (currentSection === "ingredients") {
          const lines = tkn.content
            .trim()
            .split("\n")
            .filter((x: string) => x !== "");

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
                title: sectionMatch[1].replace(/:\s*$/, ""), // Remove trailing colon
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
        } else if (currentSection === "instructions") {
          const instructions = tkn.content.trim().split("\n");
          if (
            instructions.length >= 1 &&
            (instructions[0].toLowerCase().includes("minute") ||
              instructions[0].toLowerCase().includes("stunde") ||
              instructions[0].toLowerCase().includes("std") ||
              instructions[0].toLowerCase().includes("min")) &&
            instructions[0].length <= 40
          ) {
            currentRecipe!.duration = instructions[0];
            instructions.shift();
          }
          instructions
            .filter((x: string) => x !== "")
            .forEach((instruction: string) => {
              // Check if this instruction looks like a comment (User: text pattern)
              if (instruction.match(/^[^:]+:\s*.+$/)) {
                currentRecipe!.comments!.push(parseComment(instruction));
              } else {
                currentRecipe!.instructions!.push(instruction);
              }
            });
        } else if (currentSection === "comments") {
          const comments = tkn.content
            .trim()
            .split("\n")
            .filter((x: string) => x !== "");
          comments.forEach((commentText: string) => {
            currentRecipe!.comments!.push(parseComment(commentText));
          });
        } else if (currentSection === "tips") {
          const tips = tkn.content
            .trim()
            .split("\n")
            .filter((x: string) => x !== "");
          tips.forEach((tip: string) => {
            currentRecipe!.tips!.push(tip);
          });
        } else if (currentSection === "info") {
          const info = tkn.content
            .trim()
            .split("\n")
            .filter((x: string) => x !== "");
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

const cleanRecipes = (recipes: Recipe[]): Recipe[] => {
  return recipes.map((recipe) => {
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
};

const buildRecipes = () => {
  const recipesDir = join(__dirname, "../data");
  const outputPath = join(__dirname, "../../ui/public/recipes.json");

  console.log("📂 Scanning recipes directory...");

  // Get all .md and .json files from recipes directory (excluding README files)
  const files = readdirSync(recipesDir).filter((file) => {
    const ext = extname(file).toLowerCase();
    const isReadme = file.toLowerCase().includes("readme");
    return (ext === ".md" || ext === ".json") && !isReadme;
  });

  console.log(`Found ${files.length} recipe files to process`);

  const allRecipes: Recipe[] = [];

  files.forEach((file) => {
    const filePath = join(recipesDir, file);
    const ext = extname(file).toLowerCase();

    if (ext === ".md") {
      console.log(`📖 Processing markdown: ${file}...`);
      let markdown = readFileSync(filePath, "utf-8");

      // Remove BOM if present
      if (markdown.charCodeAt(0) === 0xfeff) {
        markdown = markdown.slice(1);
      }

      const recipes = parseMarkdown(markdown);
      const cleaned = cleanRecipes(recipes);

      // Add Christine as creator for Rezeptbuch.md recipes
      if (file.toLowerCase() === "rezeptbuch.md") {
        cleaned.forEach((recipe) => {
          recipe.creator = "Christine";
        });
      }

      console.log(`   ✓ Parsed ${cleaned.length} recipes from ${file}`);

      allRecipes.push(...cleaned);
    } else if (ext === ".json") {
      console.log(`📄 Loading JSON: ${file}...`);
      const content = readFileSync(filePath, "utf-8");
      const recipes = JSON.parse(content) as Recipe[];
      const cleaned = cleanRecipes(recipes);
      console.log(`   ✓ Loaded ${cleaned.length} recipes from ${file}`);

      allRecipes.push(...cleaned);
    }
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

  console.log(
    `✅ Processed ${allRecipes.length} total recipes across ${categories.length} categories`
  );

  // Save recipes.json
  writeFileSync(outputPath, JSON.stringify(collection, null, 2), "utf-8");

  console.log(`💾 Saved recipes to recipes.json`);
  console.log("✨ Build complete!");
};

buildRecipes();
