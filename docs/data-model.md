# CosPlan - 数据模型定义

> 版本：V1.0 | 日期：2026-05-12

## 1. 实体关系

```
Character (1) ─────< PrepItem (N)
Character (1) ─────< Photo (N)
Character (1) ─────< CopyTemplate (N)
```

所有实体通过 `characterId` 外键关联到角色。

## 2. Character（角色）

```js
{
  id: String,           // UUID，主键
  name: String,         // 角色名称（必填）
  source: String,       // 作品来源，如"原神""崩坏星穹铁道"
  bio: String,          // 人设描述，自由文本
  avatar: String,       // 头像 Base64 DataURL（可为空，用默认图）
  refImages: [          // 参考图集
    {
      id: String,       // 图片唯一 ID
      data: String,     // Base64 DataURL
      note: String      // 图片备注
    }
  ],
  status: String,       // 项目状态："prep"|"shooting"|"selecting"|"editing"|"done"
  createdAt: Number     // 创建时间戳
}
```

**验证规则**：
- `name` 必填，1-30 字符
- `source` 选填，最多 20 字符
- `bio` 选填，最多 500 字符
- `refImages` 最多 20 张

## 3. PrepItem（筹备清单项）

```js
{
  id: String,           // UUID
  characterId: String,  // 关联角色 ID
  category: String,     // 分类："costume"|"prop"|"location"|"storyboard"
  title: String,        // 项目标题（必填）
  link: String,         // 购买链接/参考链接（选填）
  image: String,        // 参考图 Base64（选填）
  note: String,         // 备注（选填）
  completed: Boolean,   // 是否已备齐/已完成
  createdAt: Number     // 创建时间戳
}
```

**分类说明**：
| category | 显示名 | Emoji | 示例 |
|----------|--------|-------|------|
| costume | 服装 | 👗 | 紫色和服、腰封、木屐 |
| prop | 道具 | 🔧 | 太刀、扇子、烟斗 |
| location | 场地 | 📍 | 植物园日式区、摄影棚 |
| storyboard | 分镜 | 🎬 | 拔刀特写、回眸半身 |

## 4. Photo（照片素材）

```js
{
  id: String,           // UUID
  characterId: String,  // 关联角色 ID
  data: String,         // 压缩后的原图 Base64（最长边 800px）
  thumbnail: String,    // 缩略图 Base64（200×200）
  status: String,       // 状态："raw"|"to_edit"|"edited"
  note: String,         // 修图备注（选填）
  createdAt: Number     // 上传时间戳
}
```

**状态流转**：
```
raw (原片待选) → to_edit (待修图) → edited (已修完成)
       ↑              ↓                  |
       └──────── 可回退 ─────────────────┘
```

**缩略图生成规则**：
- Canvas 绘制 → 等比缩放填满 200×200 → 居中裁剪
- 输出格式：JPEG, quality=0.4
- 目标大小：5-15KB

## 5. CopyTemplate（文案模板）

```js
{
  id: String,           // UUID
  characterId: String,  // 关联角色 ID
  type: String,         // 类型："line"（台词）| "tag"（标签）
  content: String,      // 文本内容
  platform: String,     // 适用平台（仅 tag 类型使用）
  createdAt: Number     // 创建时间戳
}
```

**平台枚举**（仅 type="tag" 时有效）：
- `all` - 通用
- `xhs` - 小红书
- `weibo` - 微博
- `bilibili` - B站
- `douyin` - 抖音

## 6. localStorage 完整结构

```js
localStorage = {
  "cosplan_characters": "[{Character}, ...]",
  "cosplan_prep_items": "[{PrepItem}, ...]",
  "cosplan_photos": "[{Photo}, ...]",
  "cosplan_copies": "[{CopyTemplate}, ...]"
}
```

每个 Key 对应一个 JSON 数组，读写操作通过封装的 `loadData()`/`saveData()` 函数完成。
