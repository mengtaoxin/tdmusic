# tdmusic

[English README](../README.md)

基于 JSON 曲库目录的浏览器端音乐播放器，无需后端：播放时拉取音轨，缓存到 IndexedDB，并按播放列表、歌手、专辑或搜索浏览。界面支持中文 / English。

## 功能

- 通过 `configs.json` 驱动曲库（可在设置中覆盖配置 URL）
- 播放队列、随机播放、循环；状态在刷新后保留
- 音轨与封面写入 IndexedDB，并预取即将播放的曲目
- 配置元数据不全时，从已缓存音频补充 ID3 信息
- 浏览：音乐列表、播放列表、歌手、专辑、搜索
- 应用内 configs.json 指南与日志

## 环境要求

- Node.js `^22.18.0` 或 `^24.12.0`（见 `package.json` 的 `engines`）

## 快速开始

```sh
./scripts/install-dependency.sh
./scripts/dev-start.sh
```

打开 [http://localhost:3000](http://localhost:3000)。停止：`./scripts/dev-stop.sh`。

脚本参数见 [commands.md](commands.md)。

| 脚本 | 用途 |
| ---- | ---- |
| `./scripts/install-dependency.sh` | 安装依赖 |
| `./scripts/dev-start.sh` / `dev-stop.sh` | 启动 / 停止 Vite 开发服务器 |
| `./scripts/build.sh` | 生产构建 |
| `./scripts/format.sh` | 格式化（**默认会改文件**；`--check` 只读） |
| `./scripts/test.sh` | 完整测试（单元 + e2e） |

只跑单个测试文件或一层（e2e 默认仅 Chromium；用 `--platform` 追加浏览器）：

```sh
./scripts/test.sh --layer unit
./scripts/test.sh --file src/__tests__/App.spec.ts
./scripts/test.sh --file e2e/vue.spec.ts
./scripts/test.sh --platform chrome,firefox,webkit
```

## 曲库配置

默认目录：[`public/configs.json`](../public/configs.json)，访问路径 `/configs.json`。

`music-list` 每项必须有 `id` 与 `path`（`http(s)://` 或站点绝对路径 `/…`）。可选的 `title`、`artist`、`album`、`cover` 会覆盖解析出的标签。播放列表通过 `id` 引用曲目。

字段说明见应用内 **更多 → configs.json 指南**，以及 [project-specific-docs.md](project-specific-docs.md)。

## 技术栈

Vue 3 · Vite · TypeScript · Pinia · Vue Router · vue-i18n · Vuetify 4 · Vitest · Playwright

## 文档

| 文档 | 内容 |
| ---- | ---- |
| [file-structure.md](file-structure.md) | 仓库目录结构 |
| [tech-stack.md](tech-stack.md) | 版本与依赖 |
| [commands.md](commands.md) | 脚本约定 |
| [conventions.md](conventions.md) | 编码约定 |
| [testing.md](testing.md) | 测试分层与命名 |
| [project-specific-docs.md](project-specific-docs.md) | 曲库、缓存、播放行为 |
| [ui-chrome.md](ui-chrome.md) | 顶栏布局与导航外观 |

## 许可

私有 / 未公开发布（`package.json` 中 `"private": true`）。
