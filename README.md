# 🍳 Recipe App

A modern, lightweight recipe management application built with React and TypeScript. Browse, search, and organize your favorite recipes with ease.

## ✨ Features

- 📖 **2000+ Recipes** - Extensive collection across 16 categories
- 🔍 **Smart Search** - Search by recipe name or ingredients
- 📱 **Responsive Design** - Works beautifully on all devices
- 💬 **Comments & Tips** - User comments and helpful cooking tips
- 🎨 **Clean UI** - Modern, intuitive interface with category badges
- ⚡ **Fast Performance** - Build-time data generation for instant loading

## 🚀 Live Demo

Visit the live app: [https://nikosxenakis.github.io/recipes/](https://nikosxenakis.github.io/recipes/)

## 📁 Project Structure

```
recipe-builder/        # Independent build tools
├── data/             # Recipe source files (markdown or JSON)
│   ├── Rezeptbuch.md # Main recipe collection
│   └── README.md     # Recipe folder documentation
├── src/              # Build and validation scripts
└── package.json      # Builder dependencies

ui/                    # React application
├── src/              # Source code
└── public/           # Static assets (recipes generated here)
```

## 🛠️ Development

### Prerequisites

- Node.js 22+
- Yarn package manager

### Setup

```bash
# Install recipe-builder dependencies
cd recipe-builder
yarn install

# Install UI dependencies
cd ../ui
yarn install
```

### Workflow

```bash
# 1. Generate recipe JSONs
cd recipe-builder
yarn build

# 2. Start UI development server
cd ../ui
yarn start

# 3. Build UI for production
cd ../ui
yarn build
```

### Build Process

The `recipe-builder` handles data generation:
1. Scans `recipe-builder/data/` folder for `.md` and `.json` files
2. Parses markdown recipes into structured JSON
3. Validates all recipes for data quality
4. Creates merged `recipes.json` in `ui/public/` for the app

## 📝 Adding Recipes

### Option 1: Markdown Format

Add recipes to existing markdown files in `recipe-builder/data/` folder:

```markdown
# Category Name

## Recipe Title

### Zutaten (für 4 Portionen)
Ingredient 1
Ingredient 2

### Zubereitung
30 Minuten
Step 1
Step 2

### Tipp
Helpful tip here

### Kommentar
User Name: This recipe is amazing!
```

### Option 2: JSON Format

Create `.json` files in `recipe-builder/data/` folder with this structure:

```json
[
  {
    "id": "unique-id",
    "title": "Recipe Name",
    "category": "Category",
    "servings": "4 Portionen",
    "duration": "30 Minuten",
    "ingredients": [
      {
        "title": "Optional section title",
        "items": ["ingredient 1", "ingredient 2"]
      }
    ],
    "instructions": ["step 1", "step 2"],
    "tips": ["tip 1"],
    "comments": [
      {
        "user": "Name",
        "text": "Comment text"
      }
    ]
  }
]
```

## 🚢 Deployment

The app automatically deploys to GitHub Pages on every push to `main`:

1. Generates recipe JSONs via `recipe-builder`
2. Builds the React app
3. Creates a new release (major version bump)
4. Deploys to GitHub Pages

## 🔧 Technology Stack

- **Frontend**: React 19.2.0, TypeScript 5.9.3
- **Build Tool**: Vite 7.2.2
- **Styling**: Bootstrap 5.3.8 + Custom CSS
- **Parser**: markdown-it 14.1.0
- **CI/CD**: GitHub Actions

## 📄 License

This project is open source and available for personal use.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new recipes
- Improve the UI/UX
- Report bugs or suggest features

---

Made with ❤️ and Claude Code
