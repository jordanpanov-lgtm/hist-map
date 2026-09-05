'use strict';
/*
 * Hist-Map folio validator — zero dependencies (pure Node).
 *
 * Two tiers:
 *   ERROR   — structural or referential breakage. Exits non-zero → fails CI.
 *   WARNING — editorial/consistency nits (e.g. unmapped tag/category). Reported, never blocks.
 *
 * Run:  node modules/validate.js
 * The human contract is GROUPING_GUIDE.md; the portable machine contract is modules/schema.json.
 */
const fs   = require('fs');
const path = require('path');

const DIR = path.join(__dirname);
const CONFIG_DIR = path.join(__dirname, '..', 'config');

// Load region/period/style config the same way index.html does (concatenated <script> globals).
// vm.runInContext with `const` doesn't attach properties to the sandbox object, so pull the
// values out with a trailing expression evaluated in the same context instead.
const vm = require('vm');
const configSrc = ['registry.js', 'regions.js', 'style.js']
  .map(f => fs.readFileSync(path.join(CONFIG_DIR, f), 'utf8'))
  .join('\n');
const { MODULES, TAXONOMY, PERIODS, CAT_ICONS } = vm.runInNewContext(
  configSrc + '\n({ MODULES, TAXONOMY, PERIODS, CAT_ICONS });',
  {},
  { filename: 'config-bundle.js' }
);

// Flatten every id that can legally appear as a folio's `region` — any tier
// (region, sub-region, or zone) is valid per the documented folio-placement rules.
const REGION_IDS = new Set();
for (const region of TAXONOMY) {
  REGION_IDS.add(region.id);
  for (const sub of region.subs) {
    REGION_IDS.add(sub.id);
    for (const zone of sub.zones) REGION_IDS.add(zone.id);
  }
}
const PERIOD_IDS = new Set(PERIODS.map(p => p.id));
const CANON_CATS = ['power', 'conflict', 'order', 'belief', 'expression', 'thought', 'economy', 'technology', 'exchange', 'world', 'lives'];
const REQUIRED_ENTRY = ['id', 'group', 'label', 'date', 'loc', 'coords', 'hint', 'tag', 'note'];
const REQUIRED_FOLIO = ['id', 'title', 'subtitle', 'period', 'region', 'period_label', 'mapCenter', 'mapZoom', 'categories', 'timeline'];
const XLINK_RE = /^[a-z0-9-]+::.+$/;

const errors = [];
const warns = [];
const err = (folio, msg) => errors.push(`${folio}: ${msg}`);
const warn = (folio, msg) => warns.push(`${folio}: ${msg}`);

const allJson = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && !f.startsWith('_') && f !== 'schema.json').sort();
const nexusFiles = allJson.filter(f => f.endsWith('.nexus.json'));
const files = allJson.filter(f => !f.endsWith('.nexus.json'));

// ── Pass 1: parse every folio, collect all global keys for xlink resolution ──
const folios = {};
const globalKeys = new Set();
for (const file of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  } catch (e) {
    err(file, `JSON parse failed — ${e.message}`);
    continue;
  }
  if (!data.id) { err(file, 'missing top-level "id"'); continue; }
  folios[data.id] = { file, data };
  for (const cat of (data.categories || [])) {
    for (const e of (cat.entries || [])) {
      globalKeys.add(`${data.id}::${e.id}`);
    }
  }
}

// ── Cross-check: every registered MODULES entry must have a matching folio, and vice versa ──
const registeredIds = new Set(MODULES.map(m => m.id));
for (const m of MODULES) {
  if (!folios[m.id]) err(m.file, `registered in config/registry.js MODULES but folio not found/parseable`);
  if (!REGION_IDS.has(m.region)) err(m.file, `MODULES registry region "${m.region}" not found at any tier of TAXONOMY`);
  if (!PERIOD_IDS.has(m.period)) err(m.file, `MODULES registry period "${m.period}" not in PERIODS`);
}
for (const folioId of Object.keys(folios)) {
  if (!registeredIds.has(folioId)) warn(folios[folioId].file, `folio id "${folioId}" not registered in config/registry.js MODULES`);
}

