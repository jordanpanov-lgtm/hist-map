// ── ICON MAP: override per category id ───────────────────────────────────────
// These replace whatever icon is in the JSON with a consistent emoji set.
// A category id with no override here falls back to its own `icon` field (see catIcon()).
const CAT_ICONS = {
  power:       "⚜️",
  conflict:    "⚔️",
  order:       "⚖️",
  belief:      "🙏",
  expression:  "✨",
  thought:     "💡",
  economy:     "💰",
  technology:  "⚙️",
  exchange:    "🌐",
  world:       "🌍",
  lives:       "🪞",
};

// ── CATEGORY COLOR PALETTE — fixed across every folio ─────────────────────────
// Previously each folio picked its own color/accent/bg per category — organic drift
// across many authoring sessions rather than a deliberate design, and it meant a reader
// couldn't learn "purple = Conflict" the way they can learn "⚔️ = Conflict", since the
// color changed folio to folio. Centralized 2026-07-08: 9 of these 11 were already ~26/26
// consistent across the corpus by coincidence (kept as-is); only `power` (genuinely
// varied per folio) and `technology` (roughly split) needed an actual pick. `bg` was
// dropped from the schema entirely — grep-confirmed it was never read anywhere in
// index.html, pure dead data on every folio.
const CAT_COLORS = {
  power:      { color: "#5C0A00", accent: "#A0200A" }, // imperial crimson
  conflict:   { color: "#4A235A", accent: "#7D3C98" }, // purple
  order:      { color: "#1A3A5C", accent: "#2471A3" }, // blue
  belief:     { color: "#0B4F2E", accent: "#1E8449" }, // green
  expression: { color: "#5D4037", accent: "#8D6E63" }, // brown
  thought:    { color: "#2C3E50", accent: "#566573" }, // slate
  economy:    { color: "#4A3200", accent: "#8B5E00" }, // ochre
  technology: { color: "#5C2D00", accent: "#B7770D" }, // copper
  exchange:   { color: "#1A3A3A", accent: "#148080" }, // teal
  world:      { color: "#0F2A3D", accent: "#2E6F8E" }, // steel blue
  lives:      { color: "#2E1A4A", accent: "#7B4FA6" }, // violet
};

// Tag-level colors (TAG_COLORS) were removed — the modal's accent color and tag badge
// both use the entry's category accent instead (see openModal() in index.html), which
// is a required schema field on every category and so can never be missing.
