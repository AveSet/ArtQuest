import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'

loadEnv()

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      'process.env.ARTQUEST_GOOGLE_CLIENT_ID': JSON.stringify(
        process.env.ARTQUEST_GOOGLE_CLIENT_ID ?? process.env.VITE_ARTQUEST_GOOGLE_CLIENT_ID ?? '',
      ),
      'process.env.ARTQUEST_GOOGLE_CLIENT_SECRET': JSON.stringify(
        process.env.ARTQUEST_GOOGLE_CLIENT_SECRET ?? process.env.VITE_ARTQUEST_GOOGLE_CLIENT_SECRET ?? '',
      ),
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'cjs',
          entryFileNames: 'preload.js',
        },
      },
    },
  },
  renderer: {
    root: '.',
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: './index.html',
        output: {
          manualChunks(id: string) {
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
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
      },
    },
  },
})
