// Helper for Lucide icons
export function updateIcons() {
    try {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (e) {
        console.warn('Lucide failed to create icons:', e);
    }
}

export function normalizeIngredientName(str) {
    if (!str) return '';
    // Remove numbers, measurements, and common descriptors
    let s = str.toLowerCase();
    s = s.replace(/[0-9]+(\/|.)?[0-9]*\s*(g|ml|l|kg|tsp|tbsp|cup|cups|can|cans|cloves|clove|large|small|medium|sliced|chopped|minced|to taste|pinch|pinches|all-purpose|self-raising|ripe|frozen|mixed|zest of|zest|fresh|grated|for frying)\b/g, '');
    s = s.replace(/[,.;()]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    // Use first one or two words as base
    const words = s.split(' ');
    if (words.length > 2 && words[0] === 'a') return words[1];
    return words.slice(0, 2).join(' ');
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
