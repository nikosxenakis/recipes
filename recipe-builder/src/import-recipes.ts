import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface GoogleFormResponse {
  timestamp: string;
  title: string;
  category: string;
  creator: string;
  servings?: string;
  duration?: string;
  ingredients: string;
  instructions: string;
  tips?: string;
  info?: string;
}

interface Recipe {
  id: string;
  title: string;
  category: string;
  creator?: string;
  createdAt?: string;
  servings?: string;
  duration?: string;
  ingredients: { title?: string; items: string[] }[];
  instructions: string[];
  tips?: string[];
  info?: string[];
}

function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseMultilineField(text: string): string[] {
  if (!text || text.trim() === '') return [];

  // Split by newlines and filter empty lines
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function parseIngredients(text: string): { title?: string; items: string[] }[] {
  if (!text || text.trim() === '') return [{ items: [] }];

  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const sections: { title?: string; items: string[] }[] = [];
  let currentSection: { title?: string; items: string[] } = { items: [] };

  for (const line of lines) {
    // Check if line looks like a section header (e.g., "Für die Sauce:", "Teig:")
    if (line.match(/^[A-ZÄÖÜ][^:]*:$/i) && !line.match(/^\d/)) {
      // Save current section if it has items
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        title: line.replace(/:$/, '').trim(),
        items: []
      };
    } else {
      // Add to current section
      currentSection.items.push(line);
    }
  }

  // Add final section
  if (currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : [{ items: [] }];
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

function parseGoogleFormCsv(csvContent: string): GoogleFormResponse[] {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const responses: GoogleFormResponse[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const response: any = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      const lowerHeader = header.toLowerCase();

      // Map Google Form headers to our fields
      if (lowerHeader.includes('timestamp') || lowerHeader.includes('zeitstempel')) {
        response.timestamp = value;
      } else if (lowerHeader.includes('titel') || lowerHeader.includes('title') || lowerHeader.includes('name')) {
        response.title = value;
      } else if (lowerHeader.includes('kategorie') || lowerHeader.includes('category')) {
        response.category = value;
      } else if (lowerHeader.includes('ersteller') || lowerHeader.includes('creator') || lowerHeader.includes('author')) {
        response.creator = value;
      } else if (lowerHeader.includes('portionen') || lowerHeader.includes('servings')) {
        response.servings = value;
      } else if (lowerHeader.includes('dauer') || lowerHeader.includes('duration') || lowerHeader.includes('zeit')) {
        response.duration = value;
      } else if (lowerHeader.includes('zutat') || lowerHeader.includes('ingredient')) {
        response.ingredients = value;
      } else if (lowerHeader.includes('zubereitung') || lowerHeader.includes('anleitung') || lowerHeader.includes('instruction')) {
        response.instructions = value;
      } else if (lowerHeader.includes('tipp') || lowerHeader.includes('tip')) {
        response.tips = value;
      } else if (lowerHeader.includes('info') || lowerHeader.includes('hinweis')) {
        response.info = value;
      }
    });

    if (response.title && response.ingredients && response.instructions) {
      responses.push(response as GoogleFormResponse);
    }
  }

  return responses;
}

function convertToRecipe(formResponse: GoogleFormResponse): Recipe {
  const recipe: Recipe = {
    id: generateId(formResponse.title),
    title: formResponse.title.trim(),
    category: formResponse.category?.trim() || 'Sonstiges',
    ingredients: parseIngredients(formResponse.ingredients),
    instructions: parseMultilineField(formResponse.instructions)
  };

  if (formResponse.creator?.trim()) {
    recipe.creator = formResponse.creator.trim();
  }

  if (formResponse.timestamp) {
    // Try to parse Google Form timestamp (usually in format: "MM/DD/YYYY HH:MM:SS")
    try {
      const date = new Date(formResponse.timestamp);
      if (!isNaN(date.getTime())) {
        recipe.createdAt = date.toISOString();
      }
    } catch (e) {
      // If parsing fails, use current time
      recipe.createdAt = new Date().toISOString();
    }
  } else {
    recipe.createdAt = new Date().toISOString();
  }

  if (formResponse.servings?.trim()) {
    recipe.servings = formResponse.servings.trim();
  }

  if (formResponse.duration?.trim()) {
    recipe.duration = formResponse.duration.trim();
  }

  const tips = parseMultilineField(formResponse.tips || '');
  if (tips.length > 0) {
    recipe.tips = tips;
  }

  const info = parseMultilineField(formResponse.info || '');
  if (info.length > 0) {
    recipe.info = info;
  }

  return recipe;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run import <csv-file-path>');
    console.error('');
    console.error('Example:');
    console.error('  npm run import ./form-responses.csv');
    console.error('');
    console.error('The CSV file should be exported from Google Forms.');
    process.exit(1);
  }

  const csvFilePath = args[0];

  if (!existsSync(csvFilePath)) {
    console.error(`Error: File not found: ${csvFilePath}`);
    process.exit(1);
  }

  console.log(`📥 Reading CSV file: ${csvFilePath}`);
  const csvContent = readFileSync(csvFilePath, 'utf-8');

  console.log('🔄 Parsing Google Form responses...');
  const formResponses = parseGoogleFormCsv(csvContent);
  console.log(`✅ Found ${formResponses.length} recipe(s)`);

  const outputDir = join(process.cwd(), 'data', 'recipes');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log('');
  formResponses.forEach((response, index) => {
    const recipe = convertToRecipe(response);
    const filename = `${recipe.id}.json`;
    const filepath = join(outputDir, filename);

    // Write as array with single recipe (matching existing format)
    writeFileSync(filepath, JSON.stringify([recipe], null, 2) + '\n', 'utf-8');

    console.log(`${index + 1}. ✅ Created: ${filename}`);
    console.log(`   Title: ${recipe.title}`);
    console.log(`   Category: ${recipe.category}`);
    if (recipe.creator) {
      console.log(`   Creator: ${recipe.creator}`);
    }
    console.log('');
  });

  console.log(`🎉 Successfully imported ${formResponses.length} recipe(s) to ${outputDir}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Review the generated JSON files');
  console.log('2. Run: npm run build');
  console.log('3. The recipes will be available in the UI');
}

main();
