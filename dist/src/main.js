import { state } from './js/state.js';
import { db } from './js/db.js';
import { updateIcons } from './js/utils.js';
import { renderRecipes, renderCategories, updateIngredientSuggestions } from './js/ui/recipes.js';
import { 
    loadShoppingListData, 
    toggleIngredientFilter, 
    closeIngredientModal, 
    clearIngredientFilter, 
    handleIngredientKey, 
    addIngredientTag, 
    removeIngredientTag, 
    openShoppingList, 
    closeShoppingList, 
    removeRecipeFromList, 
    toggleShoppingItem, 
    editShoppingItem, 
    removeShoppingItem, 
    addShoppingItem, 
    clearShoppingList 
} from './js/ui/shopping.js';
import { setView, renderView, handleSearch, setCategory } from './js/ui/navigation.js';
import { 
    openDetail, 
    openExploreDetail, 
    closeDetail, 
    openForm, 
    closeForm, 
    addIngredientField, 
    addInstructionField, 
    previewImage, 
    saveRecipe, 
    closeConfirm 
} from './js/ui/modals.js';
import { openRecipeActions, closeRecipeActions, handleAction } from './js/ui/actions.js';
import { 
    initGsiClient, 
    saveClientId, 
    triggerConnect, 
    triggerDisconnect, 
    toggleAutoSyncPref, 
    performSync, 
    toggleSetupInstructions, 
    exportLocalBackup, 
    importLocalBackup, 
    dangerResetDatabase,
    renderSyncUI
} from './js/sync.js';

// Expose to global scope for HTML onclick handlers immediately
window.setView = setView;
window.handleSearch = handleSearch;
window.setCategory = setCategory;
window.openShoppingList = openShoppingList;
window.closeShoppingList = closeShoppingList;
window.openForm = openForm;
window.closeForm = closeForm;
window.saveRecipe = saveRecipe;
window.previewImage = previewImage;
window.addIngredientField = addIngredientField;
window.addInstructionField = addInstructionField;
window.toggleIngredientFilter = toggleIngredientFilter;
window.closeIngredientModal = closeIngredientModal;
window.clearIngredientFilter = clearIngredientFilter;
window.handleIngredientKey = handleIngredientKey;
window.openDetail = openDetail;
window.openExploreDetail = openExploreDetail;
window.closeDetail = closeDetail;
window.openRecipeActions = openRecipeActions;
window.closeRecipeActions = closeRecipeActions;
window.handleAction = handleAction;
window.addIngredientTag = addIngredientTag;
window.removeIngredientTag = removeIngredientTag;
window.removeRecipeFromList = removeRecipeFromList;
window.toggleShoppingItem = toggleShoppingItem;
window.editShoppingItem = editShoppingItem;
window.removeShoppingItem = removeShoppingItem;
window.addShoppingItem = addShoppingItem;
window.clearShoppingList = clearShoppingList;
window.closeConfirm = closeConfirm;

// Expose Sync Handlers
window.saveClientId = saveClientId;
window.triggerConnect = triggerConnect;
window.triggerDisconnect = triggerDisconnect;
window.toggleAutoSyncPref = toggleAutoSyncPref;
window.triggerBackup = () => performSync('upload');
window.triggerRestore = () => performSync('download');
window.toggleSetupInstructions = toggleSetupInstructions;
window.exportLocalBackup = exportLocalBackup;
window.importLocalBackup = importLocalBackup;
window.dangerResetDatabase = dangerResetDatabase;
window.renderSyncUI = renderSyncUI;
window.renderSettingsUI = () => {}; // Pluralistic settings placeholder

// Init
async function init() {
    console.log('Initializing Jonna\'s Aubergine (Refactored)...');
    updateIcons(); // Initial call for static icons
    try {
        initGsiClient(); // Start Google GSI Library load
        state.recipes = await db.recipes.toArray();
        await loadExploreRecipes();
        loadShoppingListData();
        
        // Handle initial routing
        const hash = location.hash.replace('#', '') || 'home';
        renderView(hash);
        
        renderCategories();
        renderRecipes();
        updateIngredientSuggestions();
        updateIcons();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
}

async function loadExploreRecipes() {
    try {
        const response = await fetch('recipes.json');
        if (response.ok) {
            state.exploreRecipes = await response.json();
            updateIngredientSuggestions();
        }
    } catch (error) {
        console.error('Failed to load explore recipes:', error);
    }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered:', reg))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}

// Handle browser back/forward and gestures
window.addEventListener('hashchange', () => {
    const view = location.hash.replace('#', '') || 'home';
    renderView(view);
});

// Start initialization
init();
