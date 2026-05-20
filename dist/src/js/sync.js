import { db } from './db.js';
import { state } from './state.js';
import { renderRecipes, updateIngredientSuggestions } from './ui/recipes.js';
import { loadShoppingListData } from './ui/shopping.js';

// Import/Export Backup Locally (Offline backup)
export async function exportLocalBackup() {
    try {
        console.log('Preparing local backup export...');
        const localRecipes = await db.recipes.toArray();
        const rawShopping = localStorage.getItem('jonna_shopping_list');
        const shoppingData = rawShopping ? JSON.parse(rawShopping) : { selectedRecipesForList: [], shoppingListItems: [] };
        
        const backupPayload = {
            recipes: localRecipes,
            shoppingList: shoppingData,
            exportedAt: Date.now()
        };
        
        const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jonna_aubergine_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Local backup file exported successfully.');
    } catch (e) {
        console.error(`Failed to export local backup: ${e.message}`);
        alert(`Failed to export backup: ${e.message}`);
    }
}

export function importLocalBackup(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data && data.recipes) {
                if (confirm(`This will restore ${data.recipes.length} recipes and replace your current recipes. Proceed?`)) {
                    await db.recipes.clear();
                    await db.recipes.bulkAdd(data.recipes);
                    
                    if (data.shoppingList) {
                        localStorage.setItem('jonna_shopping_list', JSON.stringify(data.shoppingList));
                        loadShoppingListData();
                    }
                    
                    state.recipes = await db.recipes.toArray();
                    updateIngredientSuggestions();
                    renderRecipes();
                    console.log('Backup imported from local file successfully.');
                    alert('Data restored successfully!');
                }
            } else {
                alert('Invalid backup file. Could not find recipes list.');
            }
        } catch (error) {
            alert(`Error reading backup: ${error.message}`);
        }
    };
    reader.readAsText(file);
    // Reset file input value so that importing the same file again triggers change event
    input.value = '';
}

// Danger wipe database
export async function dangerResetDatabase() {
    if (confirm('CRITICAL WARNING: This will permanently delete ALL your recipes and shopping lists. This action is 100% irreversible! Are you absolutely sure?')) {
        if (confirm('Final Confirmation: Type "DELETE" in the next prompt if you wish to wipe all data. Or click cancel.')) {
            const result = prompt('Type DELETE to verify:');
            if (result === 'DELETE') {
                try {
                    await db.recipes.clear();
                    localStorage.removeItem('jonna_shopping_list');
                    
                    state.recipes = [];
                    updateIngredientSuggestions();
                    renderRecipes();
                    loadShoppingListData();
                    console.log('Database wiped. Reset back to clean state.');
                    alert('App database wiped successfully.');
                } catch (e) {
                    alert(`Wipe failed: ${e.message}`);
                }
            }
        }
    }
}
