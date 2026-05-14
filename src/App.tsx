import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Recipe, CATEGORIES, Category } from './types';
import RecipeCard from './components/RecipeCard';
import RecipeForm from './components/RecipeForm';
import RecipeDetail from './components/RecipeDetail';
import BottomNav, { FAB } from './components/Navigation';
import { Search, Utensils, Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | undefined>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search when tab changes to search
  useEffect(() => {
    if (activeTab === 'search') {
      searchInputRef.current?.focus();
    }
  }, [activeTab]);

  // Fetch recipes with filters
  const recipes = useLiveQuery(async () => {
    let query = db.recipes.orderBy('createdAt').reverse();
    const all = await query.toArray();
    
    return all.filter(r => {
      const matchesTab = activeTab === 'favorites' ? r.isFavorite : true;
      const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
      const matchesSearch = !searchQuery || 
                            r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            r.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesTab && matchesCategory && matchesSearch;
    });
  }, [activeTab, selectedCategory, searchQuery]);

  const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id'> & { id?: number }) => {
    if (recipeData.id) {
      await db.recipes.update(recipeData.id, recipeData);
    } else {
      await db.recipes.add(recipeData as Recipe);
    }
    setIsFormOpen(false);
    setEditingRecipe(undefined);
  };

  const handleDeleteRecipe = async (id: number) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      await db.recipes.delete(id);
      setViewingRecipe(undefined);
    }
  };

  const handleToggleFavorite = async (recipe: Recipe) => {
    if (recipe.id) {
      await db.recipes.update(recipe.id, { isFavorite: !recipe.isFavorite });
      if (viewingRecipe?.id === recipe.id) {
        setViewingRecipe({ ...recipe, isFavorite: !recipe.isFavorite });
      }
    }
  };

  const openForm = (recipe?: Recipe) => {
    setEditingRecipe(recipe);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 bg-m3-surface/80 backdrop-blur-xl z-30 px-6 pt-12 pb-6 flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-m3-primary font-bold text-sm tracking-[0.2em] uppercase mb-1 block">Jonna's Aubergine</span>
            <h1 className="text-4xl font-black text-m3-on-surface">
              {activeTab === 'recipes' ? 'Explore' : activeTab === 'favorites' ? 'Saved' : 'Search'}
            </h1>
          </motion.div>
          <motion.div
             whileTap={{ scale: 0.9 }}
             className="w-12 h-12 rounded-full bg-m3-secondary-container flex items-center justify-center text-m3-on-secondary-container"
          >
            {activeTab === 'favorites' ? <Heart size={24} fill="currentColor" /> : <Utensils size={24} />}
          </motion.div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-m3-on-surface-variant group-focus-within:text-m3-primary transition-colors" size={20} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={activeTab === 'favorites' ? "Search saved recipes..." : "Search recipes or ingredients..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-m3-surface-variant/40 rounded-full py-4 pl-12 pr-6 text-m3-on-surface placeholder:text-m3-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-m3-primary/20 transition-all font-medium"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-m3-primary text-m3-on-primary shadow-lg shadow-m3-primary/20'
                  : 'bg-m3-surface-variant text-m3-on-surface-variant hover:bg-m3-surface-variant/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 space-y-8 mt-4">
        <AnimatePresence mode="popLayout">
          {recipes && recipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {recipes.map(recipe => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    onClick={setViewingRecipe}
                    onToggleFavorite={(r) => handleToggleFavorite(r)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 flex flex-col items-center justify-center text-center gap-4 text-m3-on-surface-variant/40"
            >
              {activeTab === 'favorites' ? <Heart size={80} strokeWidth={1} /> : <Utensils size={80} strokeWidth={1} />}
              <div className="space-y-1 max-w-xs">
                 <p className="text-xl font-bold">
                   {searchQuery || selectedCategory !== 'All' 
                     ? 'No results found' 
                     : activeTab === 'favorites' 
                       ? 'No saved recipes yet' 
                       : 'No recipes found'}
                 </p>
                 <p className="text-sm">
                   {searchQuery || selectedCategory !== 'All'
                     ? 'Try adjusting your search or filters'
                     : activeTab === 'favorites'
                       ? 'Save your favorite recipes to see them here!'
                       : 'Start cooking by adding your first recipe!'}
                 </p>
              </div>
              {activeTab !== 'favorites' && !searchQuery && selectedCategory === 'All' && (
                <button
                  onClick={() => openForm()}
                  className="m3-button-tonal mt-4"
                >
                  Add Recipe
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {isFormOpen && (
          <RecipeForm
            recipe={editingRecipe}
            onSave={handleSaveRecipe}
            onClose={() => {
              setIsFormOpen(false);
              setEditingRecipe(undefined);
            }}
          />
        )}
        
        {viewingRecipe && (
          <RecipeDetail
            recipe={viewingRecipe}
            onClose={() => setViewingRecipe(undefined)}
            onEdit={(r) => {
              setViewingRecipe(undefined);
              openForm(r);
            }}
            onDelete={handleDeleteRecipe}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </AnimatePresence>

      <FAB onClick={() => openForm()} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
