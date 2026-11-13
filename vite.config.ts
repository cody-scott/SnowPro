import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base + HashRouter = works on GitHub Pages under any repo path.
export default defineConfig({
  base: './',
  plugins: [react()],
});
