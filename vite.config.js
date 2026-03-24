import { defineConfig } from 'vite';

export default defineConfig({
  base: '/IntroAboutLitFramework/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
});
