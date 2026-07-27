// ── CORPUS REGISTRY ──────────────────────────────────────────────────────────
// A corpus is a distinct content type from MODULES (folios): it is not bound to
// a region×period cell, and its entries are not a categorized, dated list —
// they're a cross-referenced network. Each corpus ships its own self-contained
// viewer file (a network graph today; future corpus types may render differently).
const CORPORA = [
  {
    id: "buddhist-dictionary",
    file: "corpus/buddhist-dictionary/network.html",
    label: "Buddhism",
    sub: "Top-tier network of the Princeton Dictionary of Buddhism — people, schools, works, concepts, deities & places",
    count: 514,
  },
  // To add a corpus: { id, file, label:"[Name]", sub:"[short description]", count:N }
];
