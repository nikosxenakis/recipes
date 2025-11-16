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
# 1. Generate recipe data
cd recipe-builder && yarn build

# 2. Start development server
cd ../ui && yarn start

# 3. Build for production
cd ../ui && yarn build
```

## 📝 Adding Recipes

### Option 1: Google Form (Recommended)

Use our [Recipe Submission Form](https://docs.google.com/forms/d/13e0Xg_iriYidQaxAbvvsUv-4fin-sbCFkG5sr4GcOg0/edit#responses) to submit new recipes.

**Note:** Submitted recipes are reviewed and added regularly to the collection.

### Option 2: JSON Format

Create `.json` files in `recipe-builder/data/` folder:

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

## TODO

- Recipe photos
