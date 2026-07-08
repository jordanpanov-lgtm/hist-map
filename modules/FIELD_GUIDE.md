# Hist-Map — Folio Schema Guide

The technical schema reference — fields, types, validation. For what *group* to use, terminology
rules, and content/historiographic guidance, see `GROUPING_GUIDE.md`; that file is the taxonomy
truth, this one is the schema truth. They're deliberately separate: schema is mechanical and
stable, taxonomy reflects the specific content this project has decided to prioritize and is
revised more often.

---

## The evidence principle

Every entry must anchor to a **datable primary source** — a chronicle, inscription, coin series,
treaty text, council act, or (for the modern period) an official gazette entry. This is hist-map's
equivalent of sci-map's landmark-study anchor, but the object being anchored to is a historical
document or artifact, not a scientific finding. The `note` field carries that citation. See
GROUPING_GUIDE.md's "Modern Period Folios" section for the evidence-anchor hierarchy in the 20th–21st
century, where sourcing gets more complex (state gazettes, electoral results, declassified
documents, journalism, academic synthesis, each with different reliability).

---

## Folio-level fields

```jsonc
{
  "id": "spain-1975-today",              // must match a MODULES[].id in config/registry.js
  "title": "Spain",
  "subtitle": "1975–today · Transition, Democracy and the Unfinished Nation",
  "period": { "start": 1975, "end": 2025 },  // integers; BC years are negative
  "region": "Iberia",                    // any tier of TAXONOMY in config/regions.js — zone,
                                          // sub-region, or top-level region. Use the zone when the
                                          // entity is local; the top-level region for something
                                          // genuinely cross-regional (Roman Empire -> "Europe").
                                          // See config/regions.js's own placement-rule comment.
  "period_label": "Modern",              // must be one of PERIODS[].id in config/regions.js
  "mapCenter": [40.4, -3.7],             // lat/lng — center the map on the entity's heartland/capital
  "mapZoom": 6,                          // 5 for multi-city kingdoms, 6 for a single country, adjust
                                          // for scale — check a sibling folio at similar scope
  "categories": [...],                   // see structure below — entries are NESTED here, never
                                          // at the top level
  "timeline": [...]                      // array of lane objects, see Step 3 below
}
```

There is no `schema_version`, `domain`, or `methodology` field — those are sci-map-specific and were
deliberately not ported (schema_version would require retrofitting 26 existing folios for no current
benefit; domain doesn't apply to a region×time atlas; methodology's boilerplate role is served by
this file instead).

### `mapCenter` for `region`, at any TAXONOMY tier

Unlike sci-map's flat `domain` enum, `region` can legitimately be a zone, sub-region, or top-level
region id — see `config/regions.js`'s placement-rule comment for the exact convention. Pick the
tightest tier that actually contains the entity's core; use a broader tier only when the entity
genuinely spans multiple sub-regions with no single core (Roman Empire, Byzantine Empire).

### `mapCenter` derivation when a folio covers multiple named locations

Use the entity's capital/heartland, not an arithmetic average of every entry's `coords` — several
entries in any folio point at where a source document now sits in a museum, or where a diplomatic
exchange happened abroad, which would skew a naive average away from the actual territory. If in
doubt, find the modal (most frequently repeated) coordinate among entries — it's almost always the
capital.

---

## `categories` array — 11 canonical categories, always in this order

```
⚜️ power → ⚔️ conflict → ⚖️ order → 🙏 belief → ✨ expression → 💡 thought
→ 💰 economy → ⚙️ technology → 🌐 exchange → 🌍 world → 🪞 lives
```

This is a different spine from sci-map's 8 (theory/study/effect/concept/method/figure/debate/
application) — hist-map's categories are dimensions of a society (power, belief, economy...), not
stages of a scientific claim's lifecycle. Do not force sci-map's category names onto history content.

A legacy `subsistence` category id (superseded by `economy`) used to exist in 5 France folios,
contradicting GROUPING_GUIDE.md's Structural Invariants §4 — migrated 2026-07-08. `schema.json` and
`validate.js` no longer recognize `subsistence` at all; it's a hard error now, not a warning.

```jsonc
"categories": [
  {
    "id": "power",
    "label": "Power",
    "icon": "⚜️",                          // overridden centrally by CAT_ICONS in config/style.js —
                                            // the per-entry value here is a fallback, keep it anyway
    "color": "#1A3A5C", "accent": "#2471A3", "bg": "#F0F7FF",
    "subtitle": "Constitutional monarchy — from La Transición to today",  // folio-specific, one line
    "entries": [ /* ... */ ]
  },
  // ... all 11 categories, in canonical order, every folio — even if a category has very few
  // entries for this particular topic, include it with whatever genuinely belongs there
]
```

### `color` / `accent` / `bg` are per-folio, not a fixed global palette

