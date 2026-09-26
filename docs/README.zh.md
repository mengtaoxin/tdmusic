# tdmusic

[English README](../README.md)

由**你自己的** `configs.json` 驱动的浏览器端音乐播放器：在文件里列出曲目（及可选播放列表），在设置中填写其 URL 即可播放。无需后端——音轨在播放时拉取，缓存到 IndexedDB，并按播放列表、歌手、专辑或搜索浏览。界面支持中文 / English。

**用法：** 托管或编写一份 `configs.json`，在 `music-list` 中提供 `{ id, path }`，可选再写用 `id` 引用曲目的 `playlists`，然后在设置里填写曲库 URL。仓库自带的 `/sample/configs.json` 仅作本地试用示例。字段说明见应用内 **更多 → configs.json 指南**。

## 功能

- 曲库完全由你的 `configs.json` 决定（在设置中填写曲库 URL；自带文件仅为示例）
- 播放队列、随机播放、循环；状态在刷新后保留
- 音轨与封面写入 IndexedDB，并预取即将播放的曲目
- 配置元数据不全时，从已缓存音频补充 ID3 信息
- 浏览：音乐列表、播放列表、歌手、专辑、搜索
- 应用内 configs.json 指南与日志

## 环境要求

- Node.js `^22.18.0` 或 `^24.12.0`（见 `package.json` 的 `engines`）

## 快速开始

```sh
npm install
npx playwright install chromium firefox webkit
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。停止：Ctrl+C。

命令说明见 [commands.md](commands.md)。

| 命令 | 用途 |
| ---- | ---- |
| `npm install` + Playwright install | 安装依赖与浏览器 |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run format && npm run lint && npm run type-check` | 格式化 + lint + 类型检查（**会改文件**） |
| `npm run test:unit` / `test:e2e` | 单元（Vitest）/ e2e（Playwright） |

```sh
npm run test:unit
npm run test:unit -- src/__tests__/App.spec.tsx
npm run test:e2e -- --project chromium
npm run test:e2e -- --project chromium -- e2e/app.spec.ts
```

## 曲库配置（`configs.json`）

曲库就是**你的** `configs.json` 所描述的内容——托管到任意可访问地址，在设置中填写 URL 后重新加载即可。`public/sample/` 下的文件仅作本地试用示例。

| 部分 | 作用 |
| ---- | ---- |
| 示例（开发） | [`public/sample/configs.json`](../public/sample/configs.json) → `/sample/configs.json` |
| 你的曲库 | 设置 → 曲库 URL（`tdmusic.configUrl`） |
| `music-list` | 必填：每首需唯一 `id` + `path`（音频地址） |
| 可选字段 | `title`、`artist`、`album`、`cover`（优先于解析出的 ID3） |
| `playlists` | `{ title, music-list: [{ id }] }`，用曲目 `id` 引用 |

示例结构：

```json
{
  "music-list": [
    {
      "id": "track-1",
      "title": "Track 1",
      "artist": "Artist 1",
      "album": "Album 1",
      "path": "https://example.com/audio/track-1.mp3"
    }
  ],
  "playlists": [
    {
      "title": "My Playlist1",
      "music-list": [{ "id": "track-1" }]
    }
  ]
}
```

更多说明：应用内 **更多 → configs.json 指南**，以及 [catalog.md](catalog.md)。

## 技术栈

React · Vite · TypeScript · Zustand · TanStack Router · react-i18next · MUI · Vitest · Playwright

## 文档

| 文档 | 内容 |
| ---- | ---- |
| [change-code-steps.md](change-code-steps.md) | 改代码步骤：TDD、结构、测试、format/check |
| [file-structure.md](file-structure.md) | 仓库目录结构 |
| [tech-stack.md](tech-stack.md) | 版本与依赖 |
| [commands.md](commands.md) | 脚本约定 |
| [conventions.md](conventions.md) | 编码约定 |
| [testing.md](testing.md) | 测试分层与命名 |
| [catalog.md](catalog.md) | configs.json、曲库路由、enrich |
| [cache.md](cache.md) | IndexedDB 音频缓存与封面 |
| [playback.md](playback.md) | 队列、随机、Media Session |
| [persistence.md](persistence.md) | localStorage、语言、应用日志 |
| [ui-chrome.md](ui-chrome.md) | 顶栏布局与导航外观 |

## 许可

[MIT](../LICENSE)
