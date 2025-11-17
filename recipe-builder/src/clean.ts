import { rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clean = () => {
  console.log("🧹 Cleaning generated files...");

  const recipesJson = join(__dirname, "../../ui/public/recipes.json");
  const usersJson = join(__dirname, "../../ui/public/users.json");
  const usersDir = join(__dirname, "../../ui/public/users");

  // Remove recipes.json
  rmSync(recipesJson, { force: true });
  console.log("   ✓ Removed ui/public/recipes.json");

  // Remove users.json
  rmSync(usersJson, { force: true });
  console.log("   ✓ Removed ui/public/users.json");

  // Remove users directory
  rmSync(usersDir, { force: true, recursive: true });
  console.log("   ✓ Removed ui/public/users/ directory");

  // Remove dist directory
  rmSync(join(__dirname, "../dist"), { force: true, recursive: true });
  console.log("   ✓ Removed dist/ directory");

  console.log("✨ Clean complete!");
};

clean();
