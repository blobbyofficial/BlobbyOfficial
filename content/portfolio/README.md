# Portfolio content system (v2)

## Files
- `content/portfolio/profile.json` contains all content for `/portfolio/`.

## Editing workflow
1. Update platform links in `platforms`.
2. Update proof metrics in `stats` and qualitative differentiators in `highlights`.
3. Add/remove project cards in `projects`.
4. Keep testimonials and FAQ current.

## Project object shape
- `title`, `platform`, `type`, `summary`
- `tags` (string array)
- `media` object:
  - image: `{ "type": "image", "src": "...", "alt": "..." }`
  - video: `{ "type": "video", "src": "https://www.youtube.com/embed/..." }`
- optional `link`

## Notes
- Keep URLs absolute (`https://`) or internal (`/path`).
- `type` values power the portfolio page filter dropdown.
