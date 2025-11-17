# Recipe CSV Import

The recipe builder automatically imports recipes from Google Forms CSV exports during the build process.

## How to Use

### 1. Export Google Form Responses

1. Open your Google Form responses
2. Click on the three dots menu (⋮) in the top right
3. Select "Download responses (.csv)"
4. Save the CSV file (e.g., `form-responses.csv`)

### 2. Add CSV to Data Folder

Simply place the CSV file in the `data/recipes/` folder:

```bash
cp ~/Downloads/form-responses.csv recipe-builder/data/recipes/
```

### 3. Build

The CSV will be automatically converted to JSON during build:

```bash
cd recipe-builder
npm run build
```

The build process will:
1. Parse the CSV file
2. Convert each recipe to JSON format
3. Save as `{filename}.json` in `dist/` (e.g., `form-responses.csv` → `form-responses.json`)
4. Combine with other recipes into `ui/public/recipes.json`

## Google Form Format

The importer expects the following columns in the CSV (column names are flexible):

| Column | Variations | Required | Description |
|--------|-----------|----------|-------------|
| Title | titel, title, name | ✅ Yes | Recipe name |
| Category | kategorie, category | ✅ Yes | Recipe category (e.g., "Hauptgerichte", "Desserts") |
| Ingredients | zutat, ingredient | ✅ Yes | Ingredients list (one per line) |
| Instructions | zubereitung, anleitung, instruction | ✅ Yes | Step-by-step instructions (one per line) |
| Creator | ersteller, creator, author | ❌ No | Person who created the recipe |
| Servings | portionen, servings | ❌ No | Number of servings (e.g., "4 Portionen") |
| Duration | dauer, duration, zeit | ❌ No | Cooking time (e.g., "30 Minuten") |
| Photo | foto, photo, bild, image | ❌ No | URL to recipe photo |
| Tips | tipp, tip | ❌ No | Helpful tips (one per line) |
| Info | info, hinweis | ❌ No | Additional information (one per line) |
| Timestamp | timestamp, zeitstempel | ❌ Auto | Creation date (auto-generated if missing) |

## Ingredient Sections

The importer supports ingredient sections. To create sections, use section headers followed by a colon:

```
Für den Teig:
400g Mehl
250ml Wasser
1 TL Salz

Für die Füllung:
200g Käse
100g Schinken
```

This will be converted to:
```json
{
  "ingredients": [
    {
      "title": "Für den Teig",
      "items": ["400g Mehl", "250ml Wasser", "1 TL Salz"]
    },
    {
      "title": "Für die Füllung",
      "items": ["200g Käse", "100g Schinken"]
    }
  ]
}
```

## Example Google Form Questions

Here's a suggested form structure:

1. **Rezeptname** (Short answer)
2. **Kategorie** (Dropdown: Vorspeisen, Hauptgerichte, Beilagen, Desserts, Getränke, Sonstiges)
3. **Portionen** (Short answer, e.g., "4 Portionen")
4. **Zubereitungszeit** (Short answer, e.g., "30 Minuten")
5. **Foto URL** (Short answer - optional, URL to recipe photo)
6. **Zutaten** (Paragraph - one ingredient per line)
7. **Zubereitung** (Paragraph - one step per line)
8. **Tipps** (Paragraph - optional)
9. **Zusätzliche Informationen** (Paragraph - optional)
10. **Dein Name** (Short answer - optional)

## Output

CSV files are converted to JSON in `dist/`:

- Filename: `{csv-basename}.json` (e.g., `form-responses.csv` → `form-responses.json`)
- Format: Array of recipe objects (one array can contain multiple recipes from the same CSV)
- Recipe IDs: Auto-generated from recipe titles (lowercase, special chars removed)

Example output:
```json
[
  {
    "id": "spaghetti-carbonara",
    "title": "Spaghetti Carbonara",
    "category": "Hauptgerichte",
    "creator": "Maria",
    "createdAt": "2025-11-15T10:30:00Z",
    "servings": "4 Portionen",
    "duration": "25 Minuten",
    "photo": "https://example.com/photos/carbonara.jpg",
    "ingredients": [
      {
        "items": [
          "400g Spaghetti",
          "200g Pancetta",
          "4 Eigelb"
        ]
      }
    ],
    "instructions": [
      "Spaghetti kochen",
      "Pancetta braten",
      "Mit Ei-Käse-Mischung vermischen"
    ],
    "tips": [
      "Sauce nicht zu heiß werden lassen"
    ]
  }
]
```

## Troubleshooting

### "File not found" error
Make sure the CSV file path is correct and the file exists.

### Missing recipes
Check that the CSV has at least: Title, Ingredients, and Instructions columns.

### Encoding issues
If you see strange characters (ä, ö, ü), make sure the CSV is saved as UTF-8.

### Column names not recognized
The importer searches for common variations, but column names should include keywords like "title", "ingredient", "instruction", etc.
