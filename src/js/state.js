// State
export const state = {
    currentView: 'home', // home, search, explore
    currentCategory: 'All',
    searchQuery: '',
    recipes: [],
    exploreRecipes: [],
    editingRecipe: null,
    selectedIngredientsFilter: [],
    selectedRecipesForList: [],
    shoppingListItems: [], // { text, checked, id }
    ingredientSuggestions: [],
    currentActionRecipe: null,
    isExploringAction: false
};

export const CATEGORIES = ['All', 'Favorites', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];
