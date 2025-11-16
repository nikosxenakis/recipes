# Recipe Builder Data

This folder contains the source data for the recipe collection.

## Folder Structure

```
data/
├── recipes/         # Recipe files (markdown and JSON)
│   ├── Rezeptbuch.md
│   └── example-recipe.json
└── users/          # User data
    └── users.json   # User database with photos
```

## Recipes Folder (`recipes/`)

Contains recipe files in markdown (.md) or JSON (.json) format.

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

### JSON Format (example-recipe.json)

Standard recipe JSON following the Recipe interface from `ui/src/types/recipe.ts`.

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

To process the data and generate the final recipe collection:

```bash
cd recipe-builder
npm run build         # Builds users, then recipes
npm run build:users   # Just build users database
npm run build:recipes # Just build recipes (requires users to be built first)
```

## Adding New Data

1. **Add a new recipe**: Create a `.md` file in `recipes/` folder
2. **Add a new user**: Add entry to `users/users.json` and photo to `ui/public/users/`
3. **Rebuild**: Run `npm run build` to regenerate the data
