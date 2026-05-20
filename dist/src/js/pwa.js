import { updateIcons } from './utils.js';

let deferredPrompt = null;
const TOAST_DISMISSED_KEY = 'aubergine_pwa_toast_dismissed_v2';

export function initPWA() {
    console.log('Initializing PWA manager...');
    
    // Clean up expired dismiss keys so the toast can reappear
    const dismissedExpiry = localStorage.getItem(TOAST_DISMISSED_KEY);
    if (dismissedExpiry && parseInt(dismissedExpiry, 10) < Date.now()) {
        localStorage.removeItem(TOAST_DISMISSED_KEY);
        console.log('PWA toast dismiss key expired — cleared.');
    }

    // 1. Detect if already running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    if (isStandalone) {
        console.log('Aubergine is running in standalone mode.');
        updatePWAUI('installed');
        return;
    }

    // 2. Listen for Chrome's beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        
        // Save the event so it can be triggered later.
        deferredPrompt = e;
        console.log('PWA installation is available (beforeinstallprompt fired).');
        
        updatePWAUI('installable');
    });

    // 3. Listen for successful installation
    window.addEventListener('appinstalled', (evt) => {
        console.log('Aubergine PWA was successfully installed.');
        deferredPrompt = null;
        updatePWAUI('installed');
    });
    
    // 4. Initial UI check (fallback if neither event has fired yet)
    setTimeout(() => {
        if (!deferredPrompt && !isStandalone) {
            // If it's not local or not HTTPS, PWA installation will not be supported by Chrome
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            updatePWAUI(isSecure ? 'checking' : 'incompatible');
        }
    }, 1500);
}

// Expose trigger and dismiss functions globally for inline HTML click handlers
window.triggerPwaInstall = async function() {
    if (!deferredPrompt) {
        // Detect if on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            alert('To install Aubergine on iOS:\n1. Tap the Share button in Safari (at the bottom or top of the screen).\n2. Scroll down and select "Add to Home Screen".');
        } else {
            alert('To install Aubergine on Android:\n1. Tap Chrome\'s menu (the three dots ⋮ in the top right).\n2. Select "Install app" or "Add to Home screen".');
        }
        return;
    }
    
    // Hide the toast prompt
    hideToast();
    
    try {
        // Show the browser's install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
    } catch (err) {
        console.error('Installation prompt failed:', err);
    }
    
    // We've used the prompt, clear it
    deferredPrompt = null;
    
    // Re-evaluate UI states
    setTimeout(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        if (isStandalone) {
            updatePWAUI('installed');
        } else {
            updatePWAUI('checking');
        }
    }, 1000);
};

window.dismissPwaToast = function() {
    hideToast();
    // Remember the user's preference for 24 hours so we do not prompt too aggressively
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(TOAST_DISMISSED_KEY, expiry.toString());
};

function updatePWAUI(state) {
    const toast = document.getElementById('pwa-install-toast');

    if (state === 'installed') {
        hideToast();
    } else if (state === 'installable') {
        // Show toast on home/search/explore if not recently dismissed
        const dismissedExpiry = localStorage.getItem(TOAST_DISMISSED_KEY);
        const isRecentlyDismissed = dismissedExpiry && parseInt(dismissedExpiry, 10) > Date.now();
        
        if (!isRecentlyDismissed && toast) {
            setTimeout(() => {
                toast.classList.remove('-translate-y-24', 'opacity-0', 'pointer-events-none');
                toast.classList.add('translate-y-0', 'opacity-100');
            }, 2000);
        }
    } else {
        hideToast();
    }
    
    updateIcons();
}

function hideToast() {
    const toast = document.getElementById('pwa-install-toast');
    if (toast) {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('-translate-y-24', 'opacity-0', 'pointer-events-none');
    }
}

// Dummy helper since settings card was removed
window.renderSettingsUI = function() {
    // No-op
};
