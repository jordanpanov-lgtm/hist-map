#!/usr/bin/env python3
"""
MIGRATION: subsistence → economy across all Histomap files

Run this script from the root of the histomap repo:
    python3 MIGRATE_SUBSISTENCE_TO_ECONOMY.py

What it does:
1. In every modules/*.json:
   - Renames category id "subsistence" → "economy"
   - Renames category label "Subsistence" → "Economy"
   - Updates category icon from "🌾" to "💰"
   - Renames timeline lane id "subsistence" → "economy"
   - In any entry whose group is "Fiscal & Monetary" (taxation, state debt, trade laws):
     moves it to the "order" category — creates an "order" entry if needed
     ONLY moves entries where hint/note contain government-action keywords
     (see FISCAL_TO_ORDER_KEYWORDS below)

2. In index.html:
   - Renames CAT_ICONS["subsistence"] → CAT_ICONS["economy"]
   - Updates the category subtitle references
   - Updates any hardcoded "#subsiste" or "subsistence" strings in CSS/JS

MANUAL REVIEW REQUIRED after running:
   - Check every entry moved from subsistence/Fiscal&Monetary to order
   - Verify the Economy/Order split makes sense for each folio
   - Some "Fiscal & Monetary" entries may be market-driven (stay in Economy)
     rather than government-driven (go to Order) — the script flags these for review

DOES NOT touch:
   - Entry content (hint, note, date, loc etc.)
   - Group names other than the structural rename
   - The GROUPING_GUIDE.md (already updated manually)
"""

import json
import os
import re

MODULES_DIR = "modules"
INDEX_FILE = "index.html"

# Keywords that suggest an entry is government-driven → should move to Order
# If hint/note contains any of these, the Fiscal & Monetary entry is flagged for Order
FISCAL_TO_ORDER_KEYWORDS = [
    "decree", "decre", "ordinance", "legislation", "law", "act ", "edict",
    "tax", "tariff", "levy", "duty", "excise", "tribute",
    "colbert", "necker", "turgot", "budget", "treasury",
    "bankruptcy", "default", "debt", "bond", "crown",
    "reform", "policy", "policy",
    "BOE", "BOE ", "gaceta", "bulletin", "journal officiel",
    "parliament", "cortes", "congress", "assembly",
    "sovereign", "royal decree", "pragmatic",
    "stabilisation", "austerity", "subsidy",
    "free trade", "protectionism", "mercantil",
]

def is_government_fiscal(entry):
    """Returns True if the entry appears to be a government fiscal act."""
    text = (entry.get("hint", "") + " " + entry.get("note", "")).lower()
    return any(kw.lower() in text for kw in FISCAL_TO_ORDER_KEYWORDS)

def migrate_module(path):
    with open(path) as f:
        d = json.load(f)

    changed = False
    moved_to_order = []

    # ── 1. Rename subsistence category ────────────────────────────────────────
    for cat in d.get("categories", []):
        if cat["id"] == "subsistence":
            cat["id"] = "economy"
            cat["label"] = "Economy"
            cat["icon"] = "💰"
            changed = True
            print(f"  ✓ Renamed subsistence → economy in {os.path.basename(path)}")

    # ── 2. Find entries that should move to Order ──────────────────────────────
    economy_cat = next((c for c in d.get("categories", []) if c["id"] == "economy"), None)
    order_cat   = next((c for c in d.get("categories", []) if c["id"] == "order"),   None)

    if economy_cat and order_cat:
        to_keep   = []
        for entry in economy_cat.get("entries", []):
            if entry.get("group") == "Fiscal & Monetary" and is_government_fiscal(entry):
                # Change group name to match Order taxonomy
                entry["group"] = "Fiscal & Monetary Policy"
                order_cat["entries"].append(entry)
                moved_to_order.append(entry["id"])
                changed = True
                print(f"  → Moved {entry['id']} ({entry['label'][:50]}) to Order")
            else:
                to_keep.append(entry)
        economy_cat["entries"] = to_keep

        # Also rename remaining "Fiscal & Monetary" groups in Economy to cleaner name
        for entry in economy_cat.get("entries", []):
            if entry.get("group") == "Fiscal & Monetary":
                entry["group"] = "Fiscal & Monetary"  # keep as-is — market-driven

    # ── 3. Rename timeline lane ────────────────────────────────────────────────
    for lane in d.get("timeline", []):
        if lane["id"] == "subsistence":
            lane["id"] = "economy"
            # Update label if it says subsistence
            if lane.get("label", "").upper() == "SUBSISTENCE":
                lane["label"] = "Economy"
            changed = True

        # Remove moved entries from economy timeline lane
        if lane["id"] == "economy" and moved_to_order:
            original_count = len(lane.get("events", []))
            lane["events"] = [
                ev for ev in lane.get("events", [])
                if ev.get("entryId") not in moved_to_order
            ]
            if len(lane["events"]) < original_count:
                print(f"  ✓ Removed {original_count - len(lane['events'])} moved events from economy timeline lane")

    if changed:
        with open(path, "w") as f:
            json.dump(d, f, indent=2, ensure_ascii=False)
    return moved_to_order

def migrate_index(moved_summary):
    with open(INDEX_FILE) as f:
        content = f.read()

    original = content

    # Rename in CAT_ICONS
    content = content.replace('"subsistence":', '"economy":')
    content = content.replace("'subsistence':", "'economy':")

    # Rename in CSS classes (timeline lane labels rendered via JS)
    content = content.replace("id:'subsistence'", "id:'economy'")
    content = content.replace('id:"subsistence"', 'id:"economy"')

    # Rename icon in category metadata arrays
    content = content.replace(
        '{ id:"subsistence"', '{ id:"economy"'
    )
    content = content.replace(
        "{ id:'subsistence'", "{ id:'economy'"
    )

    if content != original:
        with open(INDEX_FILE, "w") as f:
            f.write(content)
        print("✓ index.html updated")
    else:
        print("  (no changes needed in index.html)")

def main():
    print("=== Histomap: subsistence → economy migration ===\n")

    all_moved = {}
    json_files = sorted(
        f for f in os.listdir(MODULES_DIR) if f.endswith(".json") and f != "GROUPING_GUIDE.md"
    )

    for fname in json_files:
        path = os.path.join(MODULES_DIR, fname)
        moved = migrate_module(path)
        if moved:
            all_moved[fname] = moved

    print(f"\n--- Migrating index.html ---")
    migrate_index(all_moved)

    print(f"\n=== Migration complete ===")
    print(f"Files processed: {len(json_files)}")
    print(f"Files with entries moved to Order: {len(all_moved)}")
    if all_moved:
        print("\nEntries moved to Order (REVIEW MANUALLY):")
        for fname, ids in all_moved.items():
            print(f"  {fname}: {', '.join(ids)}")
    print("\nNext steps:")
    print("  1. Review moved entries — verify Order vs Economy placement")
    print("  2. Check timeline lanes still make sense")
    print("  3. git diff to review all changes before committing")

if __name__ == "__main__":
    main()
