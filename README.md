# Culina - Static Recipe App

This is a purely static, client-side web application. It uses **React**, **Vite**, and **Dexie (IndexedDB)** to manage your recipes entirely within your browser.

## Why use `npm`?
Even though the application runs statically in the browser, `npm` (Node Package Manager) is used during **development** to:
1. **Install tools**: Vite, React, and other libraries.
2. **Run a development server**: `npm run dev` lets you see changes in real-time.
3. **Build the production site**: `npm run build` compiles your code into optimized static HTML, CSS, and JS files.

## Running on GitHub Pages
Yes! You can run this on GitHub Pages as is.

1. **Build the app**:
   ```bash
   npm run build
   ```
2. **Deploy the `dist/` folder**:
   GitHub Pages will serve everything inside the `dist/` folder. The app is configured to use relative paths, so it will work automatically regardless of your repository name.

## Static Offline Storage
The app uses **Dexie.js** which stores data in your browser's IndexedDB. Your recipes will persist on your device even if you close the browser or go offline, but they will not sync between different devices/browsers unless you implement a backend sync later.