Unlike sci-map (where the 8 categories' colors are identical across every folio, copied verbatim
from FIELD_GUIDE.md), hist-map lets each folio pick its own thematic palette per category — e.g.
Spain 1975–today's Power category is blue-toned (`#1A3A5C`/`#2471A3`), while Al-Andalus 1031–1492's
Power category is green-toned (`#0A2A0A`/`#1A5C1A`), evoking each civilization's own visual
identity. When starting a new folio, look at 1–2 sibling folios from a related civilization/era for
palette inspiration, but feel free to pick a fresh thematic palette rather than copying one verbatim
— `accent` is what actually renders (the modal border, the tag badge, entry highlighting), pick
something that reads clearly against `#f4f1eb` (the app's cream background).

---

## Entry schema

```jsonc
{
  "id": "k1",                          // unique within the folio — see id conventions below
  "group": "Constitutional Monarchy",  // field-specific subtopic; see GROUPING_GUIDE.md for the
                                        // taxonomy per category — this is NOT free text
  "dynasty": "Bourbon",                // OPTIONAL — ruling house / party / faction. Populate this
                                        // on every Power-category entry about an individual; it's
                                        // what disambiguates same-named rulers across folios (see
                                        // §dynasty below) — an entry without it can't be safely
                                        // cross-linked to a same-named figure elsewhere
  "label": "Juan Carlos I — architect of the Transition",
  "date": "1975–2014",                 // free text; see §date formats below
  "loc": "Madrid (Zarzuela Palace)",
  "coords": [40.47, -3.78],            // REQUIRED [lat, lng] — no null, unlike sci-map
  "hint": "2–4 sentences, plain language, states the specific claim and why it matters.",
  "tag": "SUCCESSION",                 // free-form category-of-event label, see §tag below
  "note": "Full citation(s) + primary source(s). See the evidence principle above.",
  "keywords": ["Bourbon", "Juan Carlos I", "Madrid Zarzuela Palace"],  // AUTO-GENERATED, see CLAUDE.md
  "xlinks": ["spain-1900-1975::k1"]    // OPTIONAL — cross-folio refs, added via the reviewed
                                        // propose/apply pipeline, see CLAUDE.md
}
```

There is no `repl` field (replicability doesn't apply to historical events) and no same-folio
`links` field (hist-map never built that — only cross-folio `xlinks`).

### `id` — no enforced prefix-per-category convention

Unlike sci-map's strict `th`/`st`/`ef`/`co`/`me`/`fg`/`db`/`ap` prefix rule, hist-map ids have no
fixed prefix scheme — a scan of the actual corpus showed the `power` category alone uses `k`, `p`,
`w`, and `e` as prefixes interchangeably across different folios, reflecting organic authorship over
many sessions. **Don't invent a strict convention and enforce it retroactively** — `schema.json`
intentionally does not check id-prefix-to-category correspondence. Do keep ids short, and unique
within the folio; a loose convention like `k` for a Power/ruler entry, `c` for Conflict is fine but
not required.

### `dynasty` — populate for disambiguation, not just flavor

`dynasty` is used more loosely than the name suggests — it can be a royal house (`"Bourbon"`,
`"Trastámara"`), a political party (`"PSOE"`, `"PP"`), or a broader affiliation
(`"Nationalist"`, `"Francoist"`). What matters is that **the same individual gets the same dynasty
string every time they appear**, even across different folios or different facets of their career —
the xlink pipeline uses dynasty-mismatch as its strongest signal that two same-named entries are
different people, and dynasty-*inconsistency* on the *same* person is exactly what generates a false
"different person" rejection (see `dynasty_alignment_proposals` in CLAUDE.md). If you're writing two
entries about the same person from different angles (e.g. one about their reign, one about a
specific decree they issued), use the identical dynasty string on both.

### `date` — free text, several formats coexist

Unlike sci-map's cleaner "year(s)" convention, the corpus mixes: `"1975–2014"`, `"c.420–453"`,
`"9 BC–40 AD"`, `"22 Nov 1975"`, `"c.260–500"` (a multi-century institutional span, not a single
event's date). The xlink pipeline's date parser (`parseYearRange` in `build-xlink-candidates.js`)
handles all of these reasonably, but a very wide span (a "how long this institution operated" style
date) will make that entry look plausible-date-adjacent to almost anything in the same window —
prefer a **specific year or short range** for anything that describes a discrete event; reserve wide
century-spanning dates for entries that are genuinely about an era or institution's whole lifespan,
not a compressed shorthand for "sometime in this period."

### `tag` — free-form, not a closed vocabulary

Unlike sci-map's soft `KNOWN_TAGS` set, hist-map has no tag vocabulary check at all — tags are purely
descriptive and drive no styling (the badge/border color comes from the entry's category `accent`,
not the tag; `TAG_COLORS` was removed, see CLAUDE.md/memory). Reusing an existing tag where it
genuinely fits helps a reader scanning across entries; inventing a new one when nothing fits is
completely fine. Most-used tags in the corpus today, for reference — not a checklist:

| Tag | Roughly | Tag | Roughly |
|---|---|---|---|
| `SUCCESSION` | ruler/office change | `LAW` | legal codes/statutes |
| `BATTLE` | armed conflict | `MONUMENT` | standing structure |
| `TEXT` | a literary/scholarly work | `LITERATURE` | poetry, prose as art |
| `EVIDENCE` | direct evidence of a life/practice | `COUP` | extra-legal power seizure |
| `EVENT` | general occurrence | `OBJECT` | artifact, not a document |
| `ECONOMIC` | market/material development | `CATEGORICAL SHIFT` | new classification emerges |
| `DOCUMENT` | a specific written source | `CONSTRUCTION` | building project |
| `CIVIL WAR` | internal armed conflict | `EDICT` | ruler's formal decree |

### `coords` — required, no null

Every entry needs a real `[lat, lng]`. For entries about texts/objects now held in a museum or
archive, point at the museum (that's a legitimate anchor — "Found: X · Now: Y" is a common `loc`
convention for this), not the historical event location, if the event location is unknown or
irrelevant to what the entry documents.

### `keywords` — auto-generated, see CLAUDE.md

Do not hand-write these. Run `node modules/build-keywords.js` after entries are written; it extracts
proper-noun phrases (names, places, dynasties) from `dynasty`/`loc`/`label`/`hint`, deliberately
excluding `note` (citation apparatus — historians' names would pollute cross-folio matching) and
excluding generic terms (nationality demonyms, institutional nouns, catalog-metadata words like
"Found"/"Now"). If a specific entry gets a bad keyword, the fix belongs in the shared extractor
(`extractPhrases()` in `build-keywords.js`), not a hand-edit of that one entry's array — two
significant extraction bugs (an Arabic "al-" name prefix being silently dropped, a leading-word
trim occasionally erasing a whole phrase) were both found and fixed there rather than patched
per-entry.

### `xlinks` — added via the reviewed pipeline, see CLAUDE.md

Format: `["folioId::entryId"]`. Never hand-author speculatively — always run
`build-xlink-candidates.js`, review the output (including the built-in dynasty/date sanity checks,
which still miss real errors sometimes — see CLAUDE.md), and apply via `apply-xlinks.js`.

---

## Timeline

`timeline` is an array of lane objects, one per category with entries that have meaningful dates
(the `power` category typically gets split into multiple named lanes — one per dynasty/reign-cluster
— rather than a single generic "power" lane; see GROUPING_GUIDE.md's Structural Invariants §2 for
the exact convention and lane ordering).

```jsonc
{
  "id": "bourbon-kings",
  "icon": "⚜️",
  "accent": "#3A1A8B",
  "label": "Bourbon Restoration",
  "events": [
    { "y": 1975, "y2": 2014, "l": "Juan Carlos I (1975–2014)", "entryId": "k1" },
    { "y": 2014, "l": "Felipe VI accedes", "entryId": "k2" }
  ]
}
```

- `y2` is a span end year — set it **only** on dynasty/ruler and executive (e.g. prime-minister)
  lanes, where duration is itself meaningful data. Every other lane uses point events (dots), even
  for something ongoing — see GROUPING_GUIDE.md Structural Invariants §5 for the full reasoning.
- `entryId` must resolve to a real entry id in the same folio — `validate.js` checks this.
- Sort events within a lane ascending by year (§3 of the Structural Invariants covers the one
  exception — the power category sorts by group first, then date).

---

## Validation checklist before committing

```
node modules/validate.js
```
Must show **0 errors**. It checks: required fields present, `region`/`period_label` resolve against
`config/regions.js`, category ids are from the canonical 11, `coords` in range, duplicate entry ids,
timeline `entryId` resolution, `xlinks` format and resolution, and (informational only) unmapped
categories missing an icon override.

After any entry/keyword/xlink change:
```
node modules/build-global-index.js
```
CI fails if the committed `_global_index.json` doesn't match a fresh rebuild — always commit it
alongside content changes, same as sci-map's workflow.

**Before considering a folio done:**
- [ ] `node modules/validate.js` shows 0 errors?
- [ ] All 11 categories present in canonical order?
- [ ] Every entry has `coords` (no null)?
- [ ] Every Power-category entry about an individual has `dynasty`, and the SAME string is used
      everywhere that person appears (see §dynasty above)?
- [ ] `node modules/build-keywords.js` run (not hand-authored)?
- [ ] Timeline lanes present, ordered per GROUPING_GUIDE.md §2, `y2` only on ruler/executive lanes?
- [ ] `node modules/build-global-index.js` run and the result committed?
- [ ] Xlink candidates reviewed (build-xlink-candidates.js -> human review -> apply-xlinks.js), or
      explicitly skipped if nothing confident was found?
