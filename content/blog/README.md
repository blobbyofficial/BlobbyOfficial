# Blog content system (v2)

## Folder structure
- `content/blog/index.json` → list metadata for cards/search/sort/filter.
- `content/blog/posts/<slug>.json` → full post body content.
- `content/blog/posts/_template.json` → copy this file to create new posts quickly.

## Add a new post
1. Copy `_template.json` to `content/blog/posts/<your-slug>.json`.
2. Fill in metadata and `blocks`.
3. Add an entry with the same `slug` to `content/blog/index.json` in `posts`.

## Remove a post
- Delete `content/blog/posts/<slug>.json` and remove its matching object in `index.json`.

## Supported block types
- `heading` (with `level` 2-4)
- `text` (supports `**bold**`, `*italic*`, and `` `inline code` ``)
- `list` (ordered or unordered)
- `image`
- `gallery`
- `quote`
- `callout`
- `code`
- `table`
- `references`
- `links`

## Notes
- Keep `slug` values unique and URL-safe.
- External links should start with `https://`.
- Internal links should start with `/`.
