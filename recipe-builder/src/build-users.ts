import { readFileSync, writeFileSync, readdirSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildUsers = () => {
  const usersPath = join(__dirname, "../data/users/users.json");
  const photosDir = join(__dirname, "../data/users/photos");
  const outputPath = join(__dirname, "../../ui/public/users.json");
  const outputPhotosDir = join(__dirname, "../../ui/public/users");

  console.log("👥 Building users database...");

  try {
    const raw = JSON.parse(readFileSync(usersPath, "utf-8"));
    const names: string[] = Array.isArray(raw)
      ? raw.map((u) => (typeof u === "string" ? u : u?.name)).filter((n) => typeof n === "string" && n.length > 0)
      : [];

    console.log(`   Found ${names.length} users: ${names.join(", ")}`);

    writeFileSync(outputPath, JSON.stringify(names, null, 2), "utf-8");
    console.log(`💾 Saved users database to users.json`);

    if (existsSync(photosDir)) {
      if (!existsSync(outputPhotosDir)) {
        mkdirSync(outputPhotosDir, { recursive: true });
      }
      const photoFiles = readdirSync(photosDir);
      console.log(`\n📸 Copying user photos...`);
      photoFiles.forEach((file) => {
        copyFileSync(join(photosDir, file), join(outputPhotosDir, file));
        console.log(`   ✓ Copied: ${file}`);
      });
      console.log(`💾 Copied ${photoFiles.length} photo(s) to ui/public/users/`);
    }

    console.log("✨ Users build complete!");
    return names;
  } catch (error) {
    console.error("❌ Error building users:", error);
    process.exit(1);
  }
};

buildUsers();
