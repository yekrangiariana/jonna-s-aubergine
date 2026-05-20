import { state } from '../state.js';
import { updateIcons, showConfirm, isIngredientMatch, normalizeIngredientName } from '../utils.js';
import { renderRecipes } from './recipes.js';

export function loadShoppingListData() {
    try {
        // Restore fridge filter
        const storedFridge = localStorage.getItem('jonna_fridge_filter');
        if (storedFridge) {
            state.selectedIngredientsFilter = JSON.parse(storedFridge) || [];
            renderIngredientTags();
        }

        // Restore shopping list
        const stored = localStorage.getItem('jonna_shopping_list');
        if (stored) {
            const data = JSON.parse(stored);
            state.selectedRecipesForList = data.selectedRecipesForList || [];
            state.shoppingListItems = data.shoppingListItems || [];
            syncShoppingListWithFridge();
            updateShoppingBadge();
        }

        updateFridgeBadge();
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
}

export function saveFridgeFilter() {
    localStorage.setItem('jonna_fridge_filter', JSON.stringify(state.selectedIngredientsFilter));
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

export function updateFridgeBadge() {
    const badge = document.getElementById('fridge-badge');
    if (!badge) return;
    const count = state.selectedIngredientsFilter.length;
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
        renderFridgeRecipes();
    }
}

export function closeIngredientModal() {
    document.getElementById('ingredient-modal').classList.add('hidden');
}

export function clearIngredientFilter() {
    state.selectedIngredientsFilter = [];
    saveFridgeFilter();
    renderIngredientTags();
    renderFridgeRecipes();
    updateFridgeBadge();
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
    saveFridgeFilter();
    renderIngredientTags();
    renderFridgeRecipes();
    syncShoppingListWithFridge();
    updateFridgeBadge();
    renderRecipes();
    document.getElementById('ingredient-suggestions').classList.add('hidden');
}

export function removeIngredientTag(ing) {
    state.selectedIngredientsFilter = state.selectedIngredientsFilter.filter(i => i !== ing);
    saveFridgeFilter();
    renderIngredientTags();
    renderFridgeRecipes();
    updateFridgeBadge();
    renderRecipes();
}

export function renderFridgeRecipes() {
    const section = document.getElementById('fridge-recipes-section');
    const list = document.getElementById('fridge-recipes-list');
    if (!section || !list) return;

    if (state.selectedIngredientsFilter.length === 0) {
        section.classList.add('hidden');
        section.classList.remove('flex');
        list.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');
    section.classList.add('flex');

    // Compile items from both user recipes and explore recipes
    const homeItems = state.recipes.map(r => ({ ...r, isExplore: false }));
    const exploreItems = state.exploreRecipes.map((r, index) => ({ ...r, isExplore: true, _originalIndex: index }));

    // Deduplicate recipes by lowercased title, prioritizing home recipes
    const uniqueItems = [];
    const titles = new Set();

    for (const r of homeItems) {
        if (r.title && !titles.has(r.title.toLowerCase())) {
            titles.add(r.title.toLowerCase());
            uniqueItems.push(r);
        }
    }
    for (const r of exploreItems) {
        if (r.title && !titles.has(r.title.toLowerCase())) {
            titles.add(r.title.toLowerCase());
            uniqueItems.push(r);
        }
    }

    // Match and score
    const matchedRecipes = uniqueItems.map(recipe => {
        const total = (recipe.ingredients || []).length;
        const matchedRecipeIngredients = new Set();

        for (const ri of recipe.ingredients || []) {
            for (const si of state.selectedIngredientsFilter) {
                if (isIngredientMatch(ri, si)) {
                    matchedRecipeIngredients.add(ri);
                }
            }
        }

        const matchedCount = matchedRecipeIngredients.size;
        const missingIngredients = (recipe.ingredients || []).filter(ri => !matchedRecipeIngredients.has(ri));
        const missingCleaned = Array.from(
            new Set(missingIngredients.map(i => normalizeIngredientName(i)))
        ).filter(Boolean);

        return {
            ...recipe,
            matchedCount,
            missingCount: total - matchedCount,
            total,
            missingCleaned
        };
    }).filter(r => r.matchedCount > 0);

    // Sort: 1. Most matched ingredients first, 2. Fewest missing ingredients, 3. Smaller recipes
    matchedRecipes.sort((a, b) => {
        if (b.matchedCount !== a.matchedCount) {
            return b.matchedCount - a.matchedCount;
        }
        if (a.missingCount !== b.missingCount) {
            return a.missingCount - b.missingCount;
        }
        return a.total - b.total;
    });

    if (matchedRecipes.length === 0) {
        list.innerHTML = `
            <div class="py-6 flex flex-col items-center justify-center text-[var(--m3-on-surface-variant)] opacity-60 text-center">
                <i data-lucide="help-circle" class="w-8 h-8 mb-2 opacity-40"></i>
                <p class="text-sm font-medium">No recipes match these ingredients</p>
            </div>
        `;
        updateIcons();
        return;
    }

    list.innerHTML = matchedRecipes.map(recipe => {
        const imageHtml = recipe.image
            ? `<img src="${recipe.image}" class="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover flex-shrink-0 shadow-sm">`
            : `<div class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[var(--m3-surface-variant)] text-[var(--m3-primary)] flex items-center justify-center flex-shrink-0 shadow-sm">
                   <i data-lucide="utensils" class="w-5 h-5 opacity-40"></i>
               </div>`;

        const badgeColor = recipe.missingCount === 0
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)]';

        const missingText = recipe.missingCount === 0
            ? `<span class="text-green-600 dark:text-green-400 font-bold flex items-center gap-1"><i data-lucide="sparkles" class="w-3 h-3"></i> Ready to cook!</span>`
            : `<span class="text-[var(--m3-on-surface-variant)] opacity-80"><strong class="text-[var(--m3-error)] font-semibold">Need:</strong> ${recipe.missingCleaned.join(', ')}</span>`;

        return `
            <div onclick="window.openFridgeRecipe(${recipe.isExplore}, ${recipe.isExplore ? recipe._originalIndex : recipe.id})"
                 class="flex items-center gap-3 p-3 rounded-2xl bg-[var(--m3-surface-variant)]/40 hover:bg-[var(--m3-surface-variant)] border border-[var(--m3-outline)]/5 hover:border-[var(--m3-primary)]/20 cursor-pointer active:scale-[0.99] transition-all duration-200">
                ${imageHtml}
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-0.5">
                        <h4 class="text-sm font-bold text-[var(--m3-on-surface)] truncate">${recipe.title}</h4>
                        <span class="text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${badgeColor}">
                            Have ${recipe.matchedCount}/${recipe.total}
                        </span>
                    </div>
                    <div class="text-[11px] leading-snug truncate">
                        ${missingText}
                    </div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-[var(--m3-on-surface-variant)] opacity-40"></i>
            </div>
        `;
    }).join('');

    updateIcons();
}

