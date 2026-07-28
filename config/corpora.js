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
    sub: "People, schools, works, concepts, deities & places",
    count: 514,
  },
  {
    id: "islamic-political-thought",
    file: "corpus/islamic-political-thought/network.html",
    label: "Islamic Political Thought",
    sub: "Persons, dynasties, places, schools, institutions, events, works & concepts",
    count: 416,
  },
  // To add a corpus: { id, file, label:"[Name]", sub:"[short description]", count:N }
];
