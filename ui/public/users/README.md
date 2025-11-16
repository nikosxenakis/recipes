# User Photos

This folder contains profile photos for recipe creators and commentators.

## Adding a New User

1. Add the user to `recipe-builder/data/users/users.json`:
```json
{
  "name": "User Name",
  "photo": "filename.jpg"
}
```

2. Add the user's photo to this folder (`ui/public/users/filename.jpg`)
   - Recommended size: 200x200 pixels or larger (square)
   - Supported formats: JPG, PNG, WebP
   - Photos will be displayed as circular avatars

3. Rebuild the users database:
```bash
cd recipe-builder
npm run build:users
```

4. Then rebuild recipes to use the new user data:
```bash
npm run build:recipes
# Or just run both at once:
npm run build
```

## Current Users

- Christine (`christine.jpg`)
- Nikos (`nikos.jpg`)
- Hilde Siegl (`hilde.jpg`)

## Build Process

The build process works in two steps:

1. **`build:users`** - Reads `recipe-builder/data/users/users.json` and generates `ui/public/users.json` with a users database
2. **`build:recipes`** - Reads recipe files from `recipe-builder/data/recipes/` and loads the users database to build recipe data with User objects

## Folder Structure

```
recipe-builder/
├── data/
│   ├── recipes/         # Recipe markdown and JSON files
│   │   ├── Rezeptbuch.md
│   │   └── example-recipe.json
│   └── users/          # User data
│       └── users.json   # User database (edit this to add users)
└── src/
    ├── build-users.ts   # Builds user database
    └── build-recipes.ts # Builds recipe collection
```

## Notes

- If a user doesn't have a photo, a colored initial badge will be shown instead
- Photos are referenced in the recipe data using the filename from `users.json`
- Make sure photo filenames match exactly (case-sensitive)
- The `users.json` file in this folder is auto-generated - don't edit it directly!
