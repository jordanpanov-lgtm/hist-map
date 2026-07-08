'use strict';
/*
 * Hist-Map keyword auto-seeder — zero dependencies (pure Node).
 *
 * Unlike sci-map's keywords (abstract concept terms — "working memory", "oxytocin"),
 * hist-map's cross-folio linking signal is almost entirely proper nouns: the same king,
 * dynasty or city recurring across different period folios. So this extracts capitalized
 * name/place phrases from `loc`, `label` and `hint` (a lightweight proper-noun-phrase
 * heuristic, not generic word tokenization), plus `dynasty` verbatim when present.
 * `note` is deliberately excluded — it's citation apparatus (modern historians' names,
 * archive names) that would pollute cross-folio matching with false positives.
 *
 * Idempotent: entries that already have a `keywords` field are left untouched, so manual
 * edits survive re-runs. Rewrites JSON via targeted string splicing (not JSON.stringify)
 * so existing per-file formatting (compact vs. multi-line entries) is preserved exactly —
 * a full reserialize would turn a 4-line diff into a whole-file diff.
 *
 * Run:  node modules/build-keywords.js           (writes changes)
 *       node modules/build-keywords.js --dry-run  (reports counts only)
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname);
const DRY_RUN = process.argv.includes('--dry-run');
const MAX_KEYWORDS = 6;

// Lowercase connector words that continue a proper-noun phrase already in progress
// (e.g. "Kingdom of Toledo", "Al-Andalus"). Trimmed if left dangling at the end of a
// phrase. Roman numerals ("Juan Carlos I") are NOT here — they're already capitalized
// so isCap() picks them up directly, and trimming would strip real regnal numbers.
const GLUE = new Set([
  'de', 'del', 'of', 'the', 'al', 'ibn', 'bin', 'von', 'van', 'da', 'di', 'le', 'la',
]);

// Single capitalized words that are too generic to be useful alone (function words,
// or historical nouns generic enough to false-positive-link unrelated entries). Also
// used to trim leading words off multi-word phrases — sentence-initial capitalization
// ("The Roman general...", "After Odaenathus's death...") otherwise leaks into phrases.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'his', 'her', 'its', 'their', 'this', 'that', 'these', 'those',
  'he', 'she', 'it', 'they', 'in', 'on', 'at', 'by', 'for', 'with', 'after', 'before',
  'during', 'when', 'while', 'and', 'but', 'or', 'so', 'as', 'is', 'was', 'were', 'are',
  'under', 'over', 'from', 'to', 'of', 'also', 'later', 'then', 'some', 'many', 'first',
  'second', 'third', 'new', 'old', 'great', 'king', 'queen', 'prince', 'emperor',
  'general', 'president', 'battle', 'war', 'city', 'river', 'kingdom', 'empire',
  'council', 'church', 'state', 'crown', 'republic', 'government', 'army', 'court',
  'law', 'treaty', 'palace', 'style', 'era', 'age', 'period', 'century', 'restoration',
  'called', 'named', 'known', 'styled', 'held', 'ruled', 'born', 'died', 'took', 'made',
  'gave', 'sent', 'saw', 'went', 'came', 'following', 'since', 'upon', 'given', 'though',
  'unlike', 'despite', 'still', 'once', 'until', 'per', 'via', 'within', 'across',
  // Catalog/provenance metadata words — loc fields often follow a "Found: X · Now: Y"
  // museum-label convention; these are field labels, not content, and were leaking in
  // as if they were meaningful place/person keywords.
  'found', 'now', 'located', 'discovered', 'excavated', 'housed', 'kept', 'extant',
  // Nationality/civilization demonyms — legitimate as prose but useless as a keyword:
  // "French"/"Spanish"/"Roman" recur across a thousand years of otherwise-unrelated
  // entries and produce false cross-folio links on pure co-occurrence.
  'french', 'spanish', 'roman', 'english', 'german', 'italian', 'portuguese', 'arab',
  'byzantine', 'persian', 'greek', 'turkish', 'moorish',
]);

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Strip a trailing possessive ('s / ’s / bare trailing ' after plural-looking words)
// so "Odaenathus's" and "Kings'" normalize to the same keyword as the bare name.
function stripPossessive(w) {
  return w.replace(/['’]s$/i, '').replace(/s['’]$/i, 's').replace(/['’]$/, '');
}

function extractPhrases(text) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const phrases = [];
  let current = [];
  const flush = () => {
    // trim trailing connector words
    while (current.length && GLUE.has(current[current.length - 1].toLowerCase())) current.pop();
    // trim leading stopwords/weak-verbs (sentence-initial junk like "The X" or chains
    // like "Battle of X"), but never trim past the last remaining word. A plain `while`
    // without the length>1 guard can erase a real multi-word proper noun whose parts each
    // happen to also be common words on their own — e.g. "Third Republic": "Third" and
    // "Republic" are both in STOPWORDS individually, but together they're a specific
    // historical term, and unconditional cascading used to collapse it to nothing.
    while (current.length > 1 && STOPWORDS.has(current[0].toLowerCase())) current.shift();
    if (current.length) phrases.push(current.join(' '));
    current = [];
  };
  for (const raw of words) {
    // a hard separator (; : , . — –) attached to this token ends the phrase here,
    // even if the *next* token also happens to be capitalized (e.g. a list of places).
    const hardBreakAfter = /[;:,.]|[—–]$/.test(raw);
    let clean = raw.replace(/^[^\wÀ-ſ]+|[^\wÀ-ſ]+$/g, '');
    clean = stripPossessive(clean);
    if (!clean) { flush(); continue; }
    // Arabic-convention names write the definite article lowercase and hyphenated
    // directly onto the following name ("al-Mundhir", "al-Harith"), not as a separate
    // capitalized word — treat that as name-starting too, not just mid-phrase GLUE,
    // otherwise a label that begins with one ("al-Mundhir III ibn al-Numan") never
    // starts a phrase at all and the whole name is lost.
    const isCap = /^[A-ZÀ-Ý]/.test(clean) || /^al-[A-ZÀ-Ý]/.test(clean);
    if (isCap) current.push(clean);
    else if (GLUE.has(clean.toLowerCase()) && current.length) current.push(clean);
    else { flush(); continue; }
    if (hardBreakAfter) flush();
  }
  flush();
  return phrases;
}

function isUsefulSingleWord(w) {
  if (w.length < 3) return false;
  if (STOPWORDS.has(w.toLowerCase())) return false;
  if (/^[IVXLCDM]+$/.test(w)) return false;
  if (/^\d+$/.test(w)) return false;
  return true;
}

// True if `shorter` occurs in `longer` as a whole-word run (e.g. "juan carlos" inside
// "juan carlos i"), used to collapse near-duplicates like "Juan Carlos" + "Juan Carlos I".
function isWordSubphrase(shorter, longer) {
  return new RegExp('(^|\\s)' + escapeRegex(shorter) + '(\\s|$)').test(longer);
}

function buildKeywords(entry) {
  const seen = new Map(); // lowercase → first-seen original casing
  const add = (phrase) => {
    if (!phrase) return;
    const p = phrase.trim();
    if (p.length < 3) return;
    const words = p.split(/\s+/);
    if (words.length === 1 && !isUsefulSingleWord(words[0])) return;
    const key = p.toLowerCase();
    if (seen.has(key)) return;
    for (const [existingKey] of seen) {
      if (isWordSubphrase(key, existingKey)) return; // new phrase is contained in one we already have
      if (isWordSubphrase(existingKey, key)) { seen.delete(existingKey); break; } // new phrase extends an existing one — replace it
    }
    seen.set(key, p);
  };

  if (entry.dynasty) add(entry.dynasty);
  for (const p of extractPhrases(entry.loc || '')) add(p);
  for (const p of extractPhrases(entry.label || '')) add(p);
  for (const p of extractPhrases(entry.hint || '')) {
    if (p.split(/\s+/).length >= 2) add(p); // hint prose is noisier — multi-word phrases only
  }

  return [...seen.values()].slice(0, MAX_KEYWORDS);
}

// Locate the entry's closing `}` by scanning forward from its `"id"` field, tracking
// string state so a stray brace inside quoted text can't be mistaken for it. Entries
// have no nested objects (only flat arrays for coords/keywords/xlinks), so the first
// unescaped `}` outside a string after the id is unambiguously the entry's own close.
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

function injectKeywords(fileText, data) {
  let out = fileText;
  let added = 0, skippedExisting = 0, skippedEmpty = 0;
  for (const cat of data.categories || []) {
    for (const e of cat.entries || []) {
      if (e.keywords !== undefined) { skippedExisting++; continue; }
      const kws = buildKeywords(e);
      if (!kws.length) { skippedEmpty++; continue; }

      const idRe = new RegExp('"id"\\s*:\\s*"' + escapeRegex(e.id) + '"');
      const m = idRe.exec(out);
      if (!m) { console.error(`  WARN: could not locate id "${e.id}" in text — skipped`); continue; }
      const closeIdx = findEntryClose(out, m.index);
      if (closeIdx === -1) { console.error(`  WARN: no closing brace found for "${e.id}" — skipped`); continue; }

      const span = out.slice(m.index, closeIdx);
      const multiline = span.includes('\n');
      const kwJson = JSON.stringify(kws);

      // Insert right after the previous field's value, not right before `}` — otherwise
      // the new field's leading comma ends up dangling alone on the old `}`'s line
      // instead of terminating the previous field, e.g.:
      //   "note": "..."          "note": "...",
      //   ,                 vs.  "keywords": [...]
      //     "keywords": [...]},         },
      let prevEnd = closeIdx;
      while (prevEnd > m.index && /\s/.test(out[prevEnd - 1])) prevEnd--;

      let insertion;
      if (multiline) {
        const lineStart = out.lastIndexOf('\n', closeIdx) + 1;
        const braceIndent = out.slice(lineStart, closeIdx).match(/^\s*/)[0];
        insertion = ',\n' + braceIndent + '  "keywords": ' + kwJson;
      } else {
        insertion = ',"keywords":' + kwJson;
      }
      out = out.slice(0, prevEnd) + insertion + out.slice(prevEnd);
      added++;
    }
  }
  return { out, added, skippedExisting, skippedEmpty };
}