window.openFridgeRecipe = (isExplore, idOrIndex) => {
    closeIngredientModal();
    if (isExplore) {
        window.openExploreDetail(idOrIndex);
    } else {
        window.openDetail(idOrIndex);
    }
};

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
    
    syncShoppingListWithFridge();
    saveShoppingListData();
    renderRecipes();
}

export function syncShoppingListWithFridge() {
    let changed = false;
    state.shoppingListItems.forEach(item => {
        const matches = state.selectedIngredientsFilter.some(si => isIngredientMatch(item.text, si));
        if (matches && !item.checked) {
            item.checked = true;
            changed = true;
        }
    });
    if (changed) {
        saveShoppingListData();
    }
}

export function openShoppingList() {
    const modal = document.getElementById('shopping-list-modal');
    modal.classList.remove('hidden');
    syncShoppingListWithFridge();
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
                id="shopping-item-input-${item.id}"
                type="text" 
                value="${item.text}" 
                placeholder="Add ingredient..."
                onchange="editShoppingItem(${item.id}, this.value)"
                onkeydown="if(event.key === 'Enter') { this.blur(); addShoppingItem(); }"
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
    const newItem = { id: Date.now(), text: '', checked: false };
    state.shoppingListItems.push(newItem);
    saveShoppingListData();
    renderShoppingList();
    
    setTimeout(() => {
        const input = document.getElementById(`shopping-item-input-${newItem.id}`);
        if (input) {
            input.focus();
            input.select();
        }
        const scrollContainer = document.querySelector('#shopping-list-modal .overflow-y-auto');
        if (scrollContainer) {
            scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, 50);
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
