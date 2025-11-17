export interface User {
  name: string; // Used as ID
  photo?: string; // Relative path to photo in /users folder, e.g., "christine.jpg"
}

export interface Comment {
  user?: User | string; // Support both new User object and legacy string format
  text: string;
}

export interface IngredientSection {
  title?: string; // e.g., "Für die Sauce", "Für die Rollen"
  items: string[];
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  duration?: string;
  servings?: string; // Changed from number to string to support text like "4 Personen", "2-3 Portionen", etc.
  difficulty?: 'einfach' | 'mittel' | 'schwer';
  tags?: string[];
  creator?: User | string; // Support both new User object and legacy string format
  createdAt?: string; // ISO 8601 date string
  photo?: string; // URL to recipe photo
  ingredients: IngredientSection[];
  instructions: string[];
  tips?: string[];
  info?: string[];
  comments?: Comment[];
}

export interface RecipeCollection {
  version: string;
  totalRecipes: number;
  categories: string[];
  recipes: Recipe[];
  generatedAt: string;
}