module.exports = { extractPhrases, buildKeywords, stripPossessive, isUsefulSingleWord };

// Guard the actual file-writing driver so `require()`-ing this module (e.g. to unit-test
// buildKeywords in isolation) can never trigger a real write as a side effect.
if (require.main === module) {
main();
}

function main() {
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && !f.startsWith('_') && f !== 'schema.json').sort();
let totalAdded = 0, totalSkippedExisting = 0, totalSkippedEmpty = 0, totalErrors = 0;

for (const file of files) {
  const filePath = path.join(DIR, file);
  const fileText = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(fileText);
  } catch (e) {
    console.error(`✗ ${file}: JSON parse failed — ${e.message}`);
    totalErrors++;
    continue;
  }

  const { out, added, skippedExisting, skippedEmpty } = injectKeywords(fileText, data);
  totalAdded += added;
  totalSkippedExisting += skippedExisting;
  totalSkippedEmpty += skippedEmpty;

  if (added === 0) { console.log(`  ${file}: no changes (${skippedExisting} already had keywords, ${skippedEmpty} yielded none)`); continue; }

  // Safety check: the rewritten text must still be valid JSON and structurally equivalent
  // (same entry count) before we write it.
  let reparsed;
  try {
    reparsed = JSON.parse(out);
  } catch (e) {
    console.error(`✗ ${file}: rewritten text failed to re-parse — ${e.message} — NOT written`);
    totalErrors++;
    continue;
  }
  const origEntryCount = (data.categories || []).reduce((n, c) => n + (c.entries || []).length, 0);
  const newEntryCount = (reparsed.categories || []).reduce((n, c) => n + (c.entries || []).length, 0);
  if (origEntryCount !== newEntryCount) {
    console.error(`✗ ${file}: entry count changed ${origEntryCount} → ${newEntryCount} — NOT written`);
    totalErrors++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`  ${file}: would add keywords to ${added} entries (dry run)`);
  } else {
    fs.writeFileSync(filePath, out, 'utf8');
    console.log(`✓ ${file}: added keywords to ${added} entries`);
  }
}

console.log('─'.repeat(60));
console.log(`${DRY_RUN ? '[dry run] ' : ''}${totalAdded} entries seeded, ${totalSkippedExisting} already had keywords, ${totalSkippedEmpty} yielded none, ${totalErrors} error(s)`);
if (totalErrors > 0) process.exit(1);
}
