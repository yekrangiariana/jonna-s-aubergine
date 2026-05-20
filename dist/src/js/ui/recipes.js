import { state, CATEGORIES } from "../state.js";
import { db } from "../db.js";
import {
  updateIcons,
  normalizeIngredientName,
  showFeedback,
  showConfirm,
} from "../utils.js";
import { queueAutoSync } from "../sync.js";

export function updateIngredientSuggestions() {
  const allIngredients = [...state.recipes, ...state.exploreRecipes].flatMap(
    (r) => r.ingredients || [],
  );
  const uniqueNormalized = new Set();
  allIngredients.forEach((ing) => {
    const normalized = normalizeIngredientName(ing);
    if (normalized) uniqueNormalized.add(normalized);
  });
  state.ingredientSuggestions = Array.from(uniqueNormalized).sort();
}

export function renderCategories() {
  const container = document.getElementById("category-filters");
  if (!container) return;

  container.innerHTML = CATEGORIES.filter(
    (cat) => state.currentView === "home" || cat !== "Favorites",
  )
    .map(
      (cat) => `
        <button 
            onclick="setCategory('${cat}')" 
            class="px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 whitespace-nowrap ${
              state.currentCategory === cat
                ? "bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] shadow-sm"
                : "bg-[var(--m3-surface-variant)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-outline)]/20"
            }"
        >
            ${cat}
        </button>
    `,
    )
    .join("");
}

export function renderRecipes() {
  const container = document.getElementById("recipe-grid");
  if (!container) return;

  let source =
    state.currentView === "explore" ? state.exploreRecipes : state.recipes;

  // Add original index to objects before sorting/filtering for Explore view
  let displayItems = source.map((item, index) => ({
    ...item,
    _originalIndex: index,
  }));

  let filtered = [...displayItems].sort((a, b) => {
    if (state.currentView === "explore") return 0; // Keep explore order by default
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  if (state.currentCategory === "Favorites" && state.currentView === "home") {
    filtered = filtered.filter((r) => r.isFavorite);
  } else if (
    state.currentCategory !== "All" &&
    state.currentCategory !== "Favorites"
  ) {
    filtered = filtered.filter((r) => r.category === state.currentCategory);
  }

  if (state.searchQuery) {
    filtered = filtered.filter(
      (r) =>
        (r.title && r.title.toLowerCase().includes(state.searchQuery)) ||
        (r.description &&
          r.description.toLowerCase().includes(state.searchQuery)) ||
        (r.ingredients &&
          r.ingredients.some((i) =>
            i.toLowerCase().includes(state.searchQuery),
          )),
    );
  }

  if (state.selectedIngredientsFilter.length > 0) {
    filtered = filtered.filter((r) => {
      const recipeIngs = (r.ingredients || []).map((i) => i.toLowerCase());
      return state.selectedIngredientsFilter.every((si) =>
        recipeIngs.some((ri) => ri.includes(si.toLowerCase())),
      );
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
            <div class="col-span-full py-20 flex flex-col items-center justify-center text-[#49454F]/40">
                <i data-lucide="chef-hat" class="w-16 h-16 mb-4 opacity-20"></i>
                <p class="text-xl font-medium">${state.searchQuery ? "No recipes match your search" : "No recipes found here"}</p>
                ${state.currentView === "home" && !state.searchQuery ? '<button onclick="openForm()" class="mt-4 text-[#6750A4] font-bold hover:underline">Add your first recipe</button>' : ""}
            </div>
        `;
    updateIcons();
    return;
  }

  container.innerHTML = filtered
    .map((recipe) => {
      const isExplore = state.currentView === "explore";
      const recipeIdOrIndex = isExplore ? recipe._originalIndex : recipe.id;

      // Sync favorite status with local collection for Explore items
      const isFavorite = isExplore
        ? state.recipes.some((r) => r.title === recipe.title && r.isFavorite)
        : recipe.isFavorite;

      const imageContent = recipe.image
        ? `<img src="${recipe.image}" class="w-full h-full object-cover">`
        : `<div class="w-full h-full flex items-center justify-center opacity-20 text-[var(--m3-primary)] bg-[var(--m3-surface-variant)]">
                    <i data-lucide="utensils" class="w-12 h-12"></i>
               </div>`;

      let actionButtons = `
            <div class="absolute top-3 right-3 z-20">
                <button onclick="openRecipeActions(event, ${recipeIdOrIndex}, ${isExplore})" class="more-btn p-2 rounded-full bg-white/95 backdrop-blur-md text-[#1D1B20] shadow-md active:scale-95 transition-transform">
                    <i data-lucide="more-vertical" class="w-5 h-5"></i>
                </button>
            </div>
        `;

      return `
            <div onclick="${isExplore ? `openExploreDetail(${recipeIdOrIndex})` : `openDetail(${recipe.id})`}" class="m3-card group cursor-pointer flex flex-col">
                <div class="m3-card-image-wrapper">
                    ${imageContent}
                    ${actionButtons}
                </div>
                <div class="px-2 pb-2 flex-1 flex flex-col">
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <h3 class="text-xl md:text-2xl font-bold text-[var(--m3-on-surface)] line-clamp-1">${recipe.title}</h3>
                        ${isFavorite ? '<i data-lucide="heart" class="w-4 h-4 fill-[#B3261E] text-[#B3261E] mt-1 flex-shrink-0"></i>' : ""}
                    </div>
                    <p class="text-[var(--m3-on-surface-variant)] text-xs md:text-sm leading-relaxed mb-4 line-clamp-2 min-h-[32px] md:min-h-[40px]">${recipe.description || "No description."}</p>
                    <div class="mt-auto flex justify-between items-center py-2 border-t border-[var(--m3-outline)]/20">
                        <span class="text-[10px] md:text-[11px] font-black text-[var(--m3-primary)] uppercase tracking-wider">${recipe.prepTime || "15 MINS"}</span>
                        <div class="flex gap-1">
                            <div class="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--m3-primary)]"></div>
                            <div class="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--m3-primary-container)]"></div>
                            <div class="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--m3-primary-container)]"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
  updateIcons();
}

export async function toggleFavorite(e, id) {
  if (e) e.stopPropagation();
  const recipe = state.recipes.find((r) => r.id === id);
  if (!recipe) return;

  recipe.isFavorite = !recipe.isFavorite;
  try {
    await db.recipes.update(id, { isFavorite: recipe.isFavorite });
    renderRecipes();
    queueAutoSync();
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
  }
}

export async function addToHome(e, exploreIndex, skipFeedback = false) {
  if (e) e.stopPropagation();
  const recipe = state.exploreRecipes[exploreIndex];
  if (!recipe) return;

  const alreadyExists = state.recipes.some((r) => r.title === recipe.title);
  if (alreadyExists) return;

  try {
    const docToAdd = { ...recipe, createdAt: Date.now(), isFavorite: false };
    await db.recipes.add(docToAdd);
    state.recipes = await db.recipes.toArray();
    renderRecipes();
    queueAutoSync();
    
    if (!skipFeedback) {
      showFeedback(
        "Recipe Added!",
        `${recipe.title} has been added to your collection.`,
      );
    }

    const modal = document.getElementById("detail-modal");
    if (!modal.classList.contains("hidden")) {
      window.openExploreDetail(exploreIndex);
    }
  } catch (error) {
    console.error("Failed to add recipe to home:", error);
  }
}
