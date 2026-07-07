'use strict';
/**
 * build-xlink-candidates.js
 * Scans the corpus for natural cross-folio connections using two strategies:
 *   1. Figure-name matching — a name from a dynasty-bearing or "power"-category entry
 *      (hist-map has no "figure" category like sci-map does) appears in another
 *      folio's entry label.
 *   2. Keyword overlap — two entries in different folios share 2+ of the auto-seeded
 *      keywords[], via _global_index.json's keyword_index.
 * Output: _xlink_candidates.json — review this, then add xlinks manually to folio
 * entries. This script never writes xlinks itself.
 */

const fs   = require('fs');
const path = require('path');

const DIR          = __dirname;
const GLOBAL_INDEX = path.join(DIR, '_global_index.json');
const OUTPUT       = path.join(DIR, '_xlink_candidates.json');

// ── Load folios directly ─────────────────────────────────────────────────────
// _global_index.json's `index` is label-only (folioId::entryId -> label); the
// figure-name strategy needs `dynasty` and category id too, so read the source
// folios instead of trying to squeeze that into the simplified index format.

const files = fs.readdirSync(DIR)
  .filter(f => f.endsWith('.json') && !f.startsWith('_') && f !== 'schema.json')
  .sort();

const entries = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  for (const cat of data.categories || []) {
    for (const e of cat.entries || []) {
      entries.push({
        key: `${data.id}::${e.id}`,
        folio: data.id,
        id: e.id,
        cat: cat.id,
        label: e.label,
        date: e.date,
        dynasty: e.dynasty || null,
      });
    }
  }
}
const entryByKey = new Map(entries.map(e => [e.key, e]));

// ── Strategy 1: figure-name matching ─────────────────────────────────────────

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Reuse build-keywords.js's proper-noun-phrase extractor rather than a second, cruder
// heuristic. A naive "take the last word before the dash" approach was tried first and
// produced heavy noise: hist-map labels follow a "Name — descriptor" convention, but the
// last bare WORD before the dash is often a regnal first name shared by many different
// rulers ("Louis XII" -> "Louis", matching every other Louis) or a generic institutional
// noun ("Almohad Caliphate" -> "Caliphate", matching every unrelated caliphate). Taking
// extractPhrases(label)[0] instead captures the full phrase ("Louis XII", "Almohad
// Caliphate"), which is exactly what build-keywords.js already validated as the right
// unit for this — multi-word phrases are far more discriminating than single words.
const { extractPhrases, isUsefulSingleWord } = require('./build-keywords.js');

// Bare country/region names pass isUsefulSingleWord (they're fine as one of several
// keywords) but are useless as a sole figure-matching pivot — "France" would match
// dozens of unrelated entries in any France-period folio. Excluded here specifically,
// not in build-keywords.js's broader stopword list.
const TOO_GENERIC_ALONE = new Set([
  'france', 'spain', 'rome', 'england', 'italy', 'germany', 'portugal', 'egypt',
  'persia', 'arabia', 'iberia', 'europe', 'asia', 'africa', 'gaul', 'byzantium',
]);

const figureCandidates = entries.filter(e => e.dynasty || e.cat === 'power');
const figureMatches = [];
const seenFigurePairs = new Set();

for (const fig of figureCandidates) {
  const phrases = extractPhrases(fig.label);
  // Skip a lead phrase that's a single, overly generic word (e.g. "Republic" out of
  // "Third Republic — ..."), same filter buildKeywords() already applies — fall back to
  // the next extracted phrase instead of matching on something that generic.
  const name = phrases.find(p =>
    (p.includes(' ') || isUsefulSingleWord(p)) && !TOO_GENERIC_ALONE.has(p.toLowerCase())
  );
  if (!name || name.length < 4) continue; // no usable phrase, or too short to be discriminating

  const hits = entries.filter(e =>
    e.folio !== fig.folio &&
    new RegExp(`\\b${escapeRegex(name)}\\b`, 'i').test(e.label)
  );

  for (const hit of hits) {
    const pairKey = [fig.key, hit.key].sort().join('|');
    if (seenFigurePairs.has(pairKey)) continue;
    seenFigurePairs.add(pairKey);
    figureMatches.push({
      confidence: 'high',
      type: 'figure-name',
      name,
      pivot: { folio: fig.folio, id: fig.id, cat: fig.cat, label: fig.label, dynasty: fig.dynasty },
      match: { folio: hit.folio, id: hit.id, cat: hit.cat, label: hit.label },
      xlink_a: fig.key,
      xlink_b: hit.key,
    });
  }
}

