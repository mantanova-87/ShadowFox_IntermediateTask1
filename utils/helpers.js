/**
 * helpers.js — shared utility functions
 */
const { Product } = require('../models');

/**
 * Generates a unique URL-safe slug from a product title.
 * Appends a numeric suffix if the base slug is already taken.
 */
async function generateSlug(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let slug = base;
  let count = 0;

  while (await Product.exists({ slug })) {
    count += 1;
    slug = `${base}-${count}`;
  }
  return slug;
}

/**
 * Paginates a Mongoose query result.
 * Returns metadata for consistent API pagination responses.
 */
function paginate(page = 1, limit = 20) {
  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));
  return { skip: (p - 1) * l, limit: l, page: p };
}

module.exports = { generateSlug, paginate };
