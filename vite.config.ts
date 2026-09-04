import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 监听所有地址，包括局域网和公网地址 (0.0.0.0)
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('docx')) {
              return 'vendor-docx';
            }
            if (id.includes('pdfjs-dist')) {
              return 'vendor-pdfjs';
            }
            if (id.includes('echarts') || id.includes('zrender')) {
              return 'vendor-echarts';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@hello-pangea/dnd') || id.includes('react-resizable-panels')) {
              return 'vendor-interactive';
            }
            if (id.includes('@supabase/supabase-js') || id.includes('idb-keyval') || id.includes('zustand')) {
              return 'vendor-storage';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
