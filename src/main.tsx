/**
 * 应用入口
 *
 * I. 初始化顺序
 *
 * 1. 挂载样式（令牌 → 基础 → 外壳 → UI → 页面）
 * 2. 包裹 AppProvider（全局状态）与 RouterProvider（hash 路由）
 * 3. 渲染 App
 *
 * II. 说明
 *
 * 样式必须按 tokens → base → shell/ui → pages 的顺序引入，
 * 后引入的页面样式才能正确覆盖基础样式。
 *
 * @module main
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import React from 'react';
import { createRoot } from 'react-dom/client';

import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/ui.css';
import './styles/pages.css';

import { AppProvider } from './app-context';
import { RouterProvider } from './router';
import App from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('未找到 #root 挂载点，页面可能未正确加载');
}

createRoot(container).render(
  <React.StrictMode>
    <AppProvider>
      <RouterProvider>
        <App />
      </RouterProvider>
    </AppProvider>
  </React.StrictMode>
);
