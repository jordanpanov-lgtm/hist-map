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

// ── TAG COLOURS ───────────────────────────────────────────────────────────────
const TAG_COLORS = {
  SUCCESSION:"#2471A3",COUP:"#C0392B",PUPPET:"#884EA0",APPOINTED:"#1E8449",
  LEGITIMATE:"#2471A3",DEPOSED:"#C0392B",MARRIAGE:"#884EA0",
  BATTLE:"#7D3C98",INVASION:"#C0392B",SACK:"#922B21",NAVAL:"#1A5276",
  POLITICAL:"#566573",CONSTRUCTION:"#1E8449",LAW:"#2471A3",EDICT:"#2471A3",
  SCHISM:"#117A65",DOCUMENT:"#566573",COUNCIL:"#1E8449",MISSION:"#117A65",
  DEATH:"#7B7D7D",TEXT:"#2C3E50",CHRONICLE:"#2C3E50",FRAGMENT:"#566573",
  LETTERS:"#2C3E50",OBJECT:"#8D6E63",MONUMENT:"#6D4C41",
  MIGRATION:"#B7770D",EARTHQUAKE:"#D35400",PLAGUE:"#7D3C98",
  ECONOMIC:"#8B5E00",EVENT:"#566573",CLIMATE:"#2471A3",TECHNOLOGY:"#2E7D52",
  "CATEGORICAL SHIFT":"#7B4FA6",PRESCRIPTIVE:"#9B6FA6","CIVIL WAR":"#C0392B",
};
