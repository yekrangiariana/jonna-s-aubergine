import { db } from './db.js';
import { state } from './state.js';
import { updateIcons } from './utils.js';
import { renderRecipes, updateIngredientSuggestions } from './ui/recipes.js';
import { loadShoppingListData, saveShoppingListData } from './ui/shopping.js';

export const syncState = {
    status: 'disconnected', // disconnected, connecting, connected, syncing, error
    lastSyncTime: localStorage.getItem('gdrive_last_sync') || 'Never',
    connectedEmail: localStorage.getItem('gdrive_sync_email') || 'None',
    logs: JSON.parse(localStorage.getItem('gdrive_sync_logs') || '[]'),
    autoSync: localStorage.getItem('gdrive_auto_sync') === 'true'
};

let tokenClient = null;
let accessToken = sessionStorage.getItem('gdrive_access_token') || '';
let tokenExpiry = Number(sessionStorage.getItem('gdrive_access_token_expiry') || '0');

// Log event helper
export function logEvent(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logMsg = `[${timestamp}] ${message}`;
    syncState.logs.unshift(logMsg);
    if (syncState.logs.length > 50) syncState.logs.pop(); // Keep last 50 logs
    localStorage.setItem('gdrive_sync_logs', JSON.stringify(syncState.logs));
    
    // Auto render if on sync page
    const list = document.getElementById('sync-logs-list');
    if (list) {
        renderSyncLogs();
    }
}

export function renderSyncLogs() {
    const list = document.getElementById('sync-logs-list');
    if (!list) return;
    if (syncState.logs.length === 0) {
        list.innerHTML = `<p class="opacity-50 italic">No sync activities logged yet.</p>`;
    } else {
        list.innerHTML = syncState.logs.map(log => `<p class="leading-relaxed py-0.5 border-b border-[var(--m3-outline)]/5">${log}</p>`).join('');
    }
}

// Initial check for setup and client ID
export function getSavedClientId() {
    return localStorage.getItem('gdrive_client_id') || '';
}

export function saveClientId(clientId) {
    const cleaned = clientId.trim();
    if (!cleaned) {
        alert('Please enter a valid Client ID.');
        return;
    }
    localStorage.setItem('gdrive_client_id', cleaned);
    logEvent('Google OAuth Client ID saved.');
    initGsiClient();
    renderSyncUI();
}

// Load GSI client library dynamically
export function initGsiClient() {
    const clientId = getSavedClientId();
    if (!clientId) {
        logEvent('OAuth Client ID not configured yet. Please configure it to sync.');
        return;
    }

    try {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
                callback: async (tokenResponse) => {
                    if (tokenResponse.error) {
                        syncState.status = 'error';
                        logEvent(`Authentication failed: ${tokenResponse.error}`);
                        renderSyncUI();
                        return;
                    }
                    
                    accessToken = tokenResponse.access_token;
                    // Token is valid for 1 hour
                    tokenExpiry = Date.now() + (Number(tokenResponse.expires_in) * 1000);
                    sessionStorage.setItem('gdrive_access_token', accessToken);
                    sessionStorage.setItem('gdrive_access_token_expiry', tokenExpiry.toString());
                    
                    syncState.status = 'connected';
                    logEvent('Authenticated successfully with Google Drive.');
                    
                    // Fetch user email to display
                    await fetchUserEmail();
                    renderSyncUI();
                    
                    // Trigger an initial sync check
                    if (syncState.autoSync) {
                        await performSync('download');
                    }
                }
            });
            logEvent('Google Identity Services client initialized.');
        } else {
            // Retry in 500ms if script is still loading
            setTimeout(initGsiClient, 500);
        }
    } catch (e) {
        logEvent(`Error initializing GSI: ${e.message}`);
    }
}

async function fetchUserEmail() {
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            syncState.connectedEmail = data.email || 'Connected';
            localStorage.setItem('gdrive_sync_email', syncState.connectedEmail);
        }
    } catch (e) {
        syncState.connectedEmail = 'Connected Account';
    }
}

export function isTokenValid() {
    return accessToken && tokenExpiry > Date.now();
}

// Request Token
export function triggerConnect() {
    if (!getSavedClientId()) {
        alert('Please save your Google Client ID first!');
        return;
    }
    
    if (!tokenClient) {
        initGsiClient();
    }
    
    if (tokenClient) {
        syncState.status = 'connecting';
        renderSyncUI();
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        alert('Google client library is still loading. Please wait a moment and try again.');
    }
}

