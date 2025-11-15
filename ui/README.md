# Recipe App

A modern React application for browsing and searching a collection of 2,047+ German recipes.

## Features

- 🔍 **Advanced Search**: Multi-term search across recipe titles and ingredients
- 🗂️ **Category Filtering**: Filter recipes by 16 categories (Vorspeisen, Pizza, Salate, etc.)
- 📱 **Responsive Design**: Mobile-friendly interface with Bootstrap
- ⚡ **Fast Performance**: Pre-built JSON data for instant loading (no runtime markdown parsing)
- 🏷️ **Categorized**: Organized into 16 categories with visual badges
- 📄 **Pagination**: Easy navigation through large recipe collection
- 💬 **User Comments**: Structured comments with user attribution
- ✅ **Type-Safe**: Full TypeScript support with strict types

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Bootstrap 5** for styling
- **markdown-it** for parsing recipe markdown

## Development

### Prerequisites

- Node.js 22+
- Yarn package manager

### Setup

```bash
cd ui
yarn install
```

### Available Scripts

#### `yarn start`
Runs the app in development mode at [http://localhost:5173](http://localhost:5173)

#### `yarn recipes`
Builds and validates recipes from markdown:
- Parses `public/Rezeptbuch.md` into `public/recipes.json`
- Validates all recipes for required fields
- Reports data quality issues

#### `yarn recipes:build`
Only builds recipes JSON from markdown (no validation)

#### `yarn recipes:validate`
Only validates the existing recipes JSON

#### `yarn build`
Builds the app for production to the `dist` folder

#### `yarn build:prod`
Full production build (recipes → compile → build)


## Data Management

### Recipe Data Flow

```
Rezeptbuch.md (source)
    ↓ (parse with markdown-it)
recipes.json (generated)
    ↓ (loaded by app)
React App (runtime)
```

### Recipe Format

Recipes in markdown follow this structure:

```markdown
# Category Name

## Recipe Title
### Zutaten (für X Portionen)
- Ingredient 1
- Ingredient 2

### Zubereitungszeit
XX Minuten

### Zubereitung
1. Instruction 1
2. Instruction 2

### Tipp (optional)
- Tip text

### Info (optional)
- Info text

### Kommentar (optional)
Personal comment
```

### TypeScript Types

```typescript
interface Recipe {
  id: string;
  title: string;
  category: string;
  duration?: string;
  servings?: number;
  ingredients: string[];
  instructions: string[];
  tips?: string[];
  info?: string[];
  comments?: string[];
}
```

## Release Process

Releases are managed through **GitHub Actions** workflow.

### Creating a Release

1. Go to **Actions** tab in GitHub
2. Select **"Release"** workflow
3. Click **"Run workflow"**
4. Choose:
   - **Release type**: patch (0.3.1), minor (0.4.0), or major (1.0.0)
   - **Version**: Or specify a custom version (e.g., 0.4.0)
5. Click **"Run workflow"**

The workflow will automatically:
1. ✅ Update package.json version
2. 📖 Build recipes from markdown
3. ✅ Validate recipes
4. 🔨 Build production app
5. 💾 Commit changes to main
6. 🏷️ Create git tag (e.g., `v0.4.0`)
7. 📦 Create GitHub Release
8. 🚀 Trigger deployment to GitHub Pages

### Manual Release (Alternative)

You can also create a release manually:

```bash
# Update version in package.json manually
# Then commit and tag
git add .
git commit -m "Release v0.4.0"
git tag -a v0.4.0 -m "Release v0.4.0"
git push origin main --tags
```

This will trigger the deployment workflow.

## Project Structure

```
ui/
├── public/
│   ├── Rezeptbuch.md      # Source recipe data (2,047 recipes)
│   └── recipes.json       # Generated JSON (built from markdown)
├── scripts/
│   ├── build-recipes.ts   # Markdown → JSON parser
│   └── validate-recipes.ts # Recipe data validator
├── src/
│   ├── types/
│   │   └── recipe.ts      # TypeScript interfaces
│   ├── App.tsx            # Main app component
│   ├── RecipeList.tsx     # Recipe list with search/pagination
│   └── index.tsx          # Entry point
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

## Deployment

The app is automatically deployed to GitHub Pages via GitHub Actions when:
- Code is pushed to `main` branch
- A new tag is created (e.g., via `yarn release`)

See [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) for deployment configuration.

## Contributing

When adding new recipes:

1. Edit `public/Rezeptbuch.md` following the format above
2. Run `yarn recipes` to build and validate
3. Test locally with `yarn start`
4. Commit changes and use `yarn release` to publish

## License

Private project
