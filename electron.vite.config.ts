import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      'process.env.ARTQUEST_GOOGLE_CLIENT_ID': JSON.stringify(
        process.env.ARTQUEST_GOOGLE_CLIENT_ID ?? '',
      ),
      'process.env.ARTQUEST_GOOGLE_CLIENT_SECRET': JSON.stringify(
        process.env.ARTQUEST_GOOGLE_CLIENT_SECRET ?? '',
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
