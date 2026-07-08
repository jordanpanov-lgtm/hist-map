# Hist-Map — Agent Instructions

## This project

- **Repo:** `C:\Users\josol\Downloads\04. social\hist-map` (GitHub: `jordanpanov-lgtm/hist-map`)
- **Dev server:** `npx http-server -p 8134 -c-1 .` from the `hist-map/` root
- **Do NOT confuse with** `sci-map` (a sibling project in `04. social/` — same architecture family,
  organised by scientific field instead of region×time) or `mydceo`/`knowledge-library` — separate
  repos, separate servers.

Hist-Map organises history by **region × time period**, not by domain like sci-map. Every folio is
one kingdom/state/era (e.g. "Visigothic Spain 589–711", "Spain 1975–today"). Entries anchor to a
**datable primary source** (chronicle, inscription, coin, treaty text, official gazette) — the
history-folio equivalent of sci-map's landmark-study anchor. Facts are events, not scientific
findings; the two projects share tooling, not content methodology.

---

## For any folio work — read these first, every time

```
modules/GROUPING_GUIDE.md       ← WHAT group/taxonomy to use, terminology rules, historiographic
                                   corrections — this is hist-map's hard-won content methodology,
                                   specific to history-as-events. Do not import sci-map's science-
                                   specific rules (repl badges, domain taxonomy) into this file.
modules/FIELD_GUIDE.md          ← entry/folio SCHEMA reference (fields, keywords, xlinks, validation)
.claude/commands/new-folio.md   ← full creation workflow incl. batch checkpointing
```

Do **not** infer the schema from existing JSON files — a few predate the current conventions.
FIELD_GUIDE.md is the schema truth; GROUPING_GUIDE.md is the content-taxonomy truth.

---

## Key locations in `config/`

| Thing | Where |
|---|---|
| `MODULES` array (register a folio, its `region`/`period`) | `config/registry.js` |
| `TAXONOMY` (region tree) / `PERIODS` (time axis) | `config/regions.js` |
| `CAT_ICONS` (category icon overrides) | `config/style.js` |

Register every new folio in `config/registry.js`'s `MODULES`. Unlike sci-map, there is no separate
study-plan file and no `TAG_COLORS` — entry accent color comes from its own category's `accent`
field (set per-folio in the JSON itself, not centrally), and there is no per-tag color system.

---

## Keywords — auto-generated, do not hand-author

Unlike sci-map (where keywords are manually written, 3–5 per entry, during folio authoring),
hist-map's keywords are **entirely auto-generated** by a proper-noun-phrase extractor, because the
cross-folio linking signal here is names and places, not abstract concepts:

```
node modules/build-keywords.js
```

Run this once after all entries in a folio are written — it's idempotent (skips entries that already
have `keywords`) and safe to re-run. Do not write `keywords` by hand; if the extractor produces a bad
phrase for a specific entry, fix it by improving `build-keywords.js`'s extraction rules (it's a shared
utility used corpus-wide), not by hand-patching one entry's output.

---

## Global cross-folio index and xlinks

`modules/_global_index.json` maps every `folio::entryId` across all folios, aggregates keywords into
a corpus-wide inverted index, and tracks xlink reciprocity. It's also fetched at runtime by
`index.html` (as `GIDX`) to label the "RELATED ENTRIES" panel in the entry modal — it is not just a
build artifact, keep it in sync.

**Rebuild it after any change to entries, keywords, or xlinks:**
```
node modules/build-global-index.js
```
CI fails if the committed file doesn't match a fresh rebuild — always commit it alongside content
changes.

**Xlink workflow (propose → review → apply), more automated than sci-map's fully-manual version:**
1. `node modules/build-xlink-candidates.js` — scans for candidates via figure-name matching (dynasty
   + date sanity-checked) and keyword overlap (geographic-only matches with a real date gap are
   dropped automatically). Writes `modules/_xlink_candidates.json`. Also writes
   `dynasty_alignment_proposals` — cases where the same person has inconsistent `dynasty` labels
   across entries; these are a signal to fix the *source data*, not to add an xlink.
2. **Human reviews** the candidates file. Even after all the automated checks, treat every "high
   confidence" match with real scrutiny — this pipeline has repeatedly produced confident-sounding,
   factually wrong matches (e.g. two different rival kings sharing a regnal name) that only caught
   on close historical review. Don't trust a match just because the tooling accepted it.
3. `node modules/apply-xlinks.js` — applies an explicitly reviewed/selected set of pairs (edit
   `SELECTED_PAIRS`'s construction at the top of the script to control scope). Never apply
   everything in the candidates file blindly.

---

## Validate before every commit

```
node modules/validate.js
```
Must show 0 errors before committing. Warnings are informational (currently 0 in the corpus — keep it
that way; if a check starts producing noise, fix the check or the data, don't let it accumulate).