// ── Pass 2: validate each folio ──
for (const folioId of Object.keys(folios)) {
  const { file, data } = folios[folioId];

  // folio-level required fields
  for (const f of REQUIRED_FOLIO) {
    if (data[f] === undefined) err(file, `missing folio field "${f}"`);
  }
  if (data.region !== undefined && !REGION_IDS.has(data.region)) {
    err(file, `region "${data.region}" not found at any tier (region/sub-region/zone) of TAXONOMY`);
  }
  if (data.period_label !== undefined && !PERIOD_IDS.has(data.period_label)) {
    err(file, `period_label "${data.period_label}" not in allowed set (${[...PERIOD_IDS].join(', ')})`);
  }

  // categories: ids must be from the canonical 11, no fixed count/order (folios use a field-specific subset)
  for (const cat of (data.categories || [])) {
    if (!CANON_CATS.includes(cat.id)) {
      err(file, `category id "${cat.id}" not in known set (${CANON_CATS.join(', ')})`);
    } else if (!CAT_ICONS[cat.id] && !cat.icon) {
      warn(file, `category "${cat.id}" has no icon override in config/style.js and no per-folio "icon" fallback`);
    }
  }

  // entries
  const ids = new Set();
  for (const cat of (data.categories || [])) {
    for (const e of (cat.entries || [])) {
      const tag = `${folioId}::${e.id}`;

      // duplicate ids
      if (ids.has(e.id)) err(file, `duplicate entry id "${e.id}"`);
      ids.add(e.id);

      // required fields
      for (const rf of REQUIRED_ENTRY) {
        if (e[rf] === undefined) err(file, `${e.id}: missing required field "${rf}"`);
      }

      // coords: required [lat(-90..90), lng(-180..180)]
      const c = e.coords;
      if (!Array.isArray(c) || c.length !== 2 || typeof c[0] !== 'number' || typeof c[1] !== 'number'
          || c[0] < -90 || c[0] > 90 || c[1] < -180 || c[1] > 180) {
        err(file, `${e.id}: coords must be [lat(-90..90), lng(-180..180)] (got ${JSON.stringify(c)})`);
      }

      // keywords: optional (auto-seeded), just check non-empty strings
      if (e.keywords !== undefined) {
        if (!Array.isArray(e.keywords) || e.keywords.some(k => typeof k !== 'string' || !k.trim())) {
          err(file, `${e.id}: keywords must be an array of non-empty strings (got ${JSON.stringify(e.keywords)})`);
        }
      }

      // xlinks: optional, must resolve to a real global key
      for (const x of (e.xlinks || [])) {
        if (!XLINK_RE.test(x)) err(file, `${e.id}: xlink "${x}" malformed (expected folioId::entryId)`);
        else if (!globalKeys.has(x)) err(file, `${e.id}: xlink "${x}" does not resolve to a real entry`);
      }
    }
  }

  // timeline entryId references
  for (const lane of (data.timeline || [])) {
    for (const ev of (lane.events || [])) {
      if (ev.entryId && !ids.has(ev.entryId)) err(file, `timeline references missing entry "${ev.entryId}"`);
    }
  }
}

