// Helper for Lucide icons
export function updateIcons() {
    try {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else {
            // If not loaded yet, try again shortly
            setTimeout(() => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 100);
        }
    } catch (e) {
        console.warn('Lucide failed to create icons:', e);
    }
}

export function singularize(word) {
    if (!word) return '';
    const w = word.toLowerCase().trim();
    if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.endsWith('oes')) return w.slice(0, -2);
    if (w.endsWith('shes') || w.endsWith('ches')) return w.slice(0, -2);
    if (w.endsWith('ves')) return w.slice(0, -3) + 'f';
    if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is') && !w.endsWith('as')) return w.slice(0, -1);
    return w;
}

export function normalizeIngredientName(str) {
    if (!str) return '';
    let s = str.toLowerCase();
    
    // Remove Unicode fractions, numbers, ranges (e.g. 550-600ml, 3-4, 1/2, 1½, ¼)
    s = s.replace(/[0-9¼½¾⅛⅜⅝⅞⅓⅔½⅓¼¾⅛]+([-–/.]?[0-9¼½¾⅛⅜⅝⅞⅓⅔½⅓¼¾⅛]+)?/g, '');
    
    const units = [
        'g', 'ml', 'l', 'kg', 'tsp', 'tbsp', 'cup', 'cups', 'can', 'cans', 'cloves', 'clove', 
        'pinch', 'pinches', 'sprig', 'sprigs', 'leaf', 'leaves', 'sheet', 'sheets', 'tbsp', 'tsp', 
        'teaspoon', 'teaspoons', 'tablespoon', 'tablespoons', 'gram', 'grams', 'milliliter', 'milliliters',
        'spear', 'spears', 'pot', 'pots', 'slice', 'slices', 'bag', 'bags', 'bunch', 'bunches', 'head', 'heads'
    ];
    
    const descriptors = [
        'large', 'small', 'medium', 'sliced', 'chopped', 'minced', 'to taste', 'all-purpose', 
        'self-raising', 'ripe', 'frozen', 'mixed', 'zest of', 'zest', 'fresh', 'grated', 
        'for frying', 'unsalted', 'salted', 'plain', 'whole', 'double', 'caster', 'dark', 'neutral',
        'beaten', 'crushed', 'finely', 'softly', 'whipped', 'bruised', 'melted', 'peeled', 'diced',
        'cold', 'warm', 'hot', 'of', 'in the pod', 'in', 'sweet', 'smoked', 'for greasing', 'runny',
        'white', 'brown', 'yellow', 'red', 'green', 'blue', 'wet', 'flaky', 'desiccated', 'slivered',
        'to serve', 'organic', 'powder', 'extract', 'fluid', 'ounces', 'oz', 'lb', 'lbs'
    ];
    
    const unitRegex = new RegExp(`\\b(${units.join('|')})\\b`, 'g');
    const descRegex = new RegExp(`\\b(${descriptors.join('|')})\\b`, 'g');
    
    s = s.replace(unitRegex, '');
    s = s.replace(descRegex, '');
    s = s.replace(/[,.;()]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    
    const words = s.split(' ')
        .map(w => singularize(w))
        .filter(w => w && w !== 'a' && w !== 'the' && w !== 'and' && w !== 'or' && w !== 'with');
    
    return words.slice(0, 2).join(' ');
}

export function isIngredientMatch(recipeIngredient, filterIngredient) {
    if (!recipeIngredient || !filterIngredient) return false;
    const riClean = recipeIngredient.toLowerCase().replace(/[,.;()]/g, '');
    const fiClean = filterIngredient.toLowerCase().replace(/[,.;()]/g, '');
    
    const riWords = riClean.split(/\s+/).map(w => singularize(w)).filter(Boolean);
    const fiWords = fiClean.split(/\s+/).map(w => singularize(w)).filter(Boolean);
    
    return fiWords.every(fw => riWords.some(rw => rw.includes(fw) || fw.includes(rw)));
}

// Confirm Modal Logic
export function showFeedback(title, message) {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    
    const cancelBtn = modal.querySelector('button[onclick="closeConfirm()"]');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    
    const btn = document.getElementById('confirm-button');
    btn.innerText = 'Got it';
    btn.className = 'px-6 py-2 rounded-full font-bold bg-[var(--m3-primary)] text-white shadow-sm transition-colors';
    
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.onclick = () => {
        window.closeConfirm();
        // Restore for next use
        if (cancelBtn) cancelBtn.classList.remove('hidden');
        newBtn.innerText = 'Delete';
        newBtn.className = 'px-6 py-2 rounded-full font-bold bg-[#B3261E] text-white hover:bg-[#8C1D18] shadow-sm transition-colors';
    };
    
    modal.classList.remove('hidden');
}

export function showConfirm(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    
    const btn = document.getElementById('confirm-button');
    // Using a new button each time to clear previous event listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.onclick = async () => {
        await onConfirm();
        window.closeConfirm();
    };
    
    modal.classList.remove('hidden');
}
