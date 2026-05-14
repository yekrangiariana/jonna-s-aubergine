import { state } from '../state.js';
import { db } from '../db.js';
import { updateIcons, showConfirm } from '../utils.js';
import { renderRecipes } from './recipes.js';

export function openDetail(id) {
    const recipe = state.recipes.find(r => r.id === id);
    if (!recipe) return;
    
    const modal = document.getElementById('detail-modal');
    modal.innerHTML = `
        <div class="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[var(--m3-surface)]">
            <div class="w-full lg:w-1/2 h-64 md:h-80 lg:h-full relative overflow-hidden bg-[var(--m3-surface-variant)]">
                ${recipe.image 
                    ? `<img src="${recipe.image}" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full flex items-center justify-center opacity-10 text-[var(--m3-primary)]"><i data-lucide="utensils" class="w-32 h-32"></i></div>`
                }
                <div class="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent text-white">
                    <button onclick="closeDetail()" class="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md">
                        <i data-lucide="arrow-left"></i>
                    </button>
                    <div class="flex gap-2">
                        <button onclick="openRecipeActions(event, ${id}, false)" class="more-btn p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-all">
                            <i data-lucide="more-vertical"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-12 lg:px-16 lg:py-16">
                <div class="mb-8">
                    <span class="inline-block px-4 py-1 bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] rounded-full text-sm font-bold mb-4">${recipe.category}</span>
                    <h2 class="text-3xl md:text-5xl font-bold text-[var(--m3-on-surface)] mb-4">${recipe.title}</h2>
                    <p class="text-lg md:text-xl text-[var(--m3-on-surface-variant)] leading-relaxed italic">${recipe.description || ''}</p>
                </div>
                <div class="grid grid-cols-3 gap-4 py-6 border-y border-[var(--m3-outline)]/20 mb-10">
                    <div class="text-center"><p class="text-[10px] font-black text-[var(--m3-primary)] uppercase mb-1">Prep</p><p class="text-base font-bold">${recipe.prepTime || 'N/A'}</p></div>
                    <div class="text-center"><p class="text-[10px] font-black text-[var(--m3-primary)] uppercase mb-1">Cook</p><p class="text-base font-bold">${recipe.cookTime || 'N/A'}</p></div>
                    <div class="text-center"><p class="text-[10px] font-black text-[var(--m3-primary)] uppercase mb-1">Serves</p><p class="text-base font-bold">${recipe.servings || 'N/A'}</p></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                    <section>
                        <h3 class="text-xl md:text-2xl font-bold mb-6 flex items-center gap-3 text-[var(--m3-on-surface)]">
                            <i data-lucide="shopping-basket" class="text-[var(--m3-primary)]"></i>
                            Ingredients
                        </h3>
                        <ul class="space-y-4">
                            ${(recipe.ingredients || []).map(ing => `
                                <li class="flex items-start gap-4">
                                    <div class="w-5 h-5 rounded-full border-2 border-[var(--m3-primary)]/20 flex-shrink-0 mt-1"></div>
                                    <span class="text-base md:text-lg text-[var(--m3-on-surface)]">${ing}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </section>
                    <section>
                        <h3 class="text-xl md:text-2xl font-bold mb-6 flex items-center gap-3 text-[var(--m3-on-surface)]">
                            <i data-lucide="clipboard-list" class="text-[var(--m3-primary)]"></i>
                            Method
                        </h3>
                        <div class="space-y-6 md:space-y-8">
                            ${(recipe.instructions || []).map((ins, idx) => `
                                <div class="flex gap-6">
                                    <span class="text-3xl md:text-4xl font-black text-[var(--m3-primary)]/10 select-none">${(idx + 1).toString().padStart(2, '0')}</span>
                                    <p class="text-base md:text-lg text-[var(--m3-on-surface-variant)] leading-relaxed pt-1">${ins}</p>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    updateIcons();
}

export function openExploreDetail(index) {
    const recipe = state.exploreRecipes[index];
    if (!recipe) return;
    
    const modal = document.getElementById('detail-modal');
    modal.innerHTML = `
        <div class="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[var(--m3-surface)]">
            <div class="w-full lg:w-1/2 h-64 md:h-80 lg:h-full relative overflow-hidden bg-[var(--m3-surface-variant)]">
                ${recipe.image 
                    ? `<img src="${recipe.image}" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full flex items-center justify-center opacity-10 text-[var(--m3-primary)]"><i data-lucide="utensils" class="w-32 h-32"></i></div>`
                }
                <div class="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent text-white">
                    <button onclick="closeDetail()" class="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md">
                        <i data-lucide="arrow-left"></i>
                    </button>
                    <div class="flex gap-2">
                        <button onclick="openRecipeActions(event, ${index}, true)" class="more-btn p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-all">
                            <i data-lucide="more-vertical"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-12 lg:px-16 lg:py-16">
                <div class="mb-8">
                    <span class="inline-block px-4 py-1 bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] rounded-full text-sm font-bold mb-4">${recipe.category}</span>
                    <h2 class="text-3xl md:text-5xl font-bold text-[var(--m3-on-surface)] mb-4">${recipe.title}</h2>
                    <p class="text-lg md:text-xl text-[var(--m3-on-surface-variant)] leading-relaxed italic">${recipe.description || ''}</p>
                </div>
                <div class="grid grid-cols-3 gap-4 py-6 border-y border-[var(--m3-outline)]/20 mb-10">
                    <div class="text-center"><p class="text-[10px] font-black text-[var(--m3-primary)] uppercase mb-1">Prep</p><p class="text-base font-bold">${recipe.prepTime || '15m'}</p></div>
                    <div class="text-center"><p class="text-[10px] font-black text-[var(--m3-primary)] uppercase mb-1">Cook</p><p class="text-base font-bold">${recipe.cookTime || '30m'}</p></div>
                    <div class="text-center"><p class="text-[10px] font-black text-[var(--m3-primary)] uppercase mb-1">Serves</p><p class="text-base font-bold">${recipe.servings || '2'}</p></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                    <section>
                        <h3 class="text-xl md:text-2xl font-bold mb-6 flex items-center gap-3 text-[var(--m3-on-surface)]">
                            <i data-lucide="shopping-basket" class="text-[var(--m3-primary)]"></i>
                            Ingredients
                        </h3>
                        <ul class="space-y-4">
                            ${(recipe.ingredients || []).map(ing => `
                                <li class="flex items-start gap-4">
                                    <div class="w-5 h-5 rounded-full border-2 border-[var(--m3-primary)]/20 flex-shrink-0 mt-1"></div>
                                    <span class="text-base md:text-lg text-[var(--m3-on-surface)]">${ing}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </section>
                    <section>
                        <h3 class="text-xl md:text-2xl font-bold mb-6 flex items-center gap-3 text-[var(--m3-on-surface)]">
                            <i data-lucide="clipboard-list" class="text-[var(--m3-primary)]"></i>
                            Method
                        </h3>
                        <div class="space-y-6 md:space-y-8">
                            ${(recipe.instructions || []).map((ins, idx) => `
                                <div class="flex gap-6">
                                    <span class="text-3xl md:text-4xl font-black text-[var(--m3-primary)]/10 select-none">${(idx + 1).toString().padStart(2, '0')}</span>
                                    <p class="text-base md:text-lg text-[var(--m3-on-surface-variant)] leading-relaxed pt-1">${ins}</p>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    updateIcons();
}

export function closeDetail() {
    document.getElementById('detail-modal').classList.add('hidden');
}

export function openForm() {
    state.editingRecipe = null;
    document.getElementById('form-title').innerText = 'New Recipe';
    document.getElementById('form-id').value = '';
    document.getElementById('form-recipe-title').value = '';
    document.getElementById('form-recipe-desc').value = '';
    document.getElementById('form-prep').value = '';
    document.getElementById('form-cook').value = '';
    document.getElementById('form-servings').value = 2;
    document.getElementById('form-category').value = 'Dinner';
    document.getElementById('form-image-preview').src = '';
    document.getElementById('form-image-preview').classList.add('hidden');
    document.getElementById('form-image-placeholder').classList.remove('hidden');
    
    document.getElementById('form-ingredients-list').innerHTML = '';
    document.getElementById('form-instructions-list').innerHTML = '';
    addIngredientField();
    addInstructionField();
    
    document.getElementById('form-modal').classList.remove('hidden');
    updateIcons();
}

export function editRecipe(id) {
    const recipe = state.recipes.find(r => r.id === id);
    if (!recipe) return;
    
    state.editingRecipe = recipe;
    document.getElementById('form-title').innerText = 'Edit Recipe';
    document.getElementById('form-id').value = id;
    document.getElementById('form-recipe-title').value = recipe.title;
    document.getElementById('form-recipe-desc').value = recipe.description || '';
    document.getElementById('form-prep').value = recipe.prepTime || '';
    document.getElementById('form-cook').value = recipe.cookTime || '';
    document.getElementById('form-servings').value = recipe.servings || 2;
    document.getElementById('form-category').value = recipe.category;
    
    if (recipe.image) {
        document.getElementById('form-image-preview').src = recipe.image;
        document.getElementById('form-image-preview').classList.remove('hidden');
        document.getElementById('form-image-placeholder').classList.add('hidden');
    } else {
        document.getElementById('form-image-preview').classList.add('hidden');
        document.getElementById('form-image-placeholder').classList.remove('hidden');
    }

    document.getElementById('form-ingredients-list').innerHTML = '';
    (recipe.ingredients || []).forEach(ing => addIngredientField(ing));
    if (!recipe.ingredients || recipe.ingredients.length === 0) addIngredientField();

    document.getElementById('form-instructions-list').innerHTML = '';
    (recipe.instructions || []).forEach(ins => addInstructionField(ins));
    if (!recipe.instructions || recipe.instructions.length === 0) addInstructionField();

    closeDetail();
    document.getElementById('form-modal').classList.remove('hidden');
    updateIcons();
}

export function closeForm() {
    document.getElementById('form-modal').classList.add('hidden');
}

export function addIngredientField(value = '') {
    const container = document.getElementById('form-ingredients-list');
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `
        <input type="text" class="m3-input flex-1 ingredient-val" value="${value}" placeholder="Ingredient">
        <button type="button" onclick="this.parentElement.remove()" class="p-3 text-[#B3261E] hover:bg-[#B3261E]/10 rounded-lg">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
        </button>
    `;
    container.appendChild(div);
    updateIcons();
}

export function addInstructionField(value = '') {
    const container = document.getElementById('form-instructions-list');
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `
        <textarea class="m3-input flex-1 instruction-val min-h-[80px] resize-none" placeholder="Step">${value}</textarea>
        <button type="button" onclick="this.parentElement.remove()" class="p-3 text-[#B3261E] hover:bg-[#B3261E]/10 rounded-lg">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
        </button>
    `;
    container.appendChild(div);
    updateIcons();
}

export function previewImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const preview = document.getElementById('form-image-preview');
            preview.src = reader.result;
            preview.classList.remove('hidden');
            document.getElementById('form-image-placeholder').classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
}

export async function saveRecipe() {
    const titleEle = document.getElementById('form-recipe-title');
    const title = titleEle.value.trim();
    if (!title) {
        alert('Title is required');
        return;
    }

    const id = document.getElementById('form-id').value;
    
    const recipeData = {
        title: title,
        description: document.getElementById('form-recipe-desc').value,
        prepTime: document.getElementById('form-prep').value,
        cookTime: document.getElementById('form-cook').value,
        servings: Number(document.getElementById('form-servings').value),
        category: document.getElementById('form-category').value,
        image: document.getElementById('form-image-preview').classList.contains('hidden') ? null : document.getElementById('form-image-preview').src,
        ingredients: Array.from(document.querySelectorAll('.ingredient-val')).map(i => i.value).filter(v => v.trim()),
        instructions: Array.from(document.querySelectorAll('.instruction-val')).map(i => i.value).filter(v => v.trim()),
        isFavorite: state.editingRecipe ? state.editingRecipe.isFavorite : false,
        createdAt: state.editingRecipe ? state.editingRecipe.createdAt : Date.now()
    };

    try {
        if (id) {
            await db.recipes.update(Number(id), recipeData);
        } else {
            await db.recipes.add(recipeData);
        }

        state.recipes = await db.recipes.toArray();
        closeForm();
        renderRecipes();
    } catch (error) {
        console.error('Failed to save recipe:', error);
        alert('Save failed. Check console for details.');
    }
}

export async function deleteRecipe(id) {
    showConfirm(
        'Delete Recipe?', 
        'This action cannot be undone. Are you sure you want to remove this recipe?',
        async () => {
            try {
                await db.recipes.delete(id);
                state.recipes = await db.recipes.toArray();
                closeDetail();
                renderRecipes();
            } catch (error) {
                console.error('Failed to delete recipe:', error);
            }
        }
    );
}

export function closeConfirm() {
    document.getElementById('confirm-modal').classList.add('hidden');
}
