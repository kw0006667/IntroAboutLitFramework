import { defineConfig } from 'vite';

const deployBase = process.env.DEPLOY_BASE || '/IntroAboutLitFramework/';

export default defineConfig({
  base: deployBase,
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
});
