import { defineConfig, loadEnv } from 'vite' // Added loadEnv here
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // This loads your system environment variables (like the one from GitHub Actions)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    // GitHub Pages serves the app from /<repo>/ — CI sets BASE_PATH accordingly
    base: env.BASE_PATH ?? '/',
  }
})