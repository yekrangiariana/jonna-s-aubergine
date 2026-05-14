export interface Recipe {
  id?: number;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  category: string;
  prepTime: string; // e.g. "15 mins"
  cookTime: string; // e.g. "30 mins"
  servings: number;
  image?: string; // data URL or path
  isFavorite: boolean;
  createdAt: number;
}

export type Category = 'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Dessert' | 'Snack';

export const CATEGORIES: Category[] = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];
