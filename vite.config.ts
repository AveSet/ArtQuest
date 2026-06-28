import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const match = id.match(/quests_(\w+)\.json$/)
          if (match) return `quests-${match[1]}`
          if (id.includes('autoCuratedYoutubeResources')) return 'video-catalog-auto'
          if (id.includes('videoResourcesCurated')) return 'video-catalog-curated'
          if (id.includes('/locales/zh')) return 'i18n-zh'
          if (id.includes('/locales/ja')) return 'i18n-ja'
          if (id.includes('/locales/ko')) return 'i18n-ko'
          if (id.includes('achievements.json')) return 'achievements-data'
          if (id.includes('skillTree.ts')) return 'skill-tree-data'
          if (id.includes('/pages/Gallery') || id.includes('/components/gallery/')) return 'page-gallery'
          if (id.includes('/pages/Skills') || id.includes('SkillTree')) return 'page-skills'
          if (id.includes('node_modules/recharts')) return 'vendor-charts'
        },
      },
    },
  },
})
