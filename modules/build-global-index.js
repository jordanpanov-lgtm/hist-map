'use strict';
/*
 * Hist-Map global index builder — aggregates every folio's entries into one file:
 *   - index: "folioId::entryId" → label, for cheap cross-folio lookups
 *   - xlinks: explicit links plus auto-derived reverse links, for reciprocity
 *   - entry_keywords / keyword_index: the seeded keywords, inverted for term lookup
 *
 * Unlike sci-map's version, this doesn't read a hand-maintained `_index` field —
 * hist-map folios don't have one, so `index` is built directly from each entry's own
 * `label` during the same pass that collects xlinks/keywords. One less hand-maintained
 * artifact to keep in sync.
 *
 * Deterministic: no wall-clock timestamp, so re-running against unchanged folios
 * produces a byte-identical file — CI can diff-check it for staleness.
 *
 * Run:  node modules/build-global-index.js
 */
const fs   = require('fs');
const path = require('path');

const DIR    = path.join(__dirname);
const OUTPUT = path.join(DIR, '_global_index.json');

const files = fs.readdirSync(DIR)
  .filter(f => f.endsWith('.json') && !f.startsWith('_') && f !== 'schema.json')
  .sort();

const index         = {};   // "folioId::entryId" → label
const xlinks        = {};   // key → [target, ...]  (both explicit and auto-derived reverse)
const entryKeywords = {};   // key → ["term", ...]
const keywordIndex  = {};   // term → [key, ...]  (inverted)
const folios        = [];
let   total         = 0;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  if (!data.id || !Array.isArray(data.categories)) continue;

  const folioId = data.id;
  let count = 0;

  for (const cat of data.categories) {
    for (const entry of (cat.entries || [])) {
      count++;
      const key = `${folioId}::${entry.id}`;
      index[key] = entry.label;

      // xlinks — collect explicit and derive the reverse direction
      if (Array.isArray(entry.xlinks) && entry.xlinks.length) {
        for (const tgt of entry.xlinks) {
          if (!xlinks[key]) xlinks[key] = [];
          if (!xlinks[key].includes(tgt)) xlinks[key].push(tgt);
          if (!xlinks[tgt]) xlinks[tgt] = [];
          if (!xlinks[tgt].includes(key)) xlinks[tgt].push(key);
        }
      }

      // keywords — collect per-entry and build the inverted index
      if (Array.isArray(entry.keywords) && entry.keywords.length) {
        entryKeywords[key] = entry.keywords;
        for (const term of entry.keywords) {
          if (!keywordIndex[term]) keywordIndex[term] = [];
          keywordIndex[term].push(key);
        }
      }
    }
  }

  folios.push({ id: folioId, title: data.title, entries: count });
  total += count;
}

const xlinkCount   = Object.values(xlinks).reduce((n, arr) => n + arr.length, 0) / 2;
const keywordCount = Object.keys(keywordIndex).length;

const output = {
  _meta: {
    total_entries: total,
    folio_count:   folios.length,
    xlink_pairs:   Math.round(xlinkCount),
    keyword_terms: keywordCount,
    folios,
    // No wall-clock timestamp: this is a generated artifact and must rebuild
    // byte-identically from the same folios, so CI can diff-check it for staleness.
    // Git history records when it changed.
  },
  index,
  xlinks,
  entry_keywords: entryKeywords,
  keyword_index:  keywordIndex,
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));

console.log(`✓ _global_index.json built`);
console.log(`  ${folios.length} folios  |  ${total} total entries  |  ${Math.round(xlinkCount)} xlink pairs  |  ${keywordCount} distinct keywords`);
