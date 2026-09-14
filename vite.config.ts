import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },
  build: {
    // Preserve existing build files: this task is strictly additive.
    emptyOutDir: false,
    rolldownOptions: { input: { main: 'index.html', swingAR: 'swing-ar.html' } },
  },
})
