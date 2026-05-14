import React from 'react';
import { Clock, Users, Heart } from 'lucide-react';
import { Recipe } from '../types';
import { motion } from 'motion/react';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onToggleFavorite }) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(recipe);
  };


  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={() => onClick(recipe)}
      className="m3-card group cursor-pointer"
    >
      <div className="w-full aspect-video bg-m3-primary-container/30 rounded-2xl mb-4 overflow-hidden relative">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20 text-m3-primary">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
            </svg>
          </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-m3-on-surface hover:bg-m3-primary/10 transition-colors z-10"
        >
          <Heart
            size={18}
            className={recipe.isFavorite ? 'fill-m3-error text-m3-error' : 'text-m3-on-surface-variant'}
          />
        </button>
      </div>

      <h3 className="text-2xl font-bold text-m3-on-surface mb-2 line-clamp-1">
        {recipe.title}
      </h3>
      <p className="text-m3-on-surface-variant text-sm leading-relaxed mb-4 line-clamp-2 min-h-[40px]">
        {recipe.description}
      </p>
      
      <div className="mt-auto flex justify-between items-center">
        <span className="text-[11px] font-black text-m3-primary uppercase tracking-wider">
          {recipe.prepTime || '15 MINS'}
        </span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-m3-primary"></div>
          <div className="w-2 h-2 rounded-full bg-m3-primary-container"></div>
          <div className="w-2 h-2 rounded-full bg-m3-primary-container"></div>
        </div>
      </div>
    </motion.div>
  );
};

export default RecipeCard;