// ── Strategy 2: keyword overlap ───────────────────────────────────────────────
// Reuse the already-built keyword_index (auto-seeded proper-noun phrases) instead
// of re-tokenizing labels — the keywords are already higher-precision than a
// generic label-token scan would produce.

const { keyword_index: keywordIndex } = JSON.parse(fs.readFileSync(GLOBAL_INDEX, 'utf8'));

const pairScore = new Map(); // "keyA|keyB" (sorted) -> { count, terms, a, b, xlink_a, xlink_b }

for (const [term, keys] of Object.entries(keywordIndex)) {
  const folioSet = new Set(keys.map(k => k.split('::')[0]));
  if (folioSet.size < 2) continue; // only terms spanning multiple folios are interesting

  for (let p = 0; p < keys.length; p++) {
    for (let q = p + 1; q < keys.length; q++) {
      const keyA = keys[p], keyB = keys[q];
      const a = entryByKey.get(keyA), b = entryByKey.get(keyB);
      if (!a || !b || a.folio === b.folio) continue;

      const pairKey = keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
      if (!pairScore.has(pairKey)) {
        pairScore.set(pairKey, {
          count: 0, terms: [],
          a: { folio: a.folio, id: a.id, cat: a.cat, label: a.label },
          b: { folio: b.folio, id: b.id, cat: b.cat, label: b.label },
          xlink_a: keyA, xlink_b: keyB,
        });
      }
      const rec = pairScore.get(pairKey);
      rec.count++;
      rec.terms.push(term);
    }
  }
}

const keywordMatches = [...pairScore.values()]
  .filter(r => r.count >= 2)
  .map(r => ({
    confidence: r.count >= 4 ? 'high' : r.count >= 3 ? 'medium' : 'low',
    type: 'keyword-overlap',
    sharedTerms: [...new Set(r.terms)].sort(),
    sharedCount: r.count,
    a: r.a, b: r.b,
    xlink_a: r.xlink_a, xlink_b: r.xlink_b,
  }))
  .sort((a, b) => b.sharedCount - a.sharedCount);

// ── Write output ──────────────────────────────────────────────────────────────

const out = {
  _meta: {
    generated: new Date().toISOString().slice(0, 10),
    figure_matches: figureMatches.length,
    keyword_matches: keywordMatches.length,
    high_confidence: [...figureMatches, ...keywordMatches].filter(c => c.confidence === 'high').length,
    medium_confidence: keywordMatches.filter(c => c.confidence === 'medium').length,
    low_confidence: keywordMatches.filter(c => c.confidence === 'low').length,
  },
  figure_name_matches: figureMatches,
  keyword_matches: keywordMatches,
};

fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2));

// ── Console report ────────────────────────────────────────────────────────────

const hr = '─'.repeat(70);
console.log('\nCross-folio link candidates');
console.log(hr);
console.log(`Figure-name matches:        ${figureMatches.length}`);
console.log(`Keyword overlap (>=2 terms): ${keywordMatches.length}`);
console.log(`  high (>=4 terms):         ${keywordMatches.filter(c => c.confidence === 'high').length}`);
console.log(`  medium (3 terms):         ${keywordMatches.filter(c => c.confidence === 'medium').length}`);
console.log(`  low (2 terms):            ${keywordMatches.filter(c => c.confidence === 'low').length}`);
console.log();
console.log(`Full results -> modules/_xlink_candidates.json`);
