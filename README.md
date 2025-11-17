# 🍳 Recipe App

A modern recipe management application built with React and TypeScript. Browse, search, and organize your favorite recipes.

## 🚀 Live Demo

[https://nikosxenakis.github.io/recipes/](https://nikosxenakis.github.io/recipes/)

## 🛠️ Development

### Prerequisites

- Node.js 22+
- Yarn package manager

### Setup

```bash
# Install all dependencies
cd recipe-builder && yarn install
cd ../ui && yarn install
```

### Workflow

```bash
# 1. Build recipe data (parses MD/CSV/JSON → dist/ → ui/public/recipes.json)
cd recipe-builder && npm run build

# 2. Start development server
cd ../ui && yarn start

# 3. Build for production
cd ../ui && yarn build
```

### Build Steps Explained

The `npm run build` command in recipe-builder runs three steps:
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

- **Search & Filter**: Find recipes by name, ingredients, category, or cooking time
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Recipe Sharing**: Copy links to share specific recipes
- **Dark Mode**: Toggle between light and dark themes
- **User Profiles**: See who created each recipe with photos and avatars
- **Recipe Photos**: Display photos for recipes when available
- **Recipe Importer**: Import recipes from Google Forms CSV exports

## TODO

- multiple languages support
