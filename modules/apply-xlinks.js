'use strict';
/**
 * apply-xlinks.js
 * Applies confirmed cross-folio links from _xlink_candidates.json to the actual folio
 * entries, writing bidirectional entry.xlinks[]. This is the "apply" step of the
 * propose (build-xlink-candidates.js) -> review (human) -> apply workflow — it does NOT
 * decide which candidates are correct; it takes an explicit, reviewed list of pairs.
 *
 * Usage: node modules/apply-xlinks.js
 * Edit SELECTED_PAIRS below (or the selection logic that builds it) to control scope —
 * intentionally not "apply everything in the candidates file", since low/medium
 * confidence matches need individual review first.
 *
 * Idempotent (skips a pair if both sides already reference each other) and
 * formatting-preserving (splices into the raw file text, same approach as
 * build-keywords.js, rather than reserializing the whole file).
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;

// ── Selection: which candidates to actually apply ────────────────────────────
// Scope for this run: all figure-name matches (dynasty+date checked, all high
// confidence) plus high-confidence keyword-overlap matches (>=4 shared terms).
// Medium/low confidence keyword matches are NOT included — several carry explicit
// "verify same entity" date-gap warnings that need individual review, not a blanket
// apply.
const candidates = JSON.parse(fs.readFileSync(path.join(DIR, '_xlink_candidates.json'), 'utf8'));
const SELECTED_PAIRS = [
  ...candidates.figure_name_matches.map(m => [m.xlink_a, m.xlink_b]),
  ...candidates.keyword_matches.filter(m => m.confidence === 'high').map(m => [m.xlink_a, m.xlink_b]),
];

// ── Aggregate into per-entry target sets (bidirectional, deduped) ────────────
const xlinksToAdd = new Map(); // "folio::id" -> Set of "folio::id"
for (const [a, b] of SELECTED_PAIRS) {
  if (!xlinksToAdd.has(a)) xlinksToAdd.set(a, new Set());
  if (!xlinksToAdd.has(b)) xlinksToAdd.set(b, new Set());
  xlinksToAdd.get(a).add(b);
  xlinksToAdd.get(b).add(a);
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Same string-state-tracking close-brace finder as build-keywords.js.
function findEntryClose(text, fromIndex) {
  let inString = false, esc = false;
  for (let i = fromIndex; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '}') return i;
  }
  return -1;
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && !f.startsWith('_') && f !== 'schema.json').sort();

let entriesUpdated = 0, alreadyPresent = 0, errors = 0;

for (const file of files) {
  const folioId = file.replace(/\.json$/, '');
  let text = fs.readFileSync(path.join(DIR, file), 'utf8');
  const data = JSON.parse(text);
  let fileChanged = false;

  for (const cat of data.categories || []) {
    for (const e of cat.entries || []) {
      const key = `${folioId}::${e.id}`;
      if (!xlinksToAdd.has(key)) continue;

      const existing = new Set(e.xlinks || []);
      const targets = [...xlinksToAdd.get(key)].sort();
      const merged = [...new Set([...existing, ...targets])].sort();
      if (existing.size === merged.length && targets.every(t => existing.has(t))) {
        alreadyPresent++;
        continue;
      }

      const idRe = new RegExp('"id"\\s*:\\s*"' + escapeRegex(e.id) + '"');
      const m = idRe.exec(text);
      if (!m) { console.error(`WARN: could not locate id "${e.id}" in ${file}`); errors++; continue; }
      const closeIdx = findEntryClose(text, m.index);
      if (closeIdx === -1) { console.error(`WARN: no closing brace for "${e.id}" in ${file}`); errors++; continue; }

      const span = text.slice(m.index, closeIdx);
      const multiline = span.includes('\n');
      const xlinksJson = JSON.stringify(merged);

      let prevEnd = closeIdx;
      while (prevEnd > m.index && /\s/.test(text[prevEnd - 1])) prevEnd--;

      // If xlinks already exists, we need to replace the old field instead of inserting
      // a new one — find and remove the old "xlinks": [...] span first.
      let insertion;
      if (e.xlinks) {
        const xlRe = /"xlinks"\s*:\s*\[[^\]]*\]/;
        const window = text.slice(m.index, closeIdx);
        const xlMatch = xlRe.exec(window);
        if (xlMatch) {
          const absStart = m.index + xlMatch.index;
          const absEnd = absStart + xlMatch[0].length;
          text = text.slice(0, absStart) + `"xlinks": ${xlinksJson}` + text.slice(absEnd);
          fileChanged = true;
          entriesUpdated++;
          continue;
        }
      }

      if (multiline) {
        const lineStart = text.lastIndexOf('\n', closeIdx) + 1;
        const braceIndent = text.slice(lineStart, closeIdx).match(/^\s*/)[0];
        insertion = ',\n' + braceIndent + '  "xlinks": ' + xlinksJson;
      } else {
        insertion = ',"xlinks":' + xlinksJson;
      }
      text = text.slice(0, prevEnd) + insertion + text.slice(prevEnd);
      fileChanged = true;
      entriesUpdated++;
    }
  }

  if (fileChanged) {
    JSON.parse(text); // safety check before writing
    fs.writeFileSync(path.join(DIR, file), text, 'utf8');
    console.log('updated', file);
  }
}

console.log('---');
console.log(`${entriesUpdated} entries updated, ${alreadyPresent} already had these xlinks, ${errors} error(s)`);
if (errors > 0) process.exit(1);
