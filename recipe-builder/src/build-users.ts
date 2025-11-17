import { readFileSync, writeFileSync, readdirSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { User } from "../../ui/src/types/recipe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildUsers = () => {
  const usersPath = join(__dirname, "../data/users/users.json");
  const photosDir = join(__dirname, "../data/users/photos");
  const outputPath = join(__dirname, "../../ui/public/users.json");
  const outputPhotosDir = join(__dirname, "../../ui/public/users");

  console.log("👥 Building users database...");

  try {
    // Read users.json
    const usersJson = readFileSync(usersPath, "utf-8");
    const usersArray = JSON.parse(usersJson) as User[];

    console.log(`   Found ${usersArray.length} users`);

    // Create users map for quick lookup
    const usersMap: Record<string, User> = {};
    usersArray.forEach((user) => {
      usersMap[user.name] = user;
      console.log(`   ✓ ${user.name}${user.photo ? ` (${user.photo})` : " (no photo)"}`);
    });

    // Save simplified version to public folder (just the map)
    writeFileSync(outputPath, JSON.stringify(usersMap, null, 2), "utf-8");
    console.log(`💾 Saved users database to users.json`);

    // Copy user photos to UI public folder
    if (existsSync(photosDir)) {
      // Ensure output directory exists
      if (!existsSync(outputPhotosDir)) {
        mkdirSync(outputPhotosDir, { recursive: true });
      }

      const photoFiles = readdirSync(photosDir);
      console.log(`\n📸 Copying user photos...`);

      photoFiles.forEach((file) => {
        const src = join(photosDir, file);
        const dest = join(outputPhotosDir, file);
        copyFileSync(src, dest);
        console.log(`   ✓ Copied: ${file}`);
      });

      console.log(`💾 Copied ${photoFiles.length} photo(s) to ui/public/users/`);
    }

    console.log("✨ Users build complete!");

    return usersMap;
  } catch (error) {
    console.error("❌ Error building users:", error);
    process.exit(1);
  }
};

buildUsers();
