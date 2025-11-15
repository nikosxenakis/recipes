# Recipe Builder

Independent build tool for parsing and validating recipe data.

## Purpose

Converts markdown recipe files into structured JSON format with validation.

## Usage

```bash
# Install dependencies
yarn install

# Build recipes
yarn build

# Validate recipes
yarn validate

# Clean generated files
yarn clean
```

## What it does

1. Scans `data/` folder for `.md` and `.json` recipe files
2. Parses markdown into structured JSON
3. Merges all recipes into a single collection
4. Outputs to `../ui/public/recipes.json`

## Structure

- `data/` - Recipe source files (markdown or JSON)
- `src/build-recipes.ts` - Main build script
- `src/validate.ts` - Validate generated recipes
- `src/clean.ts` - Clean generated files
- `src/tsconfig.json` - TypeScript configuration
