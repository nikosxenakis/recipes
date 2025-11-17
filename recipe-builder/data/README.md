# Recipe Builder Data

This folder contains the source data for the recipe collection.

## Folder Structure

```
data/
├── recipes/         # All recipe source files (markdown, JSON, CSV)
│   ├── Rezeptbuch.md           # Markdown recipes
│   ├── example-recipe.json     # JSON recipes
│   └── recipe-example2.csv     # CSV for import
└── users/          # User data
    └── users.json   # User database with photos

dist/ (gitignored)   # Auto-generated during build:recipes
├── example-recipe.json         # Copied from data/recipes/
├── example-recipes.json        # Converted from CSV
└── Rezeptbuch.json             # Converted from MD
```

**Note:** The `dist/` folder is auto-generated when you run `npm run build:recipes`. All source files (JSON, CSV, MD) from `data/recipes/` are transformed into JSON format in `dist/`.

## Recipes Folder (`data/recipes/`)

Contains all recipe source files in any format (markdown, CSV, etc.).

### Markdown Format (Rezeptbuch.md)

Recipes written in markdown with a specific structure:
- H1: Category name
- H2: Recipe title
- H3: Sections (Zutaten, Zubereitung, Kommentar, etc.)

Example:
```markdown
# Kuchen

## Apfelkuchen

### Zutaten (für 8 Portionen)
- 500g Mehl
- 200g Zucker
- 3 Äpfel

### Zubereitung
30-40 Minuten bei 180°C
Den Teig vorbereiten...

### Kommentar
Christine: Sehr lecker!
```

### CSV Format

CSV files can be placed in `data/recipes/` and will be automatically converted to JSON during build. These are typically Google Form exports.

The CSV must have a header row with columns like:
- Timestamp, Title, Ingredients, Category, Instructions, Servings, Creator, Tips, Photo

Example CSV:
```csv
"Timestamp","Title","Ingredients","Category","Instructions","Servings","Creator","Tips","Photo"
"2025/11/17 10:30:00","Greek Salad","200g Tomatoes
100g Feta","Salads","Mix ingredients","4","Maria","Best fresh","https://..."
```

CSV files are automatically parsed and converted to JSON during `npm run build:recipes`.

## Users Folder (`users/`)

Contains user database file.

### users.json

Array of user objects with name and optional photo:

```json
[
  {
    "name": "Christine",
    "photo": "christine.jpg"
  },
  {
    "name": "Nikos",
    "photo": "nikos.jpg"
  }
]
```

**Important Notes:**
- User names are used as IDs and must match exactly in recipes and comments
- Photo filenames should match files in `ui/public/users/`
- Comments in recipes can reference users by name (e.g., "Christine: Great recipe!")
- If a user doesn't exist in users.json, they'll be created without a photo

## Building

The build workflow has two main steps:

```bash
cd recipe-builder
npm run build         # Full build: users → recipes → export
npm run build:users   # Step 1: Build users database
npm run build:recipes # Step 2: Parse source files and generate JSONs in dist/
npm run export        # Step 3: Combine dist/ JSONs into ui/public/recipes.json
```

### Build Process Steps:

1. **`npm run build:users`** - Builds `ui/public/users.json` from `data/users/users.json`

2. **`npm run build:recipes`** - Parses all source files in `data/recipes/` and generates individual JSONs in `dist/`:
   - **JSON files** → Copied to `dist/` as-is
   - **CSV files** → Converted to JSON with same basename (e.g., `example-recipes.csv` → `example-recipes.json`)
   - **MD files** → Parsed and converted to JSON with same basename (e.g., `Rezeptbuch.md` → `Rezeptbuch.json`)

3. **`npm run export`** - Combines all JSONs from `dist/` into a single `ui/public/recipes.json` file

## Adding New Data

### Adding Recipes

Simply add your recipe file to `data/recipes/` in any supported format (MD, JSON, or CSV) and run `npm run build`:

**Option 1: Markdown (.md)**
1. Create a `.md` file in `data/recipes/`
2. Run `npm run build`
3. The MD will be converted to `{filename}.json` in `dist/`

**Option 2: JSON (.json)**
1. Create a `.json` file in `data/recipes/`
2. Run `npm run build`
3. The JSON will be copied to `dist/`

**Option 3: CSV (.csv) - Google Forms Export**
1. Place CSV file in `data/recipes/`
2. Run `npm run build`
3. The CSV will be converted to `{filename}.json` in `dist/`

### Adding Users
1. Add entry to `data/users/users.json`
2. Add photo to `ui/public/users/` (optional)
3. Run `npm run build`
