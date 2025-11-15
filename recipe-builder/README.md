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

# Clean generated files
yarn clean
```

## What it does

1. Scans `../data/` for `.md` and `.json` recipe files
2. Parses markdown into structured JSON
3. Validates recipes for data quality
4. Outputs to `../ui/public/recipes/` and `../ui/public/recipes.json`

## Structure

- `src/build-recipes.ts` - Main build script
- `src/clean.ts` - Clean generated files
- `src/tsconfig.json` - TypeScript configuration
