# CosPlan - AI 开发指引

## 项目定位

CosPlan 是一款专为 COSER 打造的创作助手 APP，以「角色项目」为核心串联筹备→拍摄→选片→修图→发布全流程。纯前端单文件应用（HTML+CSS+JS + localStorage），可打包为安卓 APK。

## 标准文档路径

| 文档 | 路径 | 说明 |
|------|------|------|
| 产品需求 | [prd.md](docs/prd.md) | 功能需求、痛点分析、验收标准 |
| 设计规范 | [design-spec.md](docs/design-spec.md) | 色彩、字体、间距、组件、动效 |
| 技术方案 | [tech-spec.md](docs/tech-spec.md) | 技术选型、存储方案、视图架构、打包方式 |
| 数据模型 | [data-model.md](docs/data-model.md) | 实体定义、字段说明、关系映射 |
| 开发路线 | [dev-roadmap.md](docs/dev-roadmap.md) | 6 个 Phase 增量开发步骤 |

## 工作约定

### 开发节奏
1. **严格按 Phase 顺序开发**：Phase 1 → Phase 6，不跳跃
2. **每 Phase 独立可运行**：完成一个 Phase 后，浏览器打开 cosplan.html 验证功能
3. **验收通过再进入下一 Phase**：对照 dev-roadmap.md 中的验收检查逐条确认
4. **不要一口气写出全部代码**：每次只完成当前 Phase 的任务

### 代码规范
- 所有代码写在单个 `cosplan.html` 文件中
- CSS 变量统一在 `:root` 中定义
- JS 函数命名：驼峰式 `loadData()`、`renderCharacterList()`
- 注释使用中文，解释"为什么"而非"是什么"
- 不使用任何第三方库、CDN、框架

### 技术约束
- 零依赖：只用 HTML + CSS + JS
- 存储：localStorage，4 个 Key（cosplan_characters / cosplan_prep_items / cosplan_photos / cosplan_copies）
- 图片：Base64 存储，上传时 Canvas 压缩（最大宽 800px）
- 移动端优先：触控区域 ≥ 44px，字号 ≥ 14px
- 暗色主题：背景 #1a1a2e，主色紫粉渐变

### 开发日志
- 每天开发结束后更新 `dev-logs/YYYY-MM-DD.md`
- 记录：今日完成项、遇到的问题、明日计划、当前进度百分比
- 模板见 dev-roadmap.md 末尾

## 快速启动

1. 用浏览器打开 `cosplan.html` 即可运行
2. 用 HBuilder X 打开 → 发行 → 原生App-云打包 → 生成 APK
3. 所有数据存储在浏览器 localStorage 中

## 当前状态

- V1.0（暗色主题）：`cosplan.html` — 稳定版
- V2.0（明亮主题）：`cosplan-v2.html` — 明亮简洁版本
- 最后更新：2026-05-12
