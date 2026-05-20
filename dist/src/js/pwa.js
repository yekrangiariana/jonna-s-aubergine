import { updateIcons } from './utils.js';

let deferredPrompt = null;
const TOAST_DISMISSED_KEY = 'aubergine_pwa_toast_dismissed';

export function initPWA() {
    console.log('Initializing PWA manager...');
    
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
        console.warn('Install prompt not available. Ensure you are on HTTPS or localhost and Chrome has qualified the app.');
        return;
    }
    
    // Hide the toast prompt
    hideToast();
    
    // Show the browser's install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
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
    // Remember the user's preference for 7 days so we do not prompt too aggressively
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(TOAST_DISMISSED_KEY, expiry.toString());
};

function updatePWAUI(state) {
    const toast = document.getElementById('pwa-install-toast');
    const settingsCard = document.getElementById('pwa-settings-card');
    
    const settingsInstallBtn = document.getElementById('pwa-settings-install-btn');
    const settingsInstalledMsg = document.getElementById('pwa-settings-installed-msg');
    const settingsIncompatibleMsg = document.getElementById('pwa-settings-incompatible-msg');
    const settingsDesc = document.getElementById('pwa-settings-desc');
    const statusBadge = document.getElementById('pwa-status-badge');

    if (state === 'installed') {
        // App is installed and running in standalone
        hideToast();
        if (settingsCard) {
            settingsCard.classList.remove('from-[var(--m3-surface)]', 'to-[var(--m3-primary-container)]/10');
            settingsCard.classList.add('bg-emerald-500/5', 'border-emerald-500/20');
        }
        if (settingsInstallBtn) settingsInstallBtn.classList.add('hidden');
        if (settingsIncompatibleMsg) settingsIncompatibleMsg.classList.add('hidden');
        if (settingsInstalledMsg) settingsInstalledMsg.classList.remove('hidden');
        if (settingsDesc) settingsDesc.innerText = 'Aubergine is installed and running as a standalone app! Cook anywhere, anytime with full offline capabilities.';
        if (statusBadge) {
            statusBadge.innerText = 'Active App';
            statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600';
        }
    } else if (state === 'installable') {
        // App can be installed
        if (settingsCard) {
            settingsCard.classList.remove('bg-emerald-500/5', 'border-emerald-500/20');
            settingsCard.classList.add('from-[var(--m3-surface)]', 'to-[var(--m3-primary-container)]/10');
        }
        if (settingsInstallBtn) settingsInstallBtn.classList.remove('hidden');
        if (settingsInstalledMsg) settingsInstalledMsg.classList.add('hidden');
        if (settingsIncompatibleMsg) settingsIncompatibleMsg.classList.add('hidden');
        if (settingsDesc) settingsDesc.innerText = 'Install Aubergine on your device for offline cooking, seamless full-screen layout, and native app behavior.';
        if (statusBadge) {
            statusBadge.innerText = 'Installable';
            statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--m3-primary)]/10 text-[var(--m3-primary)]';
        }

        // Show toast on home/search/explore if not recently dismissed
        const dismissedExpiry = localStorage.getItem(TOAST_DISMISSED_KEY);
        const isRecentlyDismissed = dismissedExpiry && parseInt(dismissedExpiry, 10) > Date.now();
        
        if (!isRecentlyDismissed && toast) {
            setTimeout(() => {
                toast.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none');
                toast.classList.add('translate-y-0', 'opacity-100');
            }, 2000);
        }
    } else if (state === 'incompatible') {
        // Not secure (not HTTPS / localhost), so Chrome disables PWA
        hideToast();
        if (settingsInstallBtn) settingsInstallBtn.classList.add('hidden');
        if (settingsInstalledMsg) settingsInstalledMsg.classList.add('hidden');
        if (settingsIncompatibleMsg) settingsIncompatibleMsg.classList.remove('hidden');
        if (settingsDesc) settingsDesc.innerHTML = 'PWA installation requires a secure connection (<strong>HTTPS</strong>) or <strong>localhost</strong>. Insecure HTTP connections do not allow installation.';
        if (statusBadge) {
            statusBadge.innerText = 'Incompatible';
            statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-600';
        }
    } else {
        // Checking or not promptable yet (Chrome still evaluating criteria or already installed in browser but running in tab)
        hideToast();
        if (settingsInstallBtn) settingsInstallBtn.classList.add('hidden');
        if (settingsInstalledMsg) settingsInstalledMsg.classList.add('hidden');
        if (settingsIncompatibleMsg) {
            // If already installed but in tab, or still evaluating, we show standard message but hide buttons
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isSecure) {
                settingsIncompatibleMsg.classList.add('hidden');
                if (settingsDesc) settingsDesc.innerText = 'To install, use Chrome\'s menu options ("Install app" or "Add to Home screen") or wait for the system to prompt.';
                if (statusBadge) {
                    statusBadge.innerText = 'Web App';
                    statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--m3-outline)]/20 text-[var(--m3-on-surface-variant)]';
                }
            } else {
                updatePWAUI('incompatible');
            }
        }
    }
    
    updateIcons();
}

function hideToast() {
    const toast = document.getElementById('pwa-install-toast');
    if (toast) {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none');
    }
}

// Attach a helper to let other pages update settings UI on transition
window.renderSettingsUI = function() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
        updatePWAUI('installed');
    } else if (deferredPrompt) {
        updatePWAUI('installable');
    } else {
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        updatePWAUI(isSecure ? 'checking' : 'incompatible');
    }
};
