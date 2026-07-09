You are about to author a new hist-map folio. Before writing a single line of JSON, read both
authoritative references:

```
modules/FIELD_GUIDE.md       ← schema: entry/folio fields, dynasty, keywords, xlinks, validation
modules/GROUPING_GUIDE.md    ← taxonomy: what group per category, terminology, historiographic rules
```

Do not infer the schema or taxonomy from existing JSON files — some are older than the current
conventions (see FIELD_GUIDE.md's note on the 5 legacy `subsistence` folios). The two guide files are
canonical; where a JSON file disagrees with them, the JSON file is wrong, not the guide.

---

## Workflow

Work through these steps in order. **Each step that produces output ends with a git commit** — this
ensures work survives a context-limit interruption. If resuming after an interruption, read the
partial `modules/<id>.json` to see which categories are already written, then continue from the
appropriate batch (see "Resuming" at the bottom).

> **Why granular batches?** A full folio can run 700+ lines of JSON across 11 categories. Splitting
> into 6 focused batches means a context-limit interruption loses at most one batch, not the entire
> folio. Each commit is a durable checkpoint — this is the same discipline sci-map's authoring
> workflow uses, applied to hist-map's own category structure below (not sci-map's 8 categories).

---

### Step 1 — Confirm the folio identity

Decide (or confirm with the user):
- `id` — kebab-case, `<entity>-<startyear>-<endyear>` convention (e.g. `visigoths-589-711`)
- `title` / `subtitle` — see sibling folios in `config/registry.js` for the house style (title is
  the polity name, subtitle is a short "X, Y & Z" or "X to Y" descriptor)
- `region` — a zone, sub-region, or top-level id from `config/regions.js`'s `TAXONOMY` (see
  FIELD_GUIDE.md's region section for the placement rule)
- `period_label` — one of `config/regions.js`'s `PERIODS` ids

Check `config/registry.js`'s `MODULES` array to confirm this `id` doesn't already exist.

---

### Step 2 — Propose groups (STOP — wait for user confirmation)

Using `GROUPING_GUIDE.md`'s per-category taxonomies, propose the `group` values this folio will use:
- **Power**: empire/kingdom subdivisions (e.g. "Constitutional Monarchy", "Governments (Prime
  Ministers)") — not a taxonomy table, this one is folio-specific by design
