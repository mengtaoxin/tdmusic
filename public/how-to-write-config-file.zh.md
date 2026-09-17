# configs.json 指南

本页说明如何为 tdmusic 编写 configs.json 目录配置文件。

## music-list

曲目数组。每条必须有 `id` 和 `path`；缺少任一字段或 `id` 重复会被丢弃，并在音乐列表中显示错误。可选字段若填写，会覆盖从 ID3 提取的标签。

- `id` — 曲目唯一 id（必填）；推荐用字母和中横线，例如 `sample-1`
- `path` — 音频 URL 或站点路径（必填）
- `title` — 显示标题（可选）
- `artist` — 歌手名（可选）
- `album` — 专辑名（可选）
- `cover` — 封面图 URL（可选）

## playlists

播放列表数组。每项有 `title`，以及由 `{ "id": "…" }` 组成的 `music-list`（只能引用已接受的曲目）。

## 示例

```json
{
  "music-list": [
    {
      "id": "sample-1",
      "title": "Sample 1",
      "artist": "Artist 1",
      "album": "Album 1",
      "path": "/sample-1.mp3"
    }
  ],
  "playlists": [
    {
      "title": "My Playlist1",
      "music-list": [
        { "id": "sample-1" }
      ]
    }
  ]
}
```

## 补充说明

- 标题回退顺序：配置 → ID3 → path 文件名（解码后的无扩展名 basename）→ id。
- 缺少歌手/专辑时显示为未知歌手 / 未知专辑；曲目仍会按歌手 → 专辑 → 曲目分组。

## 让大模型生成 configs.json

把下面的提示词复制到 ChatGPT、Claude 等大模型。把音乐库地址换成你自己的，再把返回的 JSON 用作 configs.json（或放到可访问地址，并在设置里填写配置地址）。

```
遵循网站（https://tdmusic.smt.sh/config-guides）的要求，为我的音乐库（http://example.com/music-library）生成configs.json。
```
