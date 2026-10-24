# OVERVIEW_GUIDE — the folio's editorial companion

An **Overview** is a short, hand-written, big-picture reading of one folio. It is the first tab and the
default view when it exists. Its job is to *re-focus on the subject* after the reader has been swamped by
50–60 entries: what question does this folio answer, what changed, what are the threads, which entries
carry the story, and how far can the sources be trusted.

It is **editorial, not evidence**. It never introduces a fact that is not in an entry. Every claim points
back to entries with `[[entryId]]` markers, and `modules/validate.js` fails if a marker names an entry that
does not exist — so the Overview cannot drift from the folio.

Optional per folio. Required for the subject-folio programs (Sugar, Fats & Oils, …) where breadth is
overwhelming; skip it for ordinary one-polity folios.

## File

`modules/<folioId>.overview.json` — a sidecar, probed by `loadModule` (404 = no Overview tab), exactly like
`.nexus.json`. Excluded from the folio list/index/keyword scripts.

## Format

```json
{
  "question": "One sentence, the folio's question, ending in ?",
  "summary": ["Paragraph 1 — the shift in a nutshell.", "Paragraph 2.", "Paragraph 3 (optional)."],
  "themes": [
    { "title": "Short thread title",
      "text": ["One paragraph. May cite an entry inline [[x1]]."],
      "entries": ["x1", "ec3", "w2"] }
  ],
  "turning_points": [
    { "date": "1493", "text": "One sentence, what changed and why it matters.", "entry": "x10" }
  ],
  "regions": [
    { "region": "Africa",
      "text": ["What the folio holds for this region, or — if nothing — why (no source in the library, not that nothing happened)."],
      "entries": ["ec4", "x2"] }
  ],
  "how_to_read": "Which categories/groups to start from, what the folio deliberately leaves out, what the Nexus shows.",
  "sources": {
    "intro": "One paragraph: what kind of evidence this period allows.",
    "main": ["Works that carry the folio, and for which entries"],
    "contested": ["Claims/entries that are contested, thin or legendary, and why"],
    "gaps": ["What is missing and which source would fill it"]
  },
  "reviewed": "2026-10-24"
}
```

`regions` (optional, **required for the Fats & Oils program**) is the geographic reading: one block per atlas
region, in this order — `Europe`, `Near East`, `Far East`, `Africa`, `Americas`, `Oceania`, then `Worldwide` for
entries with no single place (a convention, an international body, a climate baseline). Egypt is filed under the
Near East, as in the atlas taxonomy (`config/regions.js`); say so in the Africa block when the Nile matters. Every
entry sits in exactly one region; `validate.js` errors on duplicates and warns on entries left out. A region with
no entries stays in the list with `"entries": []` and a `text` that says plainly **why it is empty** — the sources
held, or a named work that would fill it — so a gap on the map is never mistaken for an absence in history.
Rendered as a coloured proportion bar plus one card per region.

Markup in any text field: `[[id]]` → clickable chip that opens the entry; `*x*` → emphasis. No HTML.

## Rules

1. **Length:** about 400–700 words of prose in total (summary + themes + turning points). Dense, not long.
2. **Summary:** 2–3 paragraphs. Lead with the *shift* (what was true at the start vs the end), not a list of
   events. Name the subject (e.g. sugar) in every paragraph — the point is to re-anchor the reader.
3. **Themes:** 3–4. Each is a thread running through the folio (e.g. *technology*, *who bore the cost*,
   *where the crop moved*), not a category label. 2–6 `entries` each — the best entries to open to see the thread.
4. **Turning points:** 5–8, chronological, each one sentence, each with an `entry` where one exists.
   Date text must follow the folio conventions (BC marked "BC", no ordinals).
5. **No new facts.** If it is not in an entry note/hint, it does not go in the Overview. Numbers and dates must
   match the entry they point to.
6. **Carry the evidence tiers through.** If the thread rests on CONTESTED/LEGEND/UNVERIFIED entries, say so in
   the text, not only in the sources section.
7. **Sources section — be frank.** `main`: which works carry which stretches of the folio (and how many
   entries lean on them); `contested`: the entries that should be read with suspicion and why; `gaps`: what
   was not read or not available, and what would help (a named work where possible). Do not list works that
   were not actually used.
8. **Regions:** state the real balance, not a flattering one. If one region carries most of the entries, say so
   in its block and name what the others lack. Never write a region's text so as to imply that an empty region
   had no fats history.
9. **How to read:** practical orientation — which view to open first, what the colours/groups give, what the
   folio omits on purpose, and the neighbouring folios (the Continue links are automatic).
10. **No pronoun guessing, no ordinals, no gap labels** — same editorial rules as the folio.
11. Set `reviewed` to the date of the last full read-through against the entries.

## Workflow

1. Dump the folio's ids/dates/labels (`node -e` over `categories[].entries[]`) so every marker is real.
2. Draft the Overview; run `node modules/validate.js` (Pass 3b checks references and required fields).
3. Open `#<folioId>` in the preview: the Overview must be the default tab, chips must open entries,
   `#<folioId>/overview` and `#<folioId>/list` must both route.
4. Commit with the folio (it is not part of the global index; no regeneration needed).
