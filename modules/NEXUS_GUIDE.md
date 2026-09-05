# Hist-Map — Nexus (Causal Web) Guide

A Nexus is a hand-curated, optional, per-folio visualization: every entry in a folio (plus named
forces outside it) laid out as one connected causal story instead of a flat list. It answers a
different question than List/Timeline/Map do — not "what happened and when" but "what caused what."
This file is the schema + methodology truth for building one, the same way FIELD_GUIDE.md is the
schema truth and GROUPING_GUIDE.md is the taxonomy truth for folios generally. Read this file in
full before building a Nexus for any folio — do not infer the format from `mamluks-1250-1517.nexus.json`
alone; a few of its choices are explained only here.

A Nexus is **not** part of the required folio-creation workflow (see `.claude/commands/new-folio.md`
step 9) — most folios will never get one. Build one only when asked, or when a folio's own entries
turn out to have unusually dense, explicitly-stated causal chains worth surfacing (a long-running
dynasty's chain of successions and shocks is a good candidate; a folio that's mostly independent
parallel developments with little cross-causation is not).

---

## What a Nexus is, precisely

A directed graph of a folio's own entries (`nodes`), connected by causal edges (`edges`) the folio's
own `hint`/`note` text already states or strongly implies, rendered as a multi-lane timeline: one
lane per hist-map category (in the folio's own canonical order) plus one extra "external forces"
lane for named outside events that are not folio entries but that the folio's causation depends on
(a Mongol sack, a plague wave, a rival empire's internal war). Time runs left-to-right by year within
every lane; causal edges are curves that can run vertically between lanes as well as horizontally
within one.

Two more things distinguish a Nexus from a generic "everything connects to everything" diagram, and
both are load-bearing:

1. **A critical path.** Within the web, identify the one connected chain that has *no slack* — where
   removing any single link breaks the causal chain that follows it (see "Critical path" below for
   the exact test). Not every folio has a clean single chain; the Mamluk one does (a chain from the
   Mongol destruction of Baghdad through to Ottoman conquest), because it's a single continuous state
   with one central seat of power. A folio built around several parallel, non-interacting polities
   may not have one clean chain — say so rather than forcing one.
2. **Honest orphans.** If an entry's `hint`/`note` gives no causal link to anything else in the
   folio, it is rendered disconnected (dashed border, no edges) rather than force-connected to
   something nearby in time. The Mamluk Nexus has one (`tc4`, block-printed amulets — a real
   technology with no stated causal tie to anything else in the corpus). A Nexus with zero orphans
   across ~90 entries should read as suspicious, not as a job well done — it likely means edges were
   invented to avoid loose ends.

The governing rule for the whole exercise: **every edge must be traceable to something the folio's
own `hint` or `note` field already says, or to well-established background history you can cite**
(a named book/article, or "background — see the X folio"). Never invent a causal link because two
entries are merely close in time or same-lane. If two entries are related only by theme or
institution rather than stated causation, that's what the `loose` tier is for (see below) — it is
not a license to skip the sourcing requirement, just a weaker causal claim.

---

## The `modules/<id>.nexus.json` sidecar file

A Nexus is **not** stored in the folio's own JSON file. It's a separate sidecar,
`modules/<folioId>.nexus.json`, named to match the folio file exactly (`mamluks-1250-1517.json` →
`mamluks-1250-1517.nexus.json`). This keeps the causal reading — which is editorial interpretation,
reviewed and re-reviewed — cleanly separate from the folio's own factual entries, and means
`index.html` needs zero changes to support a new folio's Nexus: it probes for the sidecar file at
load time and only shows the tab if the probe succeeds (see "How index.html finds and renders a
Nexus" below). **No registration in `config/registry.js` and no `validate.js` schema entry are
needed** — the sidecar is fetched directly by filename convention, not looked up through any config.

### Top-level shape

```jsonc
{
  "nodes": [ /* every folio entry that appears in the web, plus external-force nodes */ ],
  "edges": [ /* directed causal links, as 4-tuples */ ],
  "criticalPath": [ /* edge keys with no slack, as "from>to" strings */ ]
}
```

### `nodes[]`

```jsonc
{
  "id": "k3",                 // for a real folio entry: MUST equal that entry's own "id" in the
                               // folio JSON (not a new id) — this is what makes the Nexus a reading
                               // OF the folio rather than a parallel dataset
  "lane": "power",             // one of the folio's own category ids, OR "external"
  "year": 1260,                 // integer; used only for x-axis placement, not shown beyond the node
  "label": "Baybars founds the state",   // short — rendered truncated at ~13 characters in the node
                                          // box, so front-load the identifying word(s)
  "full": "Baybars built the institution: installed a refugee Abbasid as caliph for legitimacy, ...",
                               // 1-4 sentences, the popup body — can lift straight from the entry's
                               // own `hint`, expanded with the specific causal detail
  "src": "Ibn Abd al-Zahir (panegyric); Thorau (1987)",   // short citation, shown in the popup footer
  "external": true             // ONLY on external-force nodes — omit entirely for real folio entries
}
```

Node ids for real entries must exactly match the folio's own entry ids so a future reader (or a
future automated cross-check) can always resolve `nodes[].id` back to `modules/<id>.json`'s own
`categories[].entries[].id`. External-force nodes get their own short id namespace not used by the
folio (the Mamluk file uses `ext1`..`ext8`) — pick something similarly unambiguous, never an id that
could collide with a real entry id.

**Not every folio entry needs a node.** For a very large folio, or one where whole categories are
thematic surveys with no internal causal chain (Lives, Expression entries especially, per the corpus
so far), it is fine to include only the entries that actually participate in causal chains and leave
the rest out of the Nexus entirely — they still exist in List/Timeline/Map, just not in this view.
Do not pad the node list to "cover" a category if that category's entries have no real causal role.

### `edges[]` — 4-tuples, not objects

```jsonc
["ext1", "c1", "strong", "the Mongol push into Syria provokes the showdown at Ayn Jalut"]
// [ from, to, tier, why ]
```

- **`from`/`to`** — node ids, matching `nodes[].id` exactly (real entry id or external-force id).
  Direction matters: `from` is the cause, `to` is the effect.
- **`tier`** — exactly `"strong"` or `"loose"` (see "Edge confidence tiers" below).
- **`why`** — a short causal clause, generally lifted or lightly paraphrased from the folio's own
  `hint`/`note` text, or a direct quote (in quotation marks, as the Mamluk file does in several
  places) when the source phrasing states the causation more precisely than a paraphrase would. This
  is what a reader sees under "caused by" / "leads to" in the node popup — it must justify the edge
  on its own, since it's the only evidence a reader gets for why the arrow exists.

An edge is a single causal claim in one direction. If two entries genuinely caused each other in
different ways at different points (e.g. `k6`/`k7` in the Mamluk file — al-Nasir Muhammad's
deposition opens the strongmen interregnum, and separately the interregnum's end restores him) that
is two edges, `k6→k7` and `k7→k6`, each with its own `why` — not one bidirectional edge. There is no
special bidirectional-edge syntax; just add both directed edges.

### `criticalPath[]` — edge keys, not node ids

```jsonc
"criticalPath": ["ext1>c1", "c1>k2", "k2>k3", ...]
```

Each entry is `"${from}>${to}"` for one specific edge already present in `edges[]` (the app looks
this set up as `new Set(NEXUS_DATA.criticalPath)` and matches it against each rendered edge's own
`from+'>'+to`). It is a **set of edges**, not a path object — order in the array doesn't matter to
the renderer, though writing it in causal sequence (as the Mamluk file does) makes the source file
itself readable as a one-paragraph narrative of the whole folio.

---

## Analytical methodology — how to actually build one

This is the part that matters most and is easiest to get wrong under time pressure: producing a
graph that *looks* rigorous by construction, rather than one that *is*.

### Step 1 — Read every entry's `hint` and `note`, extracting stated causation only

Go through the folio's entries (all of them, not a sample) and note, for each one, any language that
states or clearly implies a causal relationship to another entry or to outside history — "X's death
opened the way for Y," "in reprisal for," "forced by," "this is why," "the same event as," "pressed
by X, the government issued Y." al-Maqrizi/Ibn Iyas/Ibn Taghribirdi-style chronicle sources are
usually explicit about proximate causation (who killed whom, what provoked what campaign); modern
academic syntheses cited in `note` are often explicit about structural causation (a monopoly policy's
effect on a merchant class, a plague's effect on an irrigation-dependent state). Both count as
"stated in the folio," because both come from the entry's own text — you're reading the folio's
claims, not adding new ones from general knowledge, at this step.

### Step 2 — Identify named external forces

Look specifically for the folio's own text naming (or clearly gesturing at) an outside force it does
not itself narrate as an entry: a foreign power whose actions the folio's entries respond to but
whose own history belongs to a different folio (in the Mamluk case, the Mongol Ilkhanate, the Golden
Horde, Timur, the Black Death's pandemic wave, the Ottoman state, Portugal). These become
`external:true` nodes. It is legitimate to add a handful of external nodes that are *not* explicitly
named in any single entry's text but are well-documented background history that the folio's own
causal chain silently depends on — the Mamluk file does this for `ext7` (Constantinople's fall) and
`ext8` (Chaldiran), both flagged in their own `src` field as "added on review — absent from the
folio's 89 entries" so a reader can tell folio-sourced nodes from editorially-added background at a
glance. **Always flag this distinction in the node's own `src` string** — never silently blend
folio-internal and editorially-added material without a marker.

### Step 3 — Draft edges, tier each one honestly

For each causal relationship found in Steps 1-2, write the edge and immediately decide its tier:

- **`strong`** — the folio's own `hint`/`note` (or a named external event) states this causation
  directly. "Baybars is acclaimed sultan on the march home [after assassinating Qutuz]" is strong
  because the entry's own text says the assassination happened on that march. A shared, single
  historical event described from two entries' perspectives (e.g. `k5`→`c4`, "the same event — Khalil
  storms Acre") is also strong.
- **`loose`** — the connection is real but is thematic/institutional rather than a stated causal
  chain: two entries belong to the same endowment culture, the same barracks system, the same
  scholarly milieu, without one text asserting that one produced the other. `b1`→`b5` ("the same
  institutional flourishing produces the age of hadith scholarship") is loose for exactly this
  reason. Loose edges are rendered dashed and thinner, and are excluded from the critical path by
  construction (a "no slack" chain cannot rest on a merely-thematic link).

Do **not** default to `strong` to make the graph look more rigorous — the tier distinction is the
mechanism that keeps the graph honest, and a Nexus with mostly-strong tiers on a folio full of
parallel independent developments should be treated as a red flag during review, not a good sign.

### Step 4 — Find the critical path

Trace the single chain, if one exists, where every link is `strong` and where removing any one link
would sever the chain that follows from it — i.e., no alternate route in the graph reaches the same
downstream nodes if that specific edge is cut. In a folio built around one continuous seat of power
(a dynasty, a single state), this is usually the backbone succession-and-shock chain: each ruler's
accession causally required by the previous node's incident, punctuated by external shocks
(`ext2`→`w4`, the Black Death; `ext3`→`c7`, Timur) that redirect the chain rather than branching it.
If the folio genuinely has two or more independent centers of causation that never causally
intersect, there may be no single critical path — do not force two unrelated success chains into one
`criticalPath` array by inserting a manufactured link between them. It's fine, and more honest, to
either omit `criticalPath` (empty array) or describe two shorter critical paths in the surrounding
prose/intro text and put only the stronger of the two in the actual array.

### Step 5 — Review pass, looking specifically for these failure modes

- An edge whose `why` doesn't actually name a mechanism ("related to," "connects to") — rewrite it to
  state the specific causal claim, or drop the edge.
- A `strong` edge that's actually just topical similarity — retier to `loose` or drop.
- A node with no edges at all that isn't marked as an intentional orphan in your own head — either
  find its real connection or accept it as an orphan; don't force a spurious edge just to avoid one.
- A critical path that skips a step it depends on, or that includes a `loose`-tier edge.
- External nodes not clearly marked as folio-sourced vs. editorially-added in `src`.

---

## How `index.html` finds and renders a Nexus — zero app changes needed per folio

This mechanism was built generically; you do **not** need to touch `index.html` when adding a Nexus
to another folio. This section documents how it works so a future session can verify it's still true
and debug it if something regresses, not as a to-do list.

- `loadModule()` fetches the folio JSON as usual, then separately probe-fetches
  `modules/<id>.nexus.json` (same base filename). A 404 is the expected, silent case for the large
  majority of folios — `NEXUS_DATA` stays `null` and the `#btn-nexus` tab button stays hidden
  (`display:none`). A 200 sets `NEXUS_DATA` to the parsed sidecar and reveals the tab button.
- The Nexus tab is the 4th tab, alongside List/Timeline/Map, added to `_HASH_VIEWS` so it's
  deep-linkable as `#<folioId>/nexus`; `setView('nexus')` silently falls back to `'list'` if
  `NEXUS_DATA` is null (e.g. a stale deep link into a folio that had its Nexus removed).
  `buildNexus()` only runs once per folio load (`NEXUS_BUILT_FOR` guards against rebuilding every
  time the user switches tabs back to Nexus).
- **Lane colors and labels are never hardcoded** — `buildNexus()` builds its lane list from
  `MOD.categories` live (`catAccent(c)`), plus one hardcoded "External forces" lane. This means a
  Nexus file only needs to use the folio's own category ids as `lane` values; it automatically
  matches that folio's own category order, labels, and accent colors with no per-folio styling code.
- **Width is computed dynamically from the actual rendered stage element**
  (`stageEl.clientWidth`), not a fixed pixel budget, specifically so the diagram never needs a
  horizontal scrollbar regardless of a folio's entry count or the reader's window width — see the
  buffer/floor constants (`stageEl.clientWidth - 16`, floor `1.6` px/year) in `buildNexus()` in
  `index.html` if a future folio's Nexus still overflows; these were tuned once against the Mamluk
  file's ~500-year, 97-node span and may need retuning for a very different scale (a folio spanning
  many millennia, or one with a much denser node count in a single lane).
- **Node detail is a floating popup (`#nx-popup`), never a reserved layout column.** This was a
  deliberate correction after an earlier version used a sticky sidebar that permanently ate into the
  diagram's width — see the CSS comment directly above `#nx-popup`'s rule in `index.html`. Any future
  Nexus UI work should preserve this: the popup must float over the diagram (`position:fixed`), never
  claim space that shrinks the SVG.
- Clicking a node highlights it plus its direct causal neighbors (dims everything else), opens the
  popup with the node's `full`/`src` text and clickable "caused by"/"leads to" links (which jump the
  popup to that neighboring node without closing it); clicking empty diagram space, or the popup's own
  close button, resets to the default view. A "Show every connection" toggle (`#nx-toggle-all`) lets a
  reader see every edge at once at reduced opacity instead of only the critical path standing out by
  default.

If you need to change any of this behavior for a specific folio, that's a sign the generic mechanism
needs to change (edit `buildNexus()` in `index.html`, which every folio's Nexus shares), not that the
sidecar format should grow a per-folio escape hatch — keep the sidecar schema uniform across folios.

---

## Building a Nexus for a new folio — checklist

1. Read every entry's `hint` and `note` in the target folio; list stated causal relationships
   (Step 1 above) and named external forces (Step 2).
2. Draft `nodes[]` — real entries by their existing `id`, plus external nodes with a distinct id
   prefix and `external:true`. Skip entries with no causal role rather than padding.
3. Draft `edges[]`, tiering each `strong`/`loose` honestly (Step 3), sourcing every `why` back to the
   folio's own text or a cited external fact.
4. Trace the `criticalPath[]`, or consciously decide the folio doesn't have one clean chain and say so.
5. Review pass against the failure-mode list above.
6. Save as `modules/<folioId>.nexus.json` — no registry entry, no `validate.js` changes, nothing else
   to wire up. Reload the app on that folio and confirm the 🕸 Nexus tab appears.
7. Sanity-check in the browser: every lane's nodes plotted in year order, the critical path visibly
   gold, at least skim a few node popups for their "caused by"/"leads to" text reading correctly, and
   confirm the diagram doesn't need a horizontal scrollbar at a normal window width.

There is no `validate.js` check for `.nexus.json` files today — correctness here is editorial review,
not schema validation. If this capability gets rolled out across many folios, a lightweight validator
(node ids resolve to real folio entries or external ids, edge endpoints exist, criticalPath entries
match real edges) would be a reasonable future addition to `modules/validate.js`, but building that is
a separate task from building any individual Nexus file.

---

## Worked example

`modules/mamluks-1250-1517.nexus.json` (97 nodes: 89 folio entries + 8 external-force nodes, 110
edges, 29-edge critical path, 1 honest orphan) is the model instance — read it alongside this guide
the first time you build a new one. Its critical path runs, in outline: the Mongol sack of Baghdad →
Ayn Jalut → the Baybars/Qalawun/Khalil succession chain → the long al-Nasir Muhammad era → the Black
Death → the strongmen decades → Barquq's Circassian regime (redirected by the Golden Horde's collapse
under Timur) → Timur's invasion of Syria → the 15th-century sultans → the Ottoman gunpowder buildup
and the Portuguese Cape route converging on → Marj Dabiq → the fall of Cairo. That one paragraph is
what a critical path is *for*: a single connected story a reader can hold in their head, with every
link in it independently checkable against the `why` text and the folio's own sources.
