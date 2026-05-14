// Database
const db = new Dexie('JonnaAubergineDB');
db.version(1).stores({
    recipes: '++id, title, category, isFavorite, createdAt'
});

// State
let currentView = 'home'; // home, favorites
let currentCategory = 'All';
let searchQuery = '';
let recipes = [];
let editingRecipe = null;

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];

// Init
async function init() {
    console.log('Initializing Jonna\'s Aubergine...');
    try {
        await loadRecipes();
        renderCategories();
        renderRecipes();
        lucide.createIcons();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
}

async function loadRecipes() {
    try {
        recipes = await db.recipes.toArray();
        console.log('Recipes loaded from DB:', recipes.length);
    } catch (error) {
        console.error('Failed to load recipes:', error);
        recipes = [];
    }
}

function setView(view) {
    currentView = view;
    document.getElementById('nav-home').className = `nav-rail-icon ${view === 'home' ? 'active' : 'inactive'}`;
    document.getElementById('nav-search').className = `nav-rail-icon ${view === 'search' ? 'active' : 'inactive'}`;
    document.getElementById('nav-favorites').className = `nav-rail-icon ${view === 'favorites' ? 'active' : 'inactive'}`;
    
    // Toggle Search Bar
    const searchContainer = document.getElementById('search-container');
    if (view === 'search') {
        searchContainer.classList.remove('hidden');
        setTimeout(() => document.getElementById('search-input').focus(), 100);
    } else {
        searchContainer.classList.add('hidden');
        searchQuery = '';
        document.getElementById('search-input').value = '';
    }

    const title = view === 'home' ? 'Jonna\'s Aubergine 🍆' : (view === 'search' ? 'Search Recipes' : 'Favorite Recipes');
    document.getElementById('view-title').innerText = title;
    
    if (view === 'search') {
        document.getElementById('view-subtitle').innerText = 'Find the perfect dish for any occasion';
    } else if (view === 'favorites') {
        document.getElementById('view-subtitle').innerText = 'Your handpicked collection';
    } else {
        document.getElementById('view-subtitle').innerText = 'Discover your culinary journey';
    }
    
    renderRecipes();
}

function handleSearch(val) {
    searchQuery = val.toLowerCase().trim();
    renderRecipes();
}

function setCategory(cat) {
    currentCategory = cat;
    renderCategories();
    renderRecipes();
}

function renderCategories() {
    const container = document.getElementById('category-filters');
    if (!container) return;
    
    container.innerHTML = CATEGORIES.map(cat => `
        <button 
            onclick="setCategory('${cat}')" 
            class="px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 whitespace-nowrap ${
                currentCategory === cat 
                ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] shadow-sm' 
                : 'bg-[var(--m3-surface-variant)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-outline)]/20'
            }"
        >
            ${cat}
        </button>
    `).join('');
}

function renderRecipes() {
    const container = document.getElementById('recipe-grid');
    if (!container) return;

    let filtered = [...recipes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (currentView === 'favorites') {
        filtered = filtered.filter(r => r.isFavorite);
    }

    if (currentCategory !== 'All') {
        filtered = filtered.filter(r => r.category === currentCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(r => 
            (r.title && r.title.toLowerCase().includes(searchQuery)) || 
            (r.description && r.description.toLowerCase().includes(searchQuery)) ||
            (r.ingredients && r.ingredients.some(i => i.toLowerCase().includes(searchQuery)))
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-20 flex flex-col items-center justify-center text-[#49454F]/40">
                <i data-lucide="chef-hat" class="w-16 h-16 mb-4 opacity-20"></i>
                <p class="text-xl font-medium">${searchQuery ? 'No recipes match your search' : 'No recipes found here'}</p>
                ${!searchQuery ? '<button onclick="openForm()" class="mt-4 text-[#6750A4] font-bold hover:underline">Add your first recipe</button>' : ''}
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = filtered.map(recipe => {
        // Use a default image if none provided to ensure layout consistency on mobile
        const imageContent = recipe.image 
            ? `<img src="${recipe.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
            : `<div class="w-full h-full flex items-center justify-center opacity-20 text-[var(--m3-primary)] bg-[var(--m3-surface-variant)]">
                    <i data-lucide="utensils" class="w-12 h-12"></i>
               </div>`;

        return `
            <div onclick="openDetail(${recipe.id})" class="m3-card group cursor-pointer flex flex-col h-full rounded-[28px] md:rounded-[32px] overflow-hidden">
                <div class="w-full aspect-video bg-[var(--m3-surface-variant)] rounded-2xl mb-4 overflow-hidden relative">
                    ${imageContent}
                    <button onclick="toggleFavorite(event, ${recipe.id})" class="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-[#1D1B20] hover:bg-[#6750A4]/10 transition-colors z-10 shadow-sm">
                        <i data-lucide="heart" class="${recipe.isFavorite ? 'fill-[#B3261E] text-[#B3261E]' : 'text-[#49454F]'} w-[18px] h-[18px]"></i>
                    </button>
                </div>
                <div class="px-2 pb-2">
                    <h3 class="text-xl md:text-2xl font-bold text-[var(--m3-on-surface)] mb-2 line-clamp-1">${recipe.title}</h3>
                    <p class="text-[var(--m3-on-surface-variant)] text-xs md:text-sm leading-relaxed mb-4 line-clamp-2 min-h-[32px] md:min-h-[40px]">${recipe.description || 'No description.'}</p>
                    <div class="mt-auto flex justify-between items-center py-2 border-t border-[var(--m3-outline)]/20">
                        <span class="text-[10px] md:text-[11px] font-black text-[var(--m3-primary)] uppercase tracking-wider">${recipe.prepTime || '15 MINS'}</span>
                        <div class="flex gap-1">
                            <div class="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--m3-primary)]"></div>
                            <div class="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--m3-primary-container)]"></div>
                            <div class="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--m3-primary-container)]"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

async function toggleFavorite(e, id) {
    e.stopPropagation();
    const recipeIndex = recipes.findIndex(r => r.id === id);
    if (recipeIndex === -1) return;
    
    const recipe = recipes[recipeIndex];
    recipe.isFavorite = !recipe.isFavorite;
    
    try {
        await db.recipes.update(id, { isFavorite: recipe.isFavorite });
        renderRecipes();
    } catch (error) {
        console.error('Failed to toggle favorite:', error);
    }
}

// Detail View
function openDetail(id) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;
    
    const modal = document.getElementById('detail-modal');
    modal.innerHTML = `
        <div class="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[var(--m3-surface)]">
            <!-- Left: Media/Basic Info -->
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
                        <button onclick="editRecipe(${id})" class="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button onclick="deleteRecipe(${id})" class="p-2 bg-white/20 hover:bg-[#B3261E] rounded-full backdrop-blur-md">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right: Content -->
            <div class="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-12 lg:px-16 lg:py-16">
                <div class="mb-8">
                    <span class="inline-block px-4 py-1 bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] rounded-full text-sm font-bold mb-4">${recipe.category}</span>
                    <h2 class="text-3xl md:text-5xl font-bold text-[var(--m3-on-surface)] mb-4">${recipe.title}</h2>
                    <p class="text-lg md:text-xl text-[var(--m3-on-surface-variant)] leading-relaxed italic">${recipe.description || ''}</p>
                </div>

                <div class="grid grid-cols-3 gap-4 py-6 border-y border-[var(--m3-outline)]/20 mb-10">
                    <div class="text-center">
                        <p class="text-[10px] font-black text-[var(--m3-primary)] uppercase mb-1">Prep</p>
                        <p class="text-base font-bold">${recipe.prepTime || 'N/A'}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-[10px] font-black text-[var(--m3-primary)] uppercase mb-1">Cook</p>
                        <p class="text-base font-bold">${recipe.cookTime || 'N/A'}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-[10px] font-black text-[var(--m3-primary)] uppercase mb-1">Serves</p>
                        <p class="text-base font-bold">${recipe.servings || 'N/A'}</p>
                    </div>
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
    lucide.createIcons();
}

function closeDetail() {
    document.getElementById('detail-modal').classList.add('hidden');
}

// Form Logic
function openForm() {
    editingRecipe = null;
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
    lucide.createIcons();
}

function editRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;
    
    editingRecipe = recipe;
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
    lucide.createIcons();
}

function closeForm() {
    document.getElementById('form-modal').classList.add('hidden');
}

function addIngredientField(value = '') {
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
    lucide.createIcons();
}

function addInstructionField(value = '') {
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
    lucide.createIcons();
}

function previewImage(input) {
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

async function saveRecipe() {
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
        isFavorite: editingRecipe ? editingRecipe.isFavorite : false,
        createdAt: editingRecipe ? editingRecipe.createdAt : Date.now()
    };

    try {
        if (id) {
            await db.recipes.update(Number(id), recipeData);
            console.log('Recipe updated:', id);
        } else {
            const newId = await db.recipes.add(recipeData);
            console.log('Recipe added with ID:', newId);
        }

        await loadRecipes();
        closeForm();
        renderRecipes();
    } catch (error) {
        console.error('Failed to save recipe:', error);
        alert('Save failed. Check console for details.');
    }
}

async function deleteRecipe(id) {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    try {
        await db.recipes.delete(id);
        await loadRecipes();
        closeDetail();
        renderRecipes();
    } catch (error) {
        console.error('Failed to delete recipe:', error);
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered:', reg))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}

// PWA Install Logic
let deferredPrompt;
const installBtn = document.getElementById('install-button');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    if (installBtn) {
        installBtn.classList.remove('hidden');
        lucide.createIcons();
    }
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        deferredPrompt = null;
        // Hide the install button
        installBtn.classList.add('hidden');
    });
}

window.addEventListener('appinstalled', () => {
    // Log install to analytics
    console.log('PWA was installed');
    // Hide the install button
    if (installBtn) installBtn.classList.add('hidden');
});
