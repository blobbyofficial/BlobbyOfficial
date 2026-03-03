# Store content system (v2)

`/store/` and `/store/product/` read from `content/store/products.json`.

## Add a product
1. Duplicate an existing object in `products.json`.
2. Set unique `id` and `slug`.
3. Fill storefront fields: `title`, `category`, `format`, `thumbnail`, `shortPitch`, `description`.
4. Fill conversion fields: `salePrice`, optional `originalPrice`, `gumroadUrl`, `featured`, `bestseller`.
5. Add `includes`, `highlights`, `tags`, `gallery`, and `faq`.

## Important fields
- `featured` / `bestseller`: merchandising priority.
- `dateAdded`: powers newest sort.
- `salePrice`/`price`: used for sorting and display.
- `faq`: shown on product pages and purchase-confidence section.

## URL rules
Use internal paths (`/path/`) or secure external URLs (`https://...`).
