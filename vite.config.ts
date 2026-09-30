/**
 * Vite 构建配置
 *
 * 产出纯静态 SPA（hash 路由），直接作为 Cloudflare Workers 的 assets 上传。
 *
 * @module vite.config
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    // 站点里内联了大量 SVG 与国家/州数据，单独分包避免主 chunk 过大
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});
