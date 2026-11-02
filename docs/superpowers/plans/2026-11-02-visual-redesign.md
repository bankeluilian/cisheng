# 人生画册视觉重设计 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement in this session.

**Goal:** 将此生的完整网页统一为温暖、有故事感的人生画册，并发布、提供真实截图。

**Architecture:** 保留 React 游戏状态、存档和数据接口。用一份 book-design.css 替代 readability.css 与 layout-balance.css 的入口加载，整理主要页面结构，保留 globals.css 的基础组件与 illustrated-journal.css 的记录册样式。

**Tech Stack:** React / TypeScript / CSS / Vite / GitHub Pages / Sites Worker。

**Spec:** ../specs/2026-11-02-visual-redesign-design.md

## Global Constraints

- 保留首页圆环图、游戏行为、数据、用户存档及隐私约定。
- 桌面左右平衡；390px 手机清楚可读，无图文重叠或横向溢出。
- 截图来自真实网页，保存到宣传素材/网页截图-20261102。

## Review Focus

- 390px 下三张介绍卡应单栏排布，正文保持清楚可读。
- 长姓名、多语言姓名和较长职业能自然换行。
- 导航、改名、随机出生、事件选择、存档和卡片导出保持可用。
- 夜间、大字、减少动画偏好继续生效。
- GitHub Pages 与 Sites 两个入口使用一致的样式和正确图片路径。

## Task 1: 整站视觉与结构

**Files:** app/book-design.css、app/layout.tsx、static-pages/main.tsx、app/life-app.tsx、app/birth-profile.tsx。

**Interfaces:** 使用既有组件类名和 Life 类型；不改变引擎 API。

- [ ] 整理统一样式入口，完成首页大图、资料开页、事件区、总结卡与其余页面的响应式样式。
- [ ] 本地运行 typecheck、现有测试和 Pages 构建。纯展示调整以浏览器检查为主，不添加镜像 CSS 的测试。
- [ ] 在真实浏览器检查桌面和手机的首页、出生、游戏、总结页；修复观察到的问题。

## Task 2: 发布与交付

**Files:** 现有 GitHub / Sites 发布脚本、宣传素材/网页截图-20261102。

**Interfaces:** 既有 Pages dist-pages 和 Worker dist 构建。

- [ ] 对改动执行独立审查，修复阻塞问题。
- [ ] 将确切源代码与构建发布到原有站点，保持访问范围。
- [ ] 从实际网页保存截图和发布记录；如某条托管连接不可用，明确报告已完成与未完成的部分。
