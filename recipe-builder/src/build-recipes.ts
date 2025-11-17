import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync, existsSync } from "fs";
import { join, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import MarkdownIt from "markdown-it";
import type {
  Recipe,
  RecipeCollection,
  Comment,
  IngredientSection,
  User,
} from "../../ui/src/types/recipe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CSV Import Types and Functions
interface GoogleFormResponse {
  timestamp: string;
  title: string;
  category: string;
  creator: string;
  servings?: string;
  duration?: string;
  photo?: string;
  ingredients: string;
  instructions: string;
  tips?: string;
  info?: string;
}

function generateRecipeId(title: string): string {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseMultilineField(text: string): string[] {
  if (!text || text.trim() === '') return [];
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function parseIngredientsFromCsv(text: string): IngredientSection[] {
  if (!text || text.trim() === '') return [{ items: [] }];

  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const sections: IngredientSection[] = [];
  let currentSection: IngredientSection = { items: [] };

  for (const line of lines) {
    if (line.match(/^[A-ZÄÖÜ][^:]*:$/i) && !line.match(/^\d/)) {
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace(/:$/, '').trim(),
        items: []
      };
    } else {
      currentSection.items.push(line);
    }
  }

  if (currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : [{ items: [] }];
}

function parseCsvContent(csvContent: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvContent.length) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }

    i++;
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseGoogleFormCsv(csvContent: string): GoogleFormResponse[] {
  const rows = parseCsvContent(csvContent);

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0];
  const responses: GoogleFormResponse[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const response: any = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      const lowerHeader = header.toLowerCase();

      if (lowerHeader.includes('timestamp') || lowerHeader.includes('zeitstempel')) {
        response.timestamp = value;
      } else if (lowerHeader.includes('titel') || lowerHeader.includes('title') || lowerHeader.includes('name')) {
        response.title = value;
      } else if (lowerHeader.includes('kategorie') || lowerHeader.includes('category')) {
        response.category = value;
      } else if (lowerHeader.includes('ersteller') || lowerHeader.includes('creator') || lowerHeader.includes('author')) {
        response.creator = value;
      } else if (lowerHeader.includes('portionen') || lowerHeader.includes('servings')) {
        response.servings = value;
      } else if (lowerHeader.includes('dauer') || lowerHeader.includes('duration') || lowerHeader.includes('zeit')) {
        response.duration = value;
      } else if (lowerHeader.includes('foto') || lowerHeader.includes('photo') || lowerHeader.includes('bild') || lowerHeader.includes('image')) {
        response.photo = value;
      } else if (lowerHeader.includes('zutat') || lowerHeader.includes('ingredient')) {
        response.ingredients = value;
      } else if (lowerHeader.includes('zubereitung') || lowerHeader.includes('anleitung') || lowerHeader.includes('instruction')) {
        response.instructions = value;
      } else if (lowerHeader.includes('tipp') || lowerHeader.includes('tip')) {
        response.tips = value;
      } else if (lowerHeader.includes('info') || lowerHeader.includes('hinweis')) {
        response.info = value;
      }
    });

    if (response.title && response.ingredients && response.instructions) {
      responses.push(response as GoogleFormResponse);
    }
  }

  return responses;
}

function convertCsvToRecipe(formResponse: GoogleFormResponse): Recipe {
  const recipe: Recipe = {
    id: generateRecipeId(formResponse.title),
    title: formResponse.title.trim(),
    category: formResponse.category?.trim() || 'Sonstiges',
    ingredients: parseIngredientsFromCsv(formResponse.ingredients),
    instructions: parseMultilineField(formResponse.instructions)
  };

  if (formResponse.creator?.trim()) {
    recipe.creator = getUserObject(formResponse.creator.trim());
  }

  if (formResponse.timestamp) {
    try {
      const date = new Date(formResponse.timestamp);
      if (!isNaN(date.getTime())) {
        recipe.createdAt = date.toISOString();
      }
    } catch (e) {
      recipe.createdAt = new Date().toISOString();
    }
  } else {
    recipe.createdAt = new Date().toISOString();
  }

  if (formResponse.servings?.trim()) {
    recipe.servings = formResponse.servings.trim();
  }

  if (formResponse.duration?.trim()) {
    recipe.duration = formResponse.duration.trim();
  }

  if (formResponse.photo?.trim()) {
    recipe.photo = formResponse.photo.trim();
  }

  const tips = parseMultilineField(formResponse.tips || '');
  if (tips.length > 0) {
    recipe.tips = tips;
  }

  const info = parseMultilineField(formResponse.info || '');
  if (info.length > 0) {
    recipe.info = info;
  }

  return recipe;
}

