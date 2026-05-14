import Dexie, { type Table } from 'dexie';
import { Recipe } from './types';

export class CulinaDatabase extends Dexie {
  recipes!: Table<Recipe>;

  constructor() {
    super('CulinaDB');
    this.version(1).stores({
      recipes: '++id, title, category, isFavorite, createdAt' // Primary key and indexed fields
    });
  }
}

export const db = new CulinaDatabase();
