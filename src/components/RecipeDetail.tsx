import { ArrowLeft, Clock, Users, Heart, Share2, Printer, Trash2 } from 'lucide-react';
import { Recipe } from '../types';
import { motion } from 'motion/react';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (recipe: Recipe) => void;
}

export default function RecipeDetail({ recipe, onClose, onEdit, onDelete, onToggleFavorite }: RecipeDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-m3-surface z-[70] flex flex-col pt-safe-area-inset-top"
    >
      <div className="relative h-[40vh] min-h-[300px]">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-m3-secondary-container flex items-center justify-center text-8xl">
            🍳
          </div>
        )}
        
        {/* Top bar controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
          <button
            onClick={onClose}
            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex gap-2">
             <button
              onClick={() => onToggleFavorite(recipe)}
              className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <Heart
                size={24}
                className={recipe.isFavorite ? 'fill-m3-error text-m3-error' : ''}
              />
            </button>
            <button
               onClick={() => onEdit(recipe)}
               className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <Share2 size={24} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-m3-surface to-transparent">
           <div className="px-3 py-1 w-fit rounded-lg bg-m3-primary/20 text-m3-primary text-xs font-bold uppercase tracking-wider mb-2">
            {recipe.category}
          </div>
          <h1 className="text-4xl font-black text-m3-on-surface leading-tight">
            {recipe.title}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-m3-surface-variant/30 p-4 rounded-3xl flex flex-col items-center gap-1">
            <Clock size={20} className="text-m3-primary" />
            <span className="text-xs font-medium text-m3-on-surface-variant uppercase tracking-wider">Prep</span>
            <span className="text-sm font-bold text-m3-on-surface">{recipe.prepTime}</span>
          </div>
           <div className="bg-m3-surface-variant/30 p-4 rounded-3xl flex flex-col items-center gap-1">
            <Clock size={20} className="text-m3-secondary" />
            <span className="text-xs font-medium text-m3-on-surface-variant uppercase tracking-wider">Cook</span>
            <span className="text-sm font-bold text-m3-on-surface">{recipe.cookTime}</span>
          </div>
           <div className="bg-m3-surface-variant/30 p-4 rounded-3xl flex flex-col items-center gap-1">
            <Users size={20} className="text-m3-outline" />
            <span className="text-xs font-medium text-m3-on-surface-variant uppercase tracking-wider">Serves</span>
            <span className="text-sm font-bold text-m3-on-surface">{recipe.servings}</span>
          </div>
        </div>

        {/* Description */}
        {recipe.description && (
          <div className="space-y-3">
             <h3 className="text-2xl font-bold text-m3-on-surface">About this recipe</h3>
             <p className="text-m3-on-surface-variant leading-relaxed italic">
               "{recipe.description}"
             </p>
          </div>
        )}

        {/* Ingredients */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-m3-on-surface">Ingredients</h3>
          <ul className="space-y-3">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-center gap-4 group">
                <div className="w-2 h-2 rounded-full bg-m3-primary/40 group-hover:bg-m3-primary transition-colors" />
                <span className="text-m3-on-surface font-medium">{ing}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-m3-on-surface">Step by step</h3>
          <div className="space-y-8">
            {recipe.instructions.map((ins, idx) => (
              <div key={idx} className="relative pl-12 group">
                 <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-m3-primary text-m3-on-primary font-bold flex items-center justify-center text-sm">
                   {idx + 1}
                 </div>
                 {idx < recipe.instructions.length - 1 && (
                   <div className="absolute left-4 top-10 bottom-[-1.5rem] w-[2px] bg-m3-primary/10" />
                 )}
                 <p className="text-m3-on-surface font-medium selection:bg-m3-primary/20">
                   {ins}
                 </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => onEdit(recipe)}
            className="m3-button-tonal flex-1 flex items-center justify-center gap-2"
          >
            Edit Recipe
          </button>
          <button
            onClick={() => recipe.id && onDelete(recipe.id)}
            className="w-14 h-14 rounded-[20px] bg-m3-error/10 text-m3-error flex items-center justify-center hover:bg-m3-error hover:text-white transition-all"
          >
            <Trash2 size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
