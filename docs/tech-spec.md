# CosPlan - 技术方案说明

> 版本：V1.0 | 日期：2026-05-12

---

## 1. 技术选型

| 维度 | 选型 | 理由 |
|------|------|------|
| 语言 | HTML5 + CSS3 + ES6 JavaScript | 零依赖，单文件可运行 |
| 存储 | localStorage | 数据完全本地，无后端 |
| 图片处理 | FileReader API + Canvas API | 纯前端压缩，无需服务端 |
| 打包 | HBuilder X 云打包 | 一键生成 APK，小白友好 |
| PWA | manifest.json + service worker | iOS 添加到桌面也可用 |
| UI 框架 | 无，手写 CSS | 体积最小，完全可控 |

## 2. 文件结构

```
乙游陪伴/
├── cosplan.html          ← V1.0 唯一应用文件
├── CLAUDE.md             ← AI 开发指引
├── docs/                 ← 标准文档
│   ├── prd.md
│   ├── design-spec.md
│   ├── tech-spec.md
│   ├── data-model.md
│   └── dev-roadmap.md
└── dev-logs/             ← 每日开发日志
    └── YYYY-MM-DD.md
```

## 3. 数据存储方案

### 3.1 localStorage Key 设计

| Key | 内容 | 说明 |
|-----|------|------|
| `cosplan_characters` | JSON Array | 角色列表 |
| `cosplan_prep_items` | JSON Array | 筹备清单项 |
| `cosplan_photos` | JSON Array | 照片素材 |
| `cosplan_copies` | JSON Array | 文案模板(台词+标签) |

### 3.2 存储容量控制

- localStorage 上限约 5MB
- 图片上传时 Canvas 压缩：最大宽度 800px，JPEG 质量 0.6
- 缩略图 200×200，JPEG 质量 0.4
- 单张原图约 30-80KB，缩略图约 5-15KB
- 预估可存储：50 个角色 + 500 张照片 + 200 条文案

### 3.3 数据备份

- Phase 6 实现 JSON 导出：`JSON.stringify` → Blob → download
- JSON 导入：FileReader → `JSON.parse` → 合并到 localStorage

## 4. 图片处理流程

```
用户选择文件
  → FileReader.readAsDataURL(file)
  → new Image() 加载
  → Canvas 缩放(MAX_WIDTH=800, 等比)
  → canvas.toDataURL('image/jpeg', 0.6)
  → 存储到 localStorage
  → 同时生成缩略图(MAX_WIDTH=200, quality=0.4)
```

## 5. 视图架构

单文件 SPA，通过显示/隐藏切换视图：

```
<div id="app">
  <main id="view-dashboard"></main>    <!-- 首页 -->
  <main id="view-characters"></main>   <!-- 角色管理 -->
  <main id="view-prep"></main>         <!-- 筹备清单 -->
  <main id="view-photos"></main>       <!-- 照片素材 -->
  <main id="view-copy"></main>         <!-- 文案生成 -->
  <nav id="bottom-nav"></nav>          <!-- 底部导航 -->
  <div id="modal-container"></div>     <!-- 弹窗容器 -->
  <div id="toast"></div>               <!-- Toast 提示 -->
</div>
```

视图切换逻辑：
```js
function switchView(viewName) {
  document.querySelectorAll('main').forEach(m => m.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');
  renderView(viewName);  // 按需渲染
}
```

## 6. 核心工具函数

```js
// UUID 生成
function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

// localStorage 封装
function loadData(key) { return JSON.parse(localStorage.getItem(key) || '[]'); }
function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// 图片压缩
function compressImage(file, maxWidth, quality) { /* returns Promise<base64> */ }

// Toast 提示
function showToast(msg) { /* 底部弹出，2.5s 消失 */ }
```

## 7. 兼容性

| 特性 | 安卓要求 | iOS 要求 |
|------|----------|----------|
| WebView | Android 5.0+ | iOS 11+ |
| localStorage | ✅ | ✅ |
| FileReader | ✅ | ✅ |
| Canvas | ✅ | ✅ |
| navigator.clipboard | Android 10+ | iOS 14+ |
| PWA manifest | Chrome 40+ | Safari 11.3+ |

## 8. 打包为 APK

使用 **HBuilder X** → 文件 → 新建 → 5+App → 粘贴代码 → 发行 → 原生App-云打包

- 包名：`com.cosplan.app`
- 应用名：`CosPlan`
- 图标：用户自行替换
- 不勾选权限（无需摄像头/定位/通讯录）
