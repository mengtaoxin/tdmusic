# Guidelines for configs.json

This page explains how to write a configs.json catalog file for tdmusic.

## music-list

An array of tracks. Each entry needs `id` and `path`. Missing either, or a duplicate `id`, drops that entry and shows an error in Music List. Optional fields override extracted ID3 tags when set.

- `id` — unique track id (required); prefer letters and hyphens, e.g. `sample-1`
- `path` — audio URL or site path (required)
- `title` — display title (optional)
- `artist` — artist name (optional)
- `album` — album name (optional)
- `cover` — cover image URL (optional)
- `volume-ratio` — playback loudness as a percent of normal (optional; default `100`, max `100`). Values above `100` are treated as `100`; invalid values fall back to `100`.

## playlists

An array of playlists. Each has a `title` and a `music-list` of `{ "id": "…" }` refs that must match accepted tracks.

## Example

```json
{
  "music-list": [
    {
      "id": "sample-1",
      "title": "Sample 1",
      "artist": "Artist 1",
      "album": "Album 1",
      "path": "/sample-1.mp3",
      "volume-ratio": 80
    }
  ],
  "playlists": [
    {
      "title": "My Playlist1",
      "music-list": [{ "id": "sample-1" }]
    }
  ]
}
```

## Notes

- Title fallback order: config → ID3 → filename from path (decoded basename without extension) → id.
- Missing artist/album become Unknown artist / Unknown album; tracks still group under artist → albums → tracks.

## Ask an AI to generate configs.json

Paste the prompt below into ChatGPT, Claude, or another model. Replace the music library URL with your own, then use the returned JSON as your configs.json (or host it and set the Config URL in Settings).

```
Follow the requirements on the website (https://tdmusic.smt.sh/config-guides) and generate configs.json for my music library (http://example.com/music-library).
```