// ── Pass 3: validate each Nexus sidecar (<folioId>.nexus.json → { nodes, edges }) ──
// Contract: NEXUS_GUIDE.md. Node ids/lanes for non-external nodes must match a real
// folio entry; edges are [from, to, tier, why] 4-tuples over declared node ids.
const NEXUS_TIERS = new Set(['strong', 'loose']);
for (const file of nexusFiles) {
  const folioId = file.replace(/\.nexus\.json$/, '');
  let nx;
  try {
    nx = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  } catch (e) {
    err(file, `JSON parse failed — ${e.message}`);
    continue;
  }
  if (!Array.isArray(nx.nodes) || !Array.isArray(nx.edges)) {
    err(file, 'Nexus sidecar must be { nodes: [...], edges: [...] }');
    continue;
  }
  const folio = folios[folioId];
  if (!folio) err(file, `no folio "${folioId}" for this Nexus sidecar`);
  const folioEntry = {}; // id → category id
  if (folio) {
    for (const cat of (folio.data.categories || [])) {
      for (const e of (cat.entries || [])) folioEntry[e.id] = cat.id;
    }
  }

  const nodeIds = new Set();
  for (const n of nx.nodes) {
    if (!n || typeof n.id !== 'string') { err(file, `node missing string "id" (${JSON.stringify(n)})`); continue; }
    if (nodeIds.has(n.id)) err(file, `duplicate node id "${n.id}"`);
    nodeIds.add(n.id);
    for (const rf of ['lane', 'year', 'label', 'full', 'src']) {
      if (n[rf] === undefined) err(file, `node "${n.id}": missing "${rf}"`);
    }
    if (typeof n.year !== 'number') err(file, `node "${n.id}": "year" must be a number`);
    if (n.external) {
      if (n.lane !== 'external') err(file, `node "${n.id}": external node must have lane "external"`);
    } else {
      if (n.lane !== undefined && n.lane !== 'external' && !CANON_CATS.includes(n.lane)) {
        err(file, `node "${n.id}": lane "${n.lane}" not a canonical category`);
      }
      if (folio && !(n.id in folioEntry)) {
        err(file, `node "${n.id}": no matching entry in folio "${folioId}" (mark external:true if intentional)`);
      } else if (folio && n.lane !== folioEntry[n.id]) {
        err(file, `node "${n.id}": lane "${n.lane}" ≠ folio entry category "${folioEntry[n.id]}"`);
      }
    }
  }

  const seenPairs = new Set();
  const touched = new Set();
  for (const edge of nx.edges) {
    if (!Array.isArray(edge) || edge.length !== 4) {
      err(file, `edge must be [from, to, tier, why] (got ${JSON.stringify(edge)})`);
      continue;
    }
    const [a, b, tier, why] = edge;
    if (!nodeIds.has(a)) err(file, `edge from unknown node "${a}"`);
    if (!nodeIds.has(b)) err(file, `edge to unknown node "${b}"`);
    if (a === b) err(file, `edge is a self-loop on "${a}"`);
    if (!NEXUS_TIERS.has(tier)) err(file, `edge ${a}→${b}: tier "${tier}" not "strong"|"loose"`);
    if (typeof why !== 'string' || !why.trim()) err(file, `edge ${a}→${b}: "why" must be a non-empty string`);
    else if (why.trim().split(/\s+/).length < 3) warn(file, `edge ${a}→${b}: "why" reads like a placeholder ("${why}")`);
    const key = [a, b].sort().join('~');
    if (seenPairs.has(key)) err(file, `duplicate edge between "${a}" and "${b}"`);
    seenPairs.add(key);
    touched.add(a); touched.add(b);
  }
  for (const n of nx.nodes) {
    if (n && n.id && !touched.has(n.id)) warn(file, `node "${n.id}" is an orphan (no edges)`);
  }
}

// ── Report ──
const line = '─'.repeat(60);
console.log(line);
if (warns.length) {
  console.log(`⚠  ${warns.length} warning(s):`);
  for (const w of warns.slice(0, 40)) console.log(`   ${w}`);
  if (warns.length > 40) console.log(`   … and ${warns.length - 40} more`);
  console.log(line);
}
if (errors.length) {
  console.log(`✗  ${errors.length} ERROR(s):`);
  for (const e of errors) console.log(`   ${e}`);
  console.log(line);
  console.log(`FAILED — ${errors.length} error(s), ${warns.length} warning(s)`);
  process.exit(1);
} else {
  console.log(`✓  PASSED — 0 errors, ${warns.length} warning(s) across ${Object.keys(folios).length} folios`);
}
