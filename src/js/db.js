// Database
export const db = new Dexie('JonnaAubergineDB');
db.version(1).stores({
    recipes: '++id, title, category, isFavorite, createdAt'
});
db.version(2).stores({
    recipes: '++id, title, category, isFavorite, createdAt',
    fridge: '++id, name'
});
