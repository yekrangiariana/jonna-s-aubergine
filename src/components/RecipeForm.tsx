import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Camera } from 'lucide-react';
import { Recipe, CATEGORIES, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface RecipeFormProps {
  recipe?: Recipe;
  onSave: (recipe: Omit<Recipe, 'id'> & { id?: number }) => void;
  onClose: () => void;
}

export default function RecipeForm({ recipe, onSave, onClose }: RecipeFormProps) {
  const [title, setTitle] = useState(recipe?.title || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [category, setCategory] = useState<Category>((recipe?.category as Category) || 'Dinner');
  const [prepTime, setPrepTime] = useState(recipe?.prepTime || '');
  const [cookTime, setCookTime] = useState(recipe?.cookTime || '');
  const [servings, setServings] = useState(recipe?.servings || 2);
  const [ingredients, setIngredients] = useState<string[]>(recipe?.ingredients || ['']);
  const [instructions, setInstructions] = useState<string[]>(recipe?.instructions || ['']);
  const [image, setImage] = useState(recipe?.image || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));
  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addInstruction = () => setInstructions([...instructions, '']);
  const removeInstruction = (index: number) => setInstructions(instructions.filter((_, i) => i !== index));
  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: recipe?.id,
      title,
      description,
      category,
      prepTime,
      cookTime,
      servings,
      ingredients: ingredients.filter(i => i.trim()),
      instructions: instructions.filter(i => i.trim()),
      image,
      isFavorite: recipe?.isFavorite || false,
      createdAt: recipe?.createdAt || Date.now(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 bg-m3-surface z-[60] flex flex-col"
    >
      <header className="flex items-center justify-between px-4 py-4 border-b border-m3-outline/10">
        <button onClick={onClose} className="p-2 -ml-2 text-m3-on-surface hover:bg-m3-surface-variant rounded-full">
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold text-m3-on-surface">
          {recipe ? 'Edit Recipe' : 'New Recipe'}
        </h2>
        <button
          onClick={handleSubmit}
          disabled={!title || ingredients.filter(i => i.trim()).length === 0}
          className="m3-button-filled px-6 py-2"
        >
          Save
        </button>
      </header>

      <form className="flex-1 overflow-y-auto px-6 py-6 pb-20 space-y-8" onSubmit={handleSubmit}>
        {/* Image Picker */}
        <div className="relative group">
          <div className="w-full aspect-video rounded-[28px] bg-m3-surface-variant/50 overflow-hidden flex items-center justify-center relative">
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-m3-on-surface-variant flex flex-col items-center gap-2">
                <Camera size={48} />
                <span className="text-sm font-medium">Add a photo</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          {image && (
            <button
              type="button"
              onClick={() => setImage('')}
              className="absolute top-4 right-4 p-2 bg-m3-error text-white rounded-full shadow-lg"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-m3-on-surface-variant pl-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Classic Margherita Pizza"
              className="m3-input"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-m3-on-surface-variant pl-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short story about this recipe..."
              className="m3-input min-h-[100px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-m3-on-surface-variant pl-1">Prep Time</label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15 mins"
                className="m3-input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-m3-on-surface-variant pl-1">Cook Time</label>
              <input
                type="text"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="30 mins"
                className="m3-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-m3-on-surface-variant pl-1">Servings</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="m3-input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-m3-on-surface-variant pl-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="m3-input appearance-none"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-m3-on-surface">Ingredients</h3>
            <button
              type="button"
              onClick={addIngredient}
              className="p-2 text-m3-primary hover:bg-m3-primary/10 rounded-full"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={ing}
                  onChange={(e) => updateIngredient(idx, e.target.value)}
                  placeholder={`Ingredient ${idx + 1}`}
                  className="m3-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="p-3 text-m3-error hover:bg-m3-error/10 rounded-lg"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-m3-on-surface">Instructions</h3>
            <button
              type="button"
              onClick={addInstruction}
              className="p-2 text-m3-primary hover:bg-m3-primary/10 rounded-full"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="space-y-3">
            {instructions.map((ins, idx) => (
              <div key={idx} className="flex gap-2">
                <textarea
                  value={ins}
                  onChange={(e) => updateInstruction(idx, e.target.value)}
                  placeholder={`Step ${idx + 1}`}
                  className="m3-input flex-1 min-h-[80px] resize-none"
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(idx)}
                  className="p-3 text-m3-error hover:bg-m3-error/10 rounded-lg"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </motion.div>
  );
}
