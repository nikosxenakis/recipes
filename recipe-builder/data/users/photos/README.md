# User Photos

This directory contains user profile photos.

## Adding User Photos

1. Add the photo file to this directory (e.g., `john.jpg`)
2. Update `../users.json` to reference the photo:
   ```json
   {
     "name": "John",
     "photo": "john.jpg"
   }
   ```
3. Run `npm run build` from the recipe-builder directory
4. The photo will be automatically copied to `ui/public/users/`

## Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)

## Notes

- Photo filenames should match exactly what's specified in `users.json`
- Keep file sizes reasonable (< 1MB recommended)
- Square photos work best for avatars
