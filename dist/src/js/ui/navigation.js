import { state } from '../state.js';
import { db } from '../db.js';
import { renderRecipes, renderCategories, updateIngredientSuggestions } from './recipes.js';

export async function setView(view) {
    if (location.hash !== `#${view}`) {
        location.hash = view;
    } else {
        renderView(view);
    }
}

export async function renderView(view) {
    if (state.currentView !== view) {
        state.currentCategory = 'All';
        state.recipes = await db.recipes.toArray();
        updateIngredientSuggestions();
    }
    
    state.currentView = view;
    
    if (view !== 'home') {
        const modal = document.getElementById('ingredient-modal');
        if (modal) modal.classList.add('hidden');
    }

    const fab = document.getElementById('global-add-recipe-fab');
    if (fab) {
        if (view === 'home') {
            fab.classList.remove('hidden');
        } else {
            fab.classList.add('hidden');
        }
    }
    
    // Toggle primary view containers
    const recipeGrid = document.getElementById('recipe-grid');
    const settingsPanel = document.getElementById('settings-panel');

    // Toggle main recipe header for a dedicated Settings tab layout
    const mainHeader = document.querySelector('main > header');
    if (mainHeader) {
        if (view === 'settings') {
            mainHeader.classList.add('hidden');
        } else {
            mainHeader.classList.remove('hidden');
        }
    }

    if (view === 'settings') {
        if (recipeGrid) recipeGrid.classList.add('hidden');
        if (settingsPanel) settingsPanel.classList.remove('hidden');
        if (window.renderSettingsUI) window.renderSettingsUI();
    } else {
        if (settingsPanel) settingsPanel.classList.add('hidden');
        if (recipeGrid) recipeGrid.classList.remove('hidden');
    }
    
    document.getElementById('nav-home').className = `nav-rail-icon ${view === 'home' ? 'active' : 'inactive'}`;
    document.getElementById('nav-search').className = `nav-rail-icon ${view === 'search' ? 'active' : 'inactive'}`;
    document.getElementById('nav-explore').className = `nav-rail-icon ${view === 'explore' ? 'active' : 'inactive'}`;
    document.getElementById('nav-settings').className = `nav-rail-icon ${view === 'settings' ? 'active' : 'inactive'}`;
    
    const searchContainer = document.getElementById('search-container');
    if (view === 'search') {
        searchContainer.classList.remove('hidden');
        setTimeout(() => {
            const input = document.getElementById('search-input');
            if (input) input.focus();
        }, 100);
    } else {
        searchContainer.classList.add('hidden');
        state.searchQuery = '';
        const input = document.getElementById('search-input');
        if (input) input.value = '';
    }

    const categoryFilters = document.getElementById('category-filters');
    if (view === 'home' || view === 'explore') {
        categoryFilters.classList.remove('hidden');
        renderCategories();
    } else {
        categoryFilters.classList.add('hidden');
    }

    let titleText = 'Jonna\'s Aubergine 🍆';
    let subtitleText = 'Discover your culinary journey';

    if (view === 'search') {
        titleText = 'Search Recipes';
        subtitleText = 'Find the perfect dish for any occasion';
    } else if (view === 'explore') {
        titleText = 'Explore New Tastes';
        subtitleText = 'Find and add new recipes to your collection';
    } else if (view === 'settings') {
        titleText = 'Settings';
        subtitleText = 'Manage your recipes, backups, and app data';
    }

    document.getElementById('view-title').innerText = titleText;
    document.getElementById('view-subtitle').innerText = subtitleText;
    
    renderRecipes();
}

export function handleSearch(val) {
    state.searchQuery = val.toLowerCase().trim();
    renderRecipes();
}

export function setCategory(cat) {
    state.currentCategory = cat;
    renderCategories();
    renderRecipes();
}
