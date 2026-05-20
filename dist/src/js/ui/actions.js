import { state } from "../state.js";
import { updateIcons } from "../utils.js";
import { renderRecipes, addToHome, toggleFavorite } from "./recipes.js";
import {
  openDetail,
  openExploreDetail,
  editRecipe,
  deleteRecipe,
} from "./modals.js";
import { toggleRecipeToShoppingList } from "./shopping.js";

export function openRecipeActions(e, idOrIndex, isExplore) {
  if (e) e.stopPropagation();
  state.isExploringAction = isExplore;
  state.currentActionIdOrIndex = idOrIndex;
  const source = isExplore ? state.exploreRecipes : state.recipes;
  state.currentActionRecipe = isExplore
    ? source[idOrIndex]
    : source.find((r) => r.id === idOrIndex);

  if (!state.currentActionRecipe) return;

  const sheet = document.getElementById("recipe-actions-sheet");
  document.getElementById("actions-recipe-title").innerText =
    state.currentActionRecipe.title;
  document.getElementById("actions-recipe-subtitle").innerText =
    `${state.currentActionRecipe.category} Recipe`;

  const favIcon = document.getElementById("action-favorite-icon");
  const favText = document.getElementById("action-favorite-text");

  if (isExplore) {
    const local = state.recipes.find(
      (r) => r.title === state.currentActionRecipe.title,
    );
    const reallyFav = local ? local.isFavorite : false;
    favIcon.innerHTML = `<i data-lucide="heart" class="${reallyFav ? "fill-[#B3261E] text-[#B3261E]" : ""}"></i>`;
    favText.innerText = reallyFav
      ? "Remove from Favorites"
      : "Add to Favorites";
  } else {
    const isFav = state.currentActionRecipe.isFavorite;
    favIcon.innerHTML = `<i data-lucide="heart" class="${isFav ? "fill-[#B3261E] text-[#B3261E]" : ""}"></i>`;
    favText.innerText = isFav ? "Remove from Favorites" : "Add to Favorites";
  }

  const shopIcon = document.getElementById("action-shopping-icon");
  const shopText = document.getElementById("action-shopping-text");
  const inShopList = state.selectedRecipesForList.some(
    (r) => r.title === state.currentActionRecipe.title,
  );
  shopIcon.innerHTML = `<i data-lucide="${inShopList ? "check" : "shopping-cart"}"></i>`;
  shopText.innerText = inShopList
    ? "Remove from Shopping List"
    : "Add to Shopping List";

  const addHomeBtn = document.getElementById("action-add-home-btn");
  const editBtn = document.getElementById("action-edit-btn");
  const deleteBtn = document.getElementById("action-delete-btn");
  const viewBtn = document.getElementById("action-view-btn");

  // Check if we are inside the detail modal
  const detailModal = document.getElementById("detail-modal");
  const isDetailOpen = !detailModal.classList.contains("hidden");

  // Hide "View Details" if we are already viewing this recipe's details
  // For Explore recipes, we check if the detail view is showing the same recipe
  viewBtn.classList.toggle("hidden", isDetailOpen);

  if (isExplore) {
    const alreadyAdded = state.recipes.some(
      (r) => r.title === state.currentActionRecipe.title,
    );
    addHomeBtn.classList.toggle("hidden", alreadyAdded);
    editBtn.classList.add("hidden");
    deleteBtn.classList.add("hidden");
  } else {
    addHomeBtn.classList.add("hidden");
    editBtn.classList.remove("hidden");
    deleteBtn.classList.remove("hidden");
  }

  const panel = document.getElementById("recipe-actions-panel");

  if (window.innerWidth >= 768) {
    sheet.classList.remove("hidden");

    if (e && e.currentTarget) {
      panel.style.position = "absolute";
      panel.style.bottom = "auto";
      panel.style.right = "auto";

      const rect = e.currentTarget.getBoundingClientRect();
      const panelWidth = panel.offsetWidth || 320;
      const panelHeight = panel.offsetHeight || 300;

      let top = rect.bottom + 8;
      let left = rect.right - panelWidth;

      // Adjust for right/left screen boundaries
      if (left + panelWidth > window.innerWidth - 16) {
        left = window.innerWidth - panelWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }

      // Adjust for bottom screen boundary (flip up if overflows bottom)
      if (top + panelHeight > window.innerHeight - 16) {
        top = rect.top - panelHeight - 8;
      }
      if (top < 16) {
        top = 16;
      }

      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;
      panel.style.transform = "none";
    }
  } else {
    // Mobile: Reset to default bottom sheet styles
    panel.style.position = "";
    panel.style.top = "";
    panel.style.left = "";
    panel.style.bottom = "";
    panel.style.right = "";
    panel.style.transform = "";
    sheet.classList.remove("hidden");
  }

  updateIcons();
}

export function closeRecipeActions() {
  document.getElementById("recipe-actions-sheet").classList.add("hidden");
}

// Close dynamic context menu on window resize
window.addEventListener("resize", closeRecipeActions);

export async function handleAction(type) {
  if (!state.currentActionRecipe) return;

  if (type === "favorite") {
    if (state.isExploringAction) {
      const local = state.recipes.find(
        (r) => r.title === state.currentActionRecipe.title,
      );
      if (local) {
        await toggleFavorite({ stopPropagation: () => {} }, local.id);
      } else {
        await addToHome(
          null,
          state.exploreRecipes.indexOf(state.currentActionRecipe),
          true,
        );
        const newLocal = state.recipes.find(
          (r) => r.title === state.currentActionRecipe.title,
        );
        if (newLocal)
          await toggleFavorite({ stopPropagation: () => {} }, newLocal.id);
      }
    } else {
      await toggleFavorite(
        { stopPropagation: () => {} },
        state.currentActionRecipe.id,
      );
    }
  } else if (type === "add") {
    if (state.isExploringAction) {
      await addToHome(
        null,
        state.exploreRecipes.indexOf(state.currentActionRecipe),
      );
    }
  } else if (type === "shopping") {
    toggleRecipeToShoppingList(
      null,
      state.isExploringAction
        ? state.currentActionRecipe.title
        : state.currentActionRecipe.id,
      state.isExploringAction,
    );
  } else if (type === "view") {
    if (state.isExploringAction) {
      openExploreDetail(
        state.exploreRecipes.indexOf(state.currentActionRecipe),
      );
    } else {
      openDetail(state.currentActionRecipe.id);
    }
  } else if (type === "edit") {
    if (!state.isExploringAction) editRecipe(state.currentActionRecipe.id);
  } else if (type === "delete") {
    if (!state.isExploringAction) deleteRecipe(state.currentActionRecipe.id);
  }

  if (type !== "favorite" && type !== "shopping") {
    closeRecipeActions();
  } else {
    openRecipeActions(null, state.currentActionIdOrIndex, state.isExploringAction);
  }
}
