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
  economy: "💰",
  technology:  "⚙️",
  exchange:    "🌐",
  lives:       "🪞",
};

// Tag-level colors (TAG_COLORS) were removed — the modal's accent color and tag badge
// both use the entry's category accent instead (see openModal() in index.html), which
// is a required schema field on every category and so can never be missing.
