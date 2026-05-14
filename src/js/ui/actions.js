import { state } from '../state.js';
import { updateIcons } from '../utils.js';
import { renderRecipes, addToHome, toggleFavorite } from './recipes.js';
import { openDetail, openExploreDetail, editRecipe, deleteRecipe } from './modals.js';
import { toggleRecipeToShoppingList } from './shopping.js';

export function openRecipeActions(e, idOrIndex, isExplore) {
    if (e) e.stopPropagation();
    state.isExploringAction = isExplore;
    const source = isExplore ? state.exploreRecipes : state.recipes;
    state.currentActionRecipe = isExplore ? source[idOrIndex] : source.find(r => r.id === idOrIndex);
    
    if (!state.currentActionRecipe) return;

    const sheet = document.getElementById('recipe-actions-sheet');
    document.getElementById('actions-recipe-title').innerText = state.currentActionRecipe.title;
    document.getElementById('actions-recipe-subtitle').innerText = `${state.currentActionRecipe.category} Recipe`;
    
    const favIcon = document.getElementById('action-favorite-icon');
    const favText = document.getElementById('action-favorite-text');
    
    if (isExplore) {
        const local = state.recipes.find(r => r.title === state.currentActionRecipe.title);
        const reallyFav = local ? local.isFavorite : false;
        favIcon.innerHTML = `<i data-lucide="heart" class="${reallyFav ? 'fill-[#B3261E] text-[#B3261E]' : ''}"></i>`;
        favText.innerText = reallyFav ? 'Remove from Favorites' : 'Add to Favorites';
    } else {
        const isFav = state.currentActionRecipe.isFavorite;
        favIcon.innerHTML = `<i data-lucide="heart" class="${isFav ? 'fill-[#B3261E] text-[#B3261E]' : ''}"></i>`;
        favText.innerText = isFav ? 'Remove from Favorites' : 'Add to Favorites';
    }

    const shopIcon = document.getElementById('action-shopping-icon');
    const shopText = document.getElementById('action-shopping-text');
    const inShopList = state.selectedRecipesForList.some(r => r.title === state.currentActionRecipe.title);
    shopIcon.innerHTML = `<i data-lucide="${inShopList ? 'check' : 'shopping-cart'}"></i>`;
    shopText.innerText = inShopList ? 'Remove from Shopping List' : 'Add to Shopping List';

    const addHomeBtn = document.getElementById('action-add-home-btn');
    const editBtn = document.getElementById('action-edit-btn');
    const deleteBtn = document.getElementById('action-delete-btn');
    
    if (isExplore) {
        const alreadyAdded = state.recipes.some(r => r.title === state.currentActionRecipe.title);
        addHomeBtn.classList.toggle('hidden', alreadyAdded);
        editBtn.classList.add('hidden');
        deleteBtn.classList.add('hidden');
    } else {
        addHomeBtn.classList.add('hidden');
        editBtn.classList.remove('hidden');
        deleteBtn.classList.remove('hidden');
    }

    sheet.classList.remove('hidden');
    updateIcons();
}

export function closeRecipeActions() {
    document.getElementById('recipe-actions-sheet').classList.add('hidden');
}

export async function handleAction(type) {
    if (!state.currentActionRecipe) return;

    if (type === 'favorite') {
        if (state.isExploringAction) {
            const local = state.recipes.find(r => r.title === state.currentActionRecipe.title);
            if (local) {
                await toggleFavorite({ stopPropagation: () => {} }, local.id);
            } else {
                await addToHome(null, state.exploreRecipes.indexOf(state.currentActionRecipe));
                const newLocal = state.recipes.find(r => r.title === state.currentActionRecipe.title);
                if (newLocal) await toggleFavorite({ stopPropagation: () => {} }, newLocal.id);
            }
        } else {
            await toggleFavorite({ stopPropagation: () => {} }, state.currentActionRecipe.id);
        }
    } else if (type === 'add') {
        if (state.isExploringAction) {
            await addToHome(null, state.exploreRecipes.indexOf(state.currentActionRecipe));
        }
    } else if (type === 'shopping') {
        toggleRecipeToShoppingList(null, state.isExploringAction ? state.currentActionRecipe.title : state.currentActionRecipe.id, state.isExploringAction);
    } else if (type === 'view') {
        if (state.isExploringAction) {
            openExploreDetail(state.exploreRecipes.indexOf(state.currentActionRecipe));
        } else {
            openDetail(state.currentActionRecipe.id);
        }
    } else if (type === 'edit') {
        if (!state.isExploringAction) editRecipe(state.currentActionRecipe.id);
    } else if (type === 'delete') {
        if (!state.isExploringAction) deleteRecipe(state.currentActionRecipe.id);
    }
    
    closeRecipeActions();
}
