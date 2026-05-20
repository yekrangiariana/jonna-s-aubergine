import { state } from '../state.js';
import { updateIcons, showConfirm } from '../utils.js';
import { renderRecipes } from './recipes.js';
import { queueAutoSync } from '../sync.js';

export function loadShoppingListData() {
    try {
        const stored = localStorage.getItem('jonna_shopping_list');
        if (stored) {
            const data = JSON.parse(stored);
            state.selectedRecipesForList = data.selectedRecipesForList || [];
            state.shoppingListItems = data.shoppingListItems || [];
            updateShoppingBadge();
        }
    } catch (e) {
        console.error('Failed to load shopping list data', e);
    }
}

export function saveShoppingListData() {
    localStorage.setItem('jonna_shopping_list', JSON.stringify({
        selectedRecipesForList: state.selectedRecipesForList,
        shoppingListItems: state.shoppingListItems
    }));
    updateShoppingBadge();
    queueAutoSync();
}

export function updateShoppingBadge() {
    const badge = document.getElementById('shopping-list-badge');
    if (!badge) return;
    const count = state.selectedRecipesForList.length;
    if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

export function toggleIngredientFilter() {
    const modal = document.getElementById('ingredient-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        document.getElementById('ingredient-input').focus();
    }
}

export function closeIngredientModal() {
    document.getElementById('ingredient-modal').classList.add('hidden');
}

export function clearIngredientFilter() {
    state.selectedIngredientsFilter = [];
    renderIngredientTags();
    renderRecipes();
}

export function handleIngredientKey(e) {
    const input = e.target;
    const val = input.value.trim().toLowerCase();
    const suggestionsBox = document.getElementById('ingredient-suggestions');

    if (e.key === 'Enter' && val) {
        addIngredientTag(val);
        input.value = '';
        suggestionsBox.classList.add('hidden');
    } else {
        const matches = state.ingredientSuggestions.filter(s => s.includes(val) && !state.selectedIngredientsFilter.includes(s));
        if (val && matches.length > 0) {
            suggestionsBox.innerHTML = matches.map(m => `
                <div onclick="addIngredientTag('${m}'); document.getElementById('ingredient-input').value=''" class="px-4 py-3 hover:bg-[var(--m3-surface-variant)] cursor-pointer text-sm">
                    ${m}
                </div>
            `).join('');
            suggestionsBox.classList.remove('hidden');
        } else {
            suggestionsBox.classList.add('hidden');
        }
    }
}

export function addIngredientTag(ing) {
    if (state.selectedIngredientsFilter.includes(ing)) return;
    state.selectedIngredientsFilter.push(ing);
    renderIngredientTags();
    renderRecipes();
    document.getElementById('ingredient-suggestions').classList.add('hidden');
}

export function removeIngredientTag(ing) {
    state.selectedIngredientsFilter = state.selectedIngredientsFilter.filter(i => i !== ing);
    renderIngredientTags();
    renderRecipes();
}

export function renderIngredientTags() {
    const container = document.getElementById('selected-ingredients');
    container.innerHTML = state.selectedIngredientsFilter.map(ing => `
        <div class="flex items-center gap-2 px-3 py-1 bg-[var(--m3-primary)] text-white rounded-full text-xs font-semibold">
            <span>${ing}</span>
            <button onclick="removeIngredientTag('${ing}')" class="hover:bg-white/20 rounded-full">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        </div>
    `).join('');
    updateIcons();
}

export function toggleRecipeToShoppingList(e, idOrTitle, isExplore) {
    if (e) e.stopPropagation();
    
    let targetRecipe;
    if (isExplore) {
        targetRecipe = state.exploreRecipes.find(r => r.title === idOrTitle);
    } else {
        targetRecipe = state.recipes.find(r => r.id === idOrTitle);
    }
    
    if (!targetRecipe) return;

    if (state.selectedRecipesForList.some(r => r.title === targetRecipe.title)) {
        state.selectedRecipesForList = state.selectedRecipesForList.filter(r => r.title !== targetRecipe.title);
    } else {
        state.selectedRecipesForList.push(targetRecipe);
        targetRecipe.ingredients.forEach(ing => {
            if (!state.shoppingListItems.some(i => i.text === ing)) {
                state.shoppingListItems.push({ id: Date.now() + Math.random(), text: ing, checked: false });
            }
        });
    }
    
    saveShoppingListData();
    renderRecipes();
}

export function openShoppingList() {
    const modal = document.getElementById('shopping-list-modal');
    modal.classList.remove('hidden');
    renderShoppingList();
}

export function closeShoppingList() {
    document.getElementById('shopping-list-modal').classList.add('hidden');
}

export function renderShoppingList() {
    const empty = document.getElementById('shopping-list-empty');
    const content = document.getElementById('shopping-list-content');
    if (!empty || !content) return;

    if (state.selectedRecipesForList.length === 0 && state.shoppingListItems.length === 0) {
        empty.classList.remove('hidden');
        content.classList.add('hidden');
        return;
    }
    
    empty.classList.add('hidden');
    content.classList.remove('hidden');
    
    const recipeContainer = document.getElementById('shopping-list-recipes');
    recipeContainer.innerHTML = state.selectedRecipesForList.map(r => `
        <div class="px-3 py-1 bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] rounded-full text-xs font-bold flex items-center gap-2">
            <span>${r.title}</span>
            <button onclick="removeRecipeFromList('${r.title}')" class="p-0.5 hover:bg-black/10 rounded-full"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    
    const itemsContainer = document.getElementById('shopping-list-items');
    itemsContainer.innerHTML = state.shoppingListItems.map(item => `
        <div class="flex items-center gap-4 p-3 bg-[var(--m3-surface-variant)]/60 rounded-2xl group">
            <button onclick="toggleShoppingItem(${item.id})" class="w-6 h-6 rounded-lg border-2 border-[var(--m3-primary)] flex items-center justify-center transition-all ${item.checked ? 'bg-[var(--m3-primary)]' : ''}">
                <i data-lucide="check" class="w-4 h-4 text-white ${item.checked ? '' : 'hidden'}"></i>
            </button>
            <input 
                type="text" 
                value="${item.text}" 
                onchange="editShoppingItem(${item.id}, this.value)"
                class="flex-1 bg-transparent border-none outline-none text-sm transition-all ${item.checked ? 'line-through opacity-50' : ''}"
            >
            <button onclick="removeShoppingItem(${item.id})" class="p-2 text-[var(--m3-error)] opacity-0 group-hover:opacity-100 transition-opacity">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    
    updateIcons();
}

export function removeRecipeFromList(title) {
    state.selectedRecipesForList = state.selectedRecipesForList.filter(r => r.title !== title);
    saveShoppingListData();
    renderShoppingList();
    renderRecipes();
}

export function toggleShoppingItem(id) {
    const item = state.shoppingListItems.find(i => i.id === id);
    if (item) item.checked = !item.checked;
    saveShoppingListData();
    renderShoppingList();
}

export function editShoppingItem(id, newText) {
    const item = state.shoppingListItems.find(i => i.id === id);
    if (item) item.text = newText;
    saveShoppingListData();
}

export function removeShoppingItem(id) {
    state.shoppingListItems = state.shoppingListItems.filter(i => i.id !== id);
    saveShoppingListData();
    renderShoppingList();
}

export function addShoppingItem() {
    const newItem = { id: Date.now(), text: 'New Ingredient', checked: false };
    state.shoppingListItems.push(newItem);
    saveShoppingListData();
    renderShoppingList();
}

export function clearShoppingList() {
    showConfirm('Clear Shopping List?', 'This will remove all selected recipes and ingredients. Are you sure?', async () => {
        state.selectedRecipesForList = [];
        state.shoppingListItems = [];
        saveShoppingListData();
        renderShoppingList();
        renderRecipes();
    });
}