// Load users from built users.json file
const loadUsers = (): Record<string, User> => {
  const usersPath = join(__dirname, "../../ui/public/users.json");
  try {
    const usersJson = readFileSync(usersPath, "utf-8");
    const usersMap = JSON.parse(usersJson) as Record<string, User>;
    const userCount = Object.keys(usersMap).length;
    console.log(`👥 Loaded ${userCount} users from database`);
    return usersMap;
  } catch (error) {
    console.warn("⚠️  Could not load built users.json, using empty user database");
    console.warn("   Run 'npm run build:users' first to build the users database");
    return {};
  }
};

const USERS = loadUsers();

const getUserObject = (userName: string): User => {
  // Check if user exists in database
  if (USERS[userName]) {
    return USERS[userName];
  }
  // Create user object without photo for unknown users
  return { name: userName };
};

const parseComment = (commentText: string): Comment => {
  // Check if comment has format "User: Comment text"
  const match = commentText.match(/^([^:]+):\s*(.+)$/);

  if (match) {
    return {
      user: getUserObject(match[1].trim()),
      text: match[2].trim(),
    };
  }

  // No user specified, default to Christine
  return {
    user: getUserObject("Christine"),
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

const normalizeRecipes = (recipes: Recipe[]): Recipe[] => {
  return recipes.map((recipe) => {
    const normalized: any = { ...recipe };

    // Convert string creators to User objects
    if (normalized.creator && typeof normalized.creator === 'string') {
      normalized.creator = getUserObject(normalized.creator);
    }

    // Convert string comment users to User objects
    if (normalized.comments && Array.isArray(normalized.comments)) {
      normalized.comments = normalized.comments.map((comment: Comment) => {
        if (typeof comment.user === 'string') {
          return {
            ...comment,
            user: getUserObject(comment.user)
          };
        }
        return comment;
      });
    }

    return normalized as Recipe;
  });
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
  const dataRecipesDir = join(__dirname, "../data/recipes");
  const distDir = join(__dirname, "../dist");

  // Ensure dist directory exists
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  console.log("📋 Building recipes from sources...\n");

  // Get all files from data/recipes
  const files = readdirSync(dataRecipesDir).filter((file) => {
    const isReadme = file.toLowerCase().includes("readme");
    return !isReadme;
  });

  let totalRecipesGenerated = 0;
  const processedFiles: string[] = [];

  files.forEach((file) => {
    const filePath = join(dataRecipesDir, file);
    const ext = extname(file).toLowerCase();
    const baseName = basename(file, ext);

    if (ext === ".json") {
      // Parse JSON and normalize (convert string creators/users to User objects)
      const content = readFileSync(filePath, "utf-8");
      const recipes = JSON.parse(content) as Recipe[];
      const normalized = normalizeRecipes(recipes);
      const cleaned = cleanRecipes(normalized);

      const dest = join(distDir, file);
      writeFileSync(dest, JSON.stringify(cleaned, null, 2) + '\n', 'utf-8');
      console.log(`📄 Processed JSON: ${file} (${cleaned.length} recipe${cleaned.length !== 1 ? 's' : ''})`);
      totalRecipesGenerated += cleaned.length;
      processedFiles.push(file);
    } else if (ext === ".csv") {
      // Parse CSV and convert to JSON
      const csvContent = readFileSync(filePath, 'utf-8');
      const formResponses = parseGoogleFormCsv(csvContent);

      if (formResponses.length > 0) {
        const jsonFilename = `${baseName}.json`;
        const jsonPath = join(distDir, jsonFilename);
        const recipes = formResponses.map(response => convertCsvToRecipe(response));
        writeFileSync(jsonPath, JSON.stringify(recipes, null, 2) + '\n', 'utf-8');
        console.log(`📊 Converted CSV: ${file} → ${jsonFilename} (${recipes.length} recipe${recipes.length !== 1 ? 's' : ''})`);
        totalRecipesGenerated += recipes.length;
        processedFiles.push(jsonFilename);
      }
    } else if (ext === ".md") {
      // Parse markdown and convert to JSON
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
          recipe.creator = getUserObject("Christine");
        });
      }

      const jsonFilename = `${baseName}.json`;
      const jsonPath = join(distDir, jsonFilename);
      writeFileSync(jsonPath, JSON.stringify(cleaned, null, 2) + '\n', 'utf-8');
      console.log(`📖 Converted MD: ${file} → ${jsonFilename} (${cleaned.length} recipe${cleaned.length !== 1 ? 's' : ''})`);
      totalRecipesGenerated += cleaned.length;
      processedFiles.push(jsonFilename);
    }
  });

  console.log(`\n✅ Build complete!`);
  console.log(`   Generated ${totalRecipesGenerated} recipes in ${processedFiles.length} JSON files`);
  console.log(`   Output: dist/`);
};

buildRecipes();
