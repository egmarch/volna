import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Делает index.html рабочим и по file:// (двойной клик), и на GitHub Pages:
// убираем type="module"/crossorigin и переносим скрипт в конец body.
const fileProtocolFriendly = () => ({
  name: 'file-protocol-friendly',
  enforce: 'post',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const scripts = []
      html = html.replace(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) => {
        scripts.push(`<script defer src="${src}"></script>`)
        return ''
      })
      html = html.replace(/\s+crossorigin(="[^"]*")?/g, '')
      return html.replace('</body>', scripts.join('\n') + '\n</body>')
    },
  },
})

// base './' — относительные пути. Сборка кладётся в ../3d.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), fileProtocolFriendly()],
  build: {
    outDir: '../3d',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    modulePreload: false,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
  },
})
