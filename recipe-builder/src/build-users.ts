import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { User } from "../../ui/src/types/recipe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildUsers = () => {
  const usersPath = join(__dirname, "../data/users/users.json");
  const outputPath = join(__dirname, "../../ui/public/users.json");

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
    console.log("✨ Users build complete!");

    return usersMap;
  } catch (error) {
    console.error("❌ Error building users:", error);
    process.exit(1);
  }
};

buildUsers();
