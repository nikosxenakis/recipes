# 🍳 Recipe App

A modern recipe management application built with React and TypeScript. Browse, search, and organize your favorite recipes.

## 🚀 Live Demo

[https://nikosxenakis.github.io/recipes/](https://nikosxenakis.github.io/recipes/)

## 🛠️ Development

### Prerequisites

- Node.js 22+
- pnpm package manager

### Setup

```bash
# Install all dependencies (single command at workspace root)
pnpm install
```

### Workflow

```bash
# 1. Build recipe data (parses MD/CSV/JSON → dist/ → ui/public/recipes.json)
pnpm --filter recipes build

# 2. Start development server
pnpm --filter recipe-app start

# 3. Build for production
pnpm --filter recipe-app build
```

### Build Steps Explained

The `pnpm --filter recipes build` command runs three steps in the recipe-builder package:

1. `build:users` - Builds user database from `data/users/users.json`
2. `build:recipes` - Parses all source files (MD/CSV/JSON) from `data/recipes/` into `dist/`
3. `export` - Combines all `dist/` JSONs into `ui/public/recipes.json`

## 📝 Adding Recipes

### Option 1: Google Form (Recommended)

Use our [Recipe Submission Form](https://forms.gle/GC1GtuCSwFZEyE69A) to submit new recipes.

**Note:** Submitted recipes are reviewed and added regularly to the collection.

### Option 2: Direct File Addition

Add recipe files directly to `recipe-builder/data/recipes/` in any format:

**Markdown (.md)**, **JSON (.json)**, or **CSV (.csv)**

Example JSON format:

```json
[
  {
    "id": "unique-id",
    "title": "Recipe Name",
    "category": "Category",
    "creator": "Recipe Author",
    "createdAt": "2025-11-15T10:00:00Z",
    "servings": "4 Portionen",
    "duration": "30 Minuten",
    "ingredients": [
      {
        "items": ["ingredient 1", "ingredient 2"]
      }
    ],
    "instructions": ["step 1", "step 2"]
  }
]
```

## 🎨 Features

- **Search & Filter**: Find recipes by name, ingredients, category, cooking time, or creator
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Recipe Sharing**: Copy links to share specific recipes
- **Dark Mode**: Toggle between light and dark themes
- **User Profiles**: See who created each recipe with photos and avatars
- **Recipe Photos**: Display photos for recipes when available
- **Recipe Importer**: Import recipes from Google Forms CSV exports
- **Creator Filter**: Filter recipes by their creator

## TODO
Offer sorting
Add recipe url
Keep screen awake option for mobile
Expand recipe option
Create new logo
Add ingredient filtering
Split portion and ingredient
Add recipe rating