export function triggerDisconnect() {
    accessToken = '';
    tokenExpiry = 0;
    sessionStorage.removeItem('gdrive_access_token');
    sessionStorage.removeItem('gdrive_access_token_expiry');
    localStorage.removeItem('gdrive_sync_email');
    
    syncState.status = 'disconnected';
    syncState.connectedEmail = 'None';
    logEvent('Disconnected Google Account.');
    renderSyncUI();
}

// REST Drive: find backup file
async function findBackupFile() {
    const url = 'https://www.googleapis.com/drive/v3/files?q=name=\'jonna_aubergine_backup.json\' and trashed=false';
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        }
    });
    
    if (!res.ok) {
        throw new Error(`Failed to query Google Drive: ${res.statusText}`);
    }
    
    const data = await res.json();
    if (data.files && data.files.length > 0) {
        return data.files[0].id;
    }
    return null;
}

// Upload backup
async function uploadBackup(backupData) {
    const fileId = await findBackupFile();
    
    const boundary = 'foo_bar_boundary';
    const metadata = {
        name: 'jonna_aubergine_backup.json',
        mimeType: 'application/json'
    };
    
    const multipartBody = 
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${JSON.stringify(backupData)}\r\n` +
        `--${boundary}--`;
        
    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';
    
    if (fileId) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
        method = 'PATCH';
    }
    
    const res = await fetch(url, {
        method: method,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
    });
    
    if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
    }
    
    const responseJson = await res.json();
    return responseJson;
}

// Download backup
async function downloadBackup(fileId) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!res.ok) {
        throw new Error(`Download failed: ${res.statusText}`);
    }
    
    return await res.json();
}

// Primary Manual Operations
export async function performSync(mode = 'upload') {
    if (!isTokenValid()) {
        logEvent('Session expired or unauthorized. Please re-connect Google account.');
        syncState.status = 'disconnected';
        renderSyncUI();
        return;
    }
    
    syncState.status = 'syncing';
    renderSyncUI();
    
    try {
        if (mode === 'upload') {
            logEvent('Starting backup to Google Drive...');
            
            // Collate data
            const localRecipes = await db.recipes.toArray();
            const rawShopping = localStorage.getItem('jonna_shopping_list');
            const shoppingData = rawShopping ? JSON.parse(rawShopping) : { selectedRecipesForList: [], shoppingListItems: [] };
            
            const backupPayload = {
                recipes: localRecipes,
                shoppingList: shoppingData,
                exportedAt: Date.now()
            };
            
            await uploadBackup(backupPayload);
            
            syncState.lastSyncTime = new Date().toLocaleString();
            localStorage.setItem('gdrive_last_sync', syncState.lastSyncTime);
            
            syncState.status = 'connected';
            logEvent('Backup uploaded successfully!');
        } else if (mode === 'download') {
            logEvent('Retrieving cloud backup...');
            const fileId = await findBackupFile();
            if (!fileId) {
                logEvent('No existing Google Drive backup file found.');
                syncState.status = 'connected';
                renderSyncUI();
                return;
            }
            
            const data = await downloadBackup(fileId);
            if (data && data.recipes) {
                logEvent(`Found backup containing ${data.recipes.length} recipes. Restoring locally...`);
                
                // Clear local DB and load new
                await db.recipes.clear();
                await db.recipes.bulkAdd(data.recipes);
                
                // Restore shopping list
                if (data.shoppingList) {
                    localStorage.setItem('jonna_shopping_list', JSON.stringify(data.shoppingList));
                    loadShoppingListData();
                }
                
                // Reload state & UI
                state.recipes = await db.recipes.toArray();
                updateIngredientSuggestions();
                renderRecipes();
                
                syncState.lastSyncTime = new Date().toLocaleString();
                localStorage.setItem('gdrive_last_sync', syncState.lastSyncTime);
                
                syncState.status = 'connected';
                logEvent('Database restored from Cloud successfully.');
            } else {
                throw new Error('Downloaded backup payload was empty or corrupt.');
            }
        }
    } catch (e) {
        syncState.status = 'error';
        logEvent(`Sync error (${mode}): ${e.message}`);
    }
    
    renderSyncUI();
}

// Queue Auto Sync (with debounce)
let autoSyncTimeout = null;
export function queueAutoSync() {
    if (!syncState.autoSync || !isTokenValid()) return;
    
    if (autoSyncTimeout) clearTimeout(autoSyncTimeout);
    autoSyncTimeout = setTimeout(async () => {
        logEvent('Auto-sync triggered by database modifications.');
        await performSync('upload');
    }, 5000); // 5 second debounce
}

export function toggleAutoSyncPref(checked) {
    syncState.autoSync = checked;
    localStorage.setItem('gdrive_auto_sync', checked ? 'true' : 'false');
    logEvent(`Auto-sync ${checked ? 'enabled' : 'disabled'}.`);
}

// Global UI renderer bridge
export function renderSyncUI() {
    const statusBadge = document.getElementById('sync-status-badge');
    const lastSyncTimeLabel = document.getElementById('sync-last-time');
    const connectedEmailLabel = document.getElementById('sync-connected-email');
    const actionsSection = document.getElementById('sync-actions-section');
    const connectBtn = document.getElementById('sync-connect-btn');
    const clientIdInput = document.getElementById('sync-client-id-input');
    const autoSyncToggle = document.getElementById('sync-auto-toggle');
    
    // Status text styles
    let statusClass = 'px-4 py-1.5 rounded-full text-xs font-black bg-[var(--m3-outline)]/20 text-[var(--m3-on-surface-variant)] uppercase tracking-wider';
    if (syncState.status === 'connected') {
        statusClass = 'px-4 py-1.5 rounded-full text-xs font-black bg-green-500/20 text-green-700 dark:text-green-300 uppercase tracking-wider';
    } else if (syncState.status === 'syncing' || syncState.status === 'connecting') {
        statusClass = 'px-4 py-1.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase tracking-wider animate-pulse';
    } else if (syncState.status === 'error') {
        statusClass = 'px-4 py-1.5 rounded-full text-xs font-black bg-red-500/20 text-red-700 dark:text-red-300 uppercase tracking-wider';
    }
    
    if (statusBadge) {
        statusBadge.className = statusClass;
        statusBadge.innerText = syncState.status;
    }
    
    if (lastSyncTimeLabel) lastSyncTimeLabel.innerText = syncState.lastSyncTime;
    if (connectedEmailLabel) connectedEmailLabel.innerText = syncState.connectedEmail;
    
    if (actionsSection) {
        if (syncState.status === 'connected' || syncState.status === 'syncing') {
            actionsSection.classList.remove('hidden');
        } else {
            actionsSection.classList.add('hidden');
        }
    }
    
    if (connectBtn) {
        const clientId = getSavedClientId();
        if (clientId) {
            connectBtn.disabled = syncState.status === 'syncing' || syncState.status === 'connecting' || syncState.status === 'connected';
            connectBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            connectBtn.disabled = true;
            connectBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
    
    if (clientIdInput) {
        clientIdInput.value = getSavedClientId();
    }
    
    if (autoSyncToggle) {
        autoSyncToggle.checked = syncState.autoSync;
    }
    
    renderSyncLogs();
    updateIcons();
}

// Collapsible setup toggle
export function toggleSetupInstructions() {
    const panel = document.getElementById('setup-instructions-panel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
}

// Import/Export Backup Locally (Offline backup)
export async function exportLocalBackup() {
    try {
        logEvent('Preparing local backup export...');
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
        logEvent('Local backup file exported successfully.');
    } catch (e) {
        logEvent(`Failed to export local backup: ${e.message}`);
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
                if (confirm(`This will append or restore ${data.recipes.length} recipes. Proceed?`)) {
                    await db.recipes.clear();
                    await db.recipes.bulkAdd(data.recipes);
                    
                    if (data.shoppingList) {
                        localStorage.setItem('jonna_shopping_list', JSON.stringify(data.shoppingList));
                        loadShoppingListData();
                    }
                    
                    state.recipes = await db.recipes.toArray();
                    updateIngredientSuggestions();
                    renderRecipes();
                    logEvent('Backup imported from local file successfully.');
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
}

// Danger wipe
export async function dangerResetDatabase() {
    if (confirm('CRITICAL WARNING: This will permanently delete ALL your recipes and shopping lists. This action is 100% irreversible! Are you absolutely sure?')) {
        if (confirm('Final Confirmation: Type "DELETE" in the next prompt if you wish to wipe all data. Or click cancel.')) {
            const result = prompt('Type DELETE to verify:');
            if (result === 'DELETE') {
                try {
                    await db.recipes.clear();
                    localStorage.removeItem('jonna_shopping_list');
                    localStorage.removeItem('gdrive_last_sync');
                    localStorage.removeItem('gdrive_sync_logs');
                    syncState.logs = [];
                    
                    state.recipes = [];
                    updateIngredientSuggestions();
                    renderRecipes();
                    loadShoppingListData();
                    logEvent('Database wiped. Reset back to clean state.');
                    alert('App database wiped successfully.');
                    
                    if (syncState.status === 'connected') {
                        triggerDisconnect();
                    }
                } catch (e) {
                    alert(`Wipe failed: ${e.message}`);
                }
            }
        }
    }
}
