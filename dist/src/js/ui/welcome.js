export function initWelcomeModal() {
    if (localStorage.getItem('aubergine_welcomed_jonna')) {
        return;
    }

    const modalHtml = `
        <div id="welcome-modal" class="fixed inset-0 z-[300] flex items-center justify-center p-6 opacity-0 transition-opacity duration-500">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeWelcomeModal()"></div>
            <div class="bg-[var(--m3-surface)] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10 transform scale-95 transition-transform duration-500 flex flex-col items-center p-8 text-center">
                <div class="text-8xl mb-4 animate-bounce">🍆</div>
                <h2 class="text-3xl font-bold text-[var(--m3-on-surface)] mb-4">Welcome back, Jonna!</h2>
                <p class="text-[var(--m3-on-surface-variant)] text-lg mb-6 leading-relaxed">
                    I know you love a good Aubergine... 😉 <br><br>
                    Don't worry, this one's fully cooked and won't leave you disappointed! It's long, thick with features, and ready for you to handle. Dig in and satisfy that appetite!
                </p>
                <button onclick="closeWelcomeModal()" class="w-full py-4 rounded-full font-bold bg-[var(--m3-primary)] text-white shadow-lg hover:shadow-xl hover:bg-[var(--m3-primary)]/90 active:scale-95 transition-all text-lg">
                    I'm Ready to Eat! 🤤
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Trigger animation
    setTimeout(() => {
        const modal = document.getElementById('welcome-modal');
        if (modal) {
            modal.classList.remove('opacity-0');
            modal.children[1].classList.remove('scale-95');
        }
    }, 10);

    window.closeWelcomeModal = () => {
        const modal = document.getElementById('welcome-modal');
        if (modal) {
            modal.classList.add('opacity-0');
            modal.children[1].classList.add('scale-95');
            setTimeout(() => {
                modal.remove();
                localStorage.setItem('aubergine_welcomed_jonna', 'true');
            }, 500);
        }
    };
}
