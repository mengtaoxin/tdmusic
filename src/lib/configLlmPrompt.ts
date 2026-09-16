/** Copyable prompts that help an LLM generate tdmusic configs.json. Not i18n messages (braces break vue-i18n). */

export const CONFIG_LLM_PROMPT_EN = `You are helping me create a configs.json catalog for tdmusic, a browser music player.

Output requirements:
- Return ONLY valid JSON (no markdown fences, no commentary).
- Top-level keys: "music-list" (required) and optional "playlists".
- Each music-list item MUST have unique "id" (string) and "path" (audio URL or site-absolute path like "/song.mp3").
- Optional per track: "title", "artist", "album", "cover" (cover image URL). Prefer filling these when the file name or URL implies them.
- "id" should be URL-safe, unique, stable (e.g. kebab-case slug from the title or filename). Never duplicate ids.
- playlists: array of { "title": string, "music-list": [ { "id": "<existing track id>" } ] }. Only reference ids that exist in music-list.
- Prefer http(s):// or site-absolute (/…) paths.

Example shape:
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
      "music-list": [{ "id": "sample-1" }]
    }
  ]
}

My audio files / URLs (one per line; infer metadata when possible):
`

export const CONFIG_LLM_PROMPT_ZH = `你在帮我为浏览器音乐播放器 tdmusic 生成 configs.json 目录配置。

输出要求：
- 只返回合法 JSON（不要用 markdown 代码块，不要额外说明文字）。
- 顶层键：必须有 "music-list"，可选 "playlists"。
- music-list 每一项必须有唯一的 "id"（字符串）和 "path"（音频 URL，或站点绝对路径如 "/song.mp3"）。
- 每项可选："title"、"artist"、"album"、"cover"（封面图 URL）。能从文件名或 URL 推断时尽量填写。
- "id" 需唯一、稳定、URL 友好（例如由歌名或文件名得到的 kebab-case slug），禁止重复。
- playlists：数组，每项为 { "title": string, "music-list": [ { "id": "<已有曲目 id>" } ] }，只能引用 music-list 里已有的 id。
- path 优先使用 http(s):// 或站点绝对路径（/…）。

结构示例：
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
      "music-list": [{ "id": "sample-1" }]
    }
  ]
}

我的音频文件 / URL（每行一个；能推断元数据时请填写）：
`

export function configLlmPromptForLocale(locale: string): string {
  return locale.startsWith('zh') ? CONFIG_LLM_PROMPT_ZH : CONFIG_LLM_PROMPT_EN
}
