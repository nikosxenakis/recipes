import { rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clean = () => {
  console.log('🧹 Cleaning generated files...');

  const recipesDir = join(__dirname, '../../ui/public/recipes');
  const recipesJson = join(__dirname, '../../ui/public/recipes.json');

  // Remove recipes directory
  rmSync(recipesDir, { recursive: true, force: true });
  console.log('   ✓ Removed ui/public/recipes/');

  // Remove recipes.json
  rmSync(recipesJson, { force: true });
  console.log('   ✓ Removed ui/public/recipes.json');

  console.log('✨ Clean complete!');
};

clean();
