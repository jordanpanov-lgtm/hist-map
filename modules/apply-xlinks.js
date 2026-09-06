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
// Scope for this run (2026-09, the Arabia-folio split pass): the automated
// candidate file this time is dominated by place- and civilisation-name tokens
// ("Gulf", "Dilmun", "Sasanian", "Qatar") rather than genuine figure matches, so
// a blanket apply of figure_name_matches / keyword_matches would pollute the
// graph. Instead this is an EXPLICIT, hand-verified list — chiefly the temporal
// hand-offs between folios that were split at a period boundary in this pass
// (dilmun, magan, beth-qatraye, trucial-gulf), each checked entry-by-entry.
JSON.parse(fs.readFileSync(path.join(DIR, '_xlink_candidates.json'), 'utf8')); // keep the file fresh; not consumed here
const SELECTED_PAIRS = [
  // ── egypt-2100bc-1550bc (Middle Kingdom & the Hyksos): hand-off from the Old Kingdom folio ──
  ['egypt-2100bc-1550bc::k1', 'egypt-3000bc-2100bc::k15'],  // Mentuhotep II completes the reunification Intef II began
  ['egypt-2100bc-1550bc::c1', 'egypt-3000bc-2100bc::c7'],   // Intef II's campaigns vs Herakleopolis → Mentuhotep II's victory
  ['egypt-2100bc-1550bc::c1', 'egypt-3000bc-2100bc::c6'],   // the FIP civil war → its resolution
  ['egypt-2100bc-1550bc::c1', 'egypt-3000bc-2100bc::w3'],   // the collapse-and-reunification cycle
  ['egypt-2100bc-1550bc::c6', 'egypt-3000bc-2100bc::c6'],   // Thebes as reunifier — again, against the Hyksos
  ['egypt-2100bc-1550bc::b1', 'egypt-3000bc-2100bc::b5'],   // Abydos becomes the Osiris centre → the Osiris mysteries
  ['egypt-2100bc-1550bc::b3', 'egypt-3000bc-2100bc::b7'],   // Monthu of Thebes rises → Amun of Thebes rises to national god
  ['egypt-2100bc-1550bc::e4', 'egypt-3000bc-2100bc::ec4'],  // state turquoise/copper mining in Sinai → the MK expedition system
  ['egypt-2100bc-1550bc::o1', 'egypt-3000bc-2100bc::o1'],   // the nome system → the rebuilt central state at Itjtawy
  ['egypt-2100bc-1550bc::o3', 'egypt-3000bc-2100bc::o6'],   // nomarch offices become hereditary → Senwosret III curbs them
  // ── Dilmun: Bronze Age → Late Dilmun ──
  ['dilmun-3000bc-1200bc::k4', 'dilmun-1200bc-600bc::o1'],   // Kassite governor → the kingship revived
  ['dilmun-3000bc-1200bc::ec6', 'dilmun-1200bc-600bc::ec1'], // entrepôt collapses → the tribute economy
  ['dilmun-3000bc-1200bc::b1', 'dilmun-1200bc-600bc::b1'],   // Inzak, gods of Dilmun → Inzak endures
  ['dilmun-3000bc-1200bc::b3', 'dilmun-1200bc-600bc::b2'],   // serpent burials → snake-bowl deposits continue
  ['dilmun-3000bc-1200bc::w3', 'dilmun-1200bc-600bc::o1'],   // Kassite Babylon absorbs Dilmun → local kingship re-forms
  ['dilmun-3000bc-1200bc::x1', 'magan-3000bc-1200bc::x1'],   // the Dilmun–Magan–Meluhha triangle (both sides)
  // ── Magan: Bronze Age → Iron Age / Maka ──
  ['magan-3000bc-1200bc::k4', 'magan-1200bc-300bc::k5'],     // Wadi Suq reorganisation → Iron Age settlement boom
  ['magan-3000bc-1200bc::tc4', 'magan-1200bc-300bc::tc1'],   // tin bronze → iron working reaches the peninsula
  ['magan-3000bc-1200bc::b2', 'magan-1200bc-300bc::b3'],     // carved serpents on tombs → the Iron Age snake shrines
  ['magan-3000bc-1200bc::t3', 'magan-1200bc-300bc::t2'],     // a world at the edge of literacy → the oral order under Persia
  ['magan-3000bc-1200bc::ec6', 'magan-1200bc-300bc::k5'],    // the aridity/Wadi Suq shift → the Iron Age recovery
  // ── Beth Qatraye: Late Antique → First Islamic Century ──
  ['beth-qatraye-240-632::k1', 'beth-qatraye-632-750::w3'],  // Sasanian province → the Arab conquest ends it
  ['beth-qatraye-240-632::c3', 'beth-qatraye-632-750::w3'],  // the empires exhaust themselves → the conquest
  ['beth-qatraye-240-632::b2', 'beth-qatraye-632-750::b2'],  // the bishoprics founded → the twilight of Gulf Christianity
  ['beth-qatraye-240-632::b3', 'beth-qatraye-632-750::e1'],  // the Gulf monasteries → the last phase at Al-Qusur
  ['beth-qatraye-240-632::t1', 'beth-qatraye-632-750::t3'],  // the Syriac school comes to the Gulf → the cluster of scholars
  ['beth-qatraye-240-632::t2', 'beth-qatraye-632-750::t2'],  // Gabriel of Qatar → Abraham bar Lipeh (who depends on him)
  ['beth-qatraye-240-632::k3', 'beth-qatraye-632-750::c2'],  // al-Mundhir accepts Islam → the Ridda war after his death
  ['beth-qatraye-240-632::k4', 'beth-qatraye-632-750::c3'],  // Jayfar & Abd bring Oman into Islam → the Battle of Dibba
  ['beth-qatraye-240-632::o4', 'beth-qatraye-632-750::lv4'], // the Prophet's letter / dhimma → becoming dhimmi
  ['beth-qatraye-240-632::b5', 'beth-qatraye-632-750::lv4'], // Jewish communities → becoming dhimmi
  ['beth-qatraye-240-632::ec1', 'beth-qatraye-632-750::ec1'],// the Sasanian trade artery → the trade under the caliphate
  ['beth-qatraye-240-632::ec3', 'beth-qatraye-632-750::ec3'],// pearl fishery under Persia → pearls as caliphal revenue
  ['beth-qatraye-240-632::e3', 'beth-qatraye-632-750::ec2'], // the Sasanian torpedo jar → the Sasanian–Islamic ceramic continuum
  ['beth-qatraye-240-632::tc1', 'beth-qatraye-632-750::tc1'],// Sasanian deep-water shipping → the sewn boat under new management
  ['beth-qatraye-632-750::b1', 'eastern-arabia-750-1200::k2'],// the Ibadi da'wa reaches Oman → the Imamate restored at Nizwa
  ['beth-qatraye-632-750::c4', 'eastern-arabia-750-1200::k2'],// the first imamate crushed → the imamate rebuilt a generation later
  // ── Trucial Gulf: Maritime Truce century → Pearl-bust-to-independence ──
  ['trucial-gulf-1820-1900::k1', 'trucial-gulf-1900-1971::k1'],   // the Political Resident → the Residency's last half-century
  ['trucial-gulf-1820-1900::o1', 'trucial-gulf-1900-1971::o2'],   // the treaty ladder → the Qatar treaty completes the system
  ['trucial-gulf-1820-1900::k6', 'trucial-gulf-1900-1971::k5'],   // the Al Thani recognised → Qatar enters the British system
  ['trucial-gulf-1820-1900::c4', 'trucial-gulf-1900-1971::k5'],   // the Ottoman occupation → the garrison leaves, Qatar joins the system
  ['trucial-gulf-1820-1900::ec1', 'trucial-gulf-1900-1971::ec1'], // the 19th-century pearl trade → the pearling golden age
  ['trucial-gulf-1820-1900::ec1', 'trucial-gulf-1900-1971::ec2'], // the pearl trade → the pearl crash
  ['trucial-gulf-1820-1900::lv1', 'trucial-gulf-1900-1971::lv1'], // the diver and the debt bond → the years of hunger
  ['trucial-gulf-1820-1900::lv2', 'trucial-gulf-1900-1971::lv2'], // the enslaved on the pearl banks → manumission and the long end of slavery
  ['trucial-gulf-1820-1900::o3', 'trucial-gulf-1900-1971::lv2'],  // the anti-slave-trade engagements → the long end of Gulf slavery
  ['trucial-gulf-1820-1900::x1', 'trucial-gulf-1900-1971::x1'],   // the Gulf run from India → from the India Office to the Foreign Office
  ['trucial-gulf-1820-1900::x2', 'trucial-gulf-1900-1971::x2'],   // merchants across the water → the Lingeh merchants and the Ajam
  ['trucial-gulf-1820-1900::lv4', 'trucial-gulf-1900-1971::x2'],  // the Ajam and the Hawala → the Lingeh merchants and the Ajam
  ['trucial-gulf-1820-1900::e1', 'trucial-gulf-1900-1971::e1'],   // the wind-tower house → the wind-tower house at its peak and end
  ['trucial-gulf-1820-1900::t1', 'trucial-gulf-1900-1971::t1'],   // the Persian Gulf charted → Lorimer's Gazetteer
  ['trucial-gulf-1820-1900::t3', 'trucial-gulf-1900-1971::t1'],   // tribal genealogy and the oral chronicle → Lorimer's Gazetteer
  ['trucial-gulf-1820-1900::w1', 'trucial-gulf-1900-1971::w2'],   // keeping the rivals out → Persian oil and the Royal Navy's fuel
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