- **Conflict** through **Lives**: pick from GROUPING_GUIDE.md's tables, adding context-specific
  named-war/named-tradition groups where the period has one (e.g. "First Crusade" beats generic
  "Named War" if that's literally what this folio covers)
- If this is a Modern-period folio (`period_label: "Modern"`), read GROUPING_GUIDE.md's "Modern
  Period Folios" section now — evidence anchoring, Power's two-lane convention, and sensitivity
  rules all differ from ancient/medieval folios

Output the proposed group list per category and **wait for user approval before writing any
entries.**

---

### Step 3 — Plan entry counts (STOP — wait for user confirmation)

Unlike sci-map, hist-map has no fixed per-category target range — folio scope varies enormously (a
6-year folio like Spain's Transition has far fewer Belief entries than a 300-year Roman folio).
Present a planned-count table calibrated against 1–2 sibling folios of similar scope/period, e.g.:

| Category | Sibling folio comparison | Planned |
|---|---|---|
| power | ~8–12 for a century-scale folio | ? |
| conflict | ... | ? |
| order | ... | ? |
| belief | ... | ? |
| expression | ... | ? |
| thought | ... | ? |
| economy | ... | ? |
| technology | ... | ? |
| exchange | ... | ? |
| world | ... | ? |
| lives | ... | ? |
| **Total** | | ? |

**Wait for user approval before writing entries.**

---

### Step 4 — Write entries in batches

Generate entries using Node.js scripts written to the scratchpad and run from the `hist-map/`
directory. Each batch script reads the current state of `modules/<id>.json` and fills in its
categories. Commit after every batch.

#### Batch A — Skeleton only

Script must write:
1. Top-level fields: `id`, `title`, `subtitle`, `period`, `region`, `period_label`, `mapCenter`,
   `mapZoom` (see FIELD_GUIDE.md for `mapCenter` derivation)
2. All **11** category stubs (canonical order — see FIELD_GUIDE.md; never `subsistence`) with
   correct `label`, `icon` (from `CAT_ICONS` in `config/style.js`), `color`/`accent` copied verbatim
   from `CAT_COLORS` in `config/style.js` (fixed globally — do not invent a per-folio palette, see
   FIELD_GUIDE.md), a one-line `subtitle`, and **empty** `entries: []`
3. Timeline stubs — lane objects per GROUPING_GUIDE.md Structural Invariants §2 (power split into
   named dynasty/executive lanes, the rest one lane per category with entries), each with **empty**
   `events: []`

Verify:
```
node -e "const d=require('./modules/<id>.json'); console.log('cats:', d.categories.map(c=>c.id)); console.log('timeline lanes:', d.timeline.map(l=>l.id))"
```

Commit:
```
git add modules/<id>.json
git commit -m "<id>: batch A — skeleton"
```

---

#### Batch B — power + conflict

Fill in all **power** entries (every individual ruler/head-of-government entry needs `dynasty` —
see FIELD_GUIDE.md's §dynasty on using the *same* string for the same person everywhere they
appear) and all **conflict** entries. Power entries about a named ruler must be dated to their
reign span and tagged `SUCCESSION`/`COUP`/`DEPOSED`/`APPOINTED`/`MARRIAGE` as fits — never dated to
a single achievement. Pick ruler-vs-cluster-vs-whole-regime granularity per folio density. See
GROUPING_GUIDE.md's `⚜️ Power` section for the full rule, the pre-state exception, and worked
examples.

Validate JSON syntax, then commit:
```
node -e "JSON.parse(require('fs').readFileSync('modules/<id>.json','utf8')); console.log('OK')"
git add modules/<id>.json
git commit -m "<id>: batch B — power + conflict"
```

---

#### Batch C — order + belief

Fill in all **order** and **belief** entries. Remember the Order/Economy distinguishing question
from GROUPING_GUIDE.md: did a government cause this? If yes, Order; if it emerged from
material/demographic/ecological forces, it belongs in Economy (Batch E), not here.

Validate JSON syntax, then commit:
```
git add modules/<id>.json
git commit -m "<id>: batch C — order + belief"
```

---

#### Batch D — expression + thought

Fill in all **expression** and **thought** entries. Check GROUPING_GUIDE.md's note on Music &
Performance — it's consistently underrepresented; actively look for evidence (instrument finds,
court musicians, depictions on dated art, theoretical treatises) rather than skipping it by default.

Validate JSON syntax, then commit:
```
git add modules/<id>.json
git commit -m "<id>: batch D — expression + thought"
```

---

#### Batch E — economy + technology + exchange

Fill in all **economy**, **technology**, and **exchange** entries. Exchange is specifically about
the *interface* between cultures (what crossed a boundary, how, what happened) — not internal
developments; see GROUPING_GUIDE.md's Economy vs Exchange distinction if an entry could plausibly go
in either.

Validate JSON syntax, then commit:
```
git add modules/<id>.json
git commit -m "<id>: batch E — economy + technology + exchange"
```

---

#### Batch F — world + lives + timeline

Fill in all **world** and **lives** entries (see GROUPING_GUIDE.md's methodological rules for Lives
— distinguish acts from identities, evidence from prescription, and flag anachronistic framing
explicitly rather than importing it uncritically). Then fill in all timeline lane events:

1. Every entry from every category with a meaningful date gets a timeline event in its lane
2. `y2` only on dynasty/ruler and executive-span lanes (GROUPING_GUIDE.md §5) — every other lane is
   dots only, even for something ongoing
3. Sort each lane's events ascending by `y` (power lane sorts by group first, then date — §3)
4. `entryId` must match a real entry id

Validate JSON syntax and timeline refs:
```
node -e "
const d=require('./modules/<id>.json');
const ids=new Set(d.categories.flatMap(c=>c.entries.map(e=>e.id)));
let errs=0;
d.timeline.forEach(l=>l.events.forEach(ev=>{
  if(!ids.has(ev.entryId)){console.log('BAD TIMELINE REF',l.id,ev.entryId);errs++;}
}));
console.log(errs?'ERRORS: '+errs:'All timeline refs OK');
"
```

Commit:
```
git add modules/<id>.json
git commit -m "<id>: batch F — world + lives + timeline"
```

---

### Step 5 — Full validation

```
node modules/validate.js
```
Must show **0 errors** before proceeding. Fix every issue — missing fields, out-of-range coords,
bad region/period_label, duplicate ids, broken timeline refs. If fixes change any entries, commit:
```
git add modules/<id>.json
git commit -m "<id>: validation fixes"
```

---

### Step 6 — Auto-generate keywords

```
node modules/build-keywords.js
```
Do not hand-author keywords — see FIELD_GUIDE.md. This is idempotent; safe to run even if some
entries somehow already have keywords (they'll be skipped). Spot-check a handful of entries for
quality (real names/places, not junk fragments) before committing — if the extractor produced
something clearly wrong, the fix belongs in `build-keywords.js`'s shared logic, not a hand-edit.

Commit:
```
git add modules/<id>.json
git commit -m "<id>: batch G — keywords"
```

---

### Step 7 — Register in `config/registry.js`, rebuild global index

Add the folio to `MODULES` (see Step 1 for the fields):
```js
{ id:"<id>", file:"modules/<id>.json", label:"<title>", sub:"<subtitle-ish, no years>", region:"<region>", period:"<period_label>" },
```

Then rebuild the cross-folio global index:
```
node modules/build-global-index.js
```
Verify the output shows the new folio listed and the total entry count increased.

Commit:
```
git add modules/<id>.json config/registry.js modules/_global_index.json
git commit -m "feat: <Title> folio complete"
git push
```

---

### Step 8 — Xlink wiring (semi-automated — propose, review, apply)

```
node modules/build-xlink-candidates.js
```
Writes `modules/_xlink_candidates.json`, including any `dynasty_alignment_proposals` (same person,
inconsistent dynasty label across entries — fix the source data if these appear involving this
folio's new entries, don't add an xlink).

**Review manually, with real scrutiny.** The dynasty and date-overlap checks catch a lot but not
everything — this pipeline has produced confident "high confidence" matches that turned out to
conflate two different historical people sharing a regnal name. Don't accept a match just because
the tooling produced it; verify the two entries are actually the same person, place, or event.

For confirmed matches, edit `apply-xlinks.js`'s `SELECTED_PAIRS` construction to scope to the pairs
you've reviewed (not "everything in the candidates file"), then:
```
node modules/apply-xlinks.js
node modules/build-global-index.js
```

Commit:
```
git add modules/<id>.json modules/_global_index.json
git commit -m "<id>: xlink wiring"
git push
```

If no confident xlinks are found, skip this step. Xlinks can always be added later — re-running
`build-xlink-candidates.js` after more folios exist will surface more candidates over time.

---

## Resuming after a context-limit interruption

1. Read `CLAUDE.md` (loaded automatically) — it points here and to the two guide files
2. Check git log to see which batch commits exist:
   ```
   git log --oneline -10
   ```
3. Count entries per category to confirm actual state:
   ```
   node -e "const d=require('./modules/<id>.json'); d.categories.forEach(c=>console.log(c.id, c.entries.length))"
   ```
4. Continue from the next incomplete batch

**Batch completion checklist:**

| Batch | Committed when | Signs of completion |
|---|---|---|
| A | Skeleton written | `categories.length === 11`, all `entries: []`, no `subsistence` |
| B | power + conflict | both categories non-empty; every power entry with an individual has `dynasty` |
| C | order + belief | both categories non-empty |
| D | expression + thought | both categories non-empty |
| E | economy + technology + exchange | all three non-empty |
| F | world + lives + timeline | both categories non-empty, `timeline` lanes have events |
| Step 5 | Validation passed | `node modules/validate.js` shows 0 errors |
| Step 6 | Keywords generated | Every entry has a `keywords` array |
| Step 7 | Registered + global index rebuilt | Folio listed in `config/registry.js` MODULES and in `_global_index.json` |
| Step 8 | Xlink wiring done (or explicitly skipped) | Reviewed matches applied via `apply-xlinks.js`, or none found |
