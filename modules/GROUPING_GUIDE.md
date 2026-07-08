# Histomap — Grouping Taxonomy

This is the content/taxonomy authoring guide — what `group` to use per category, terminology and
framing rules, and historiographic corrections specific to this project's actual content (history
as datable events, not scientific findings). For the entry/folio **schema** (fields, `dynasty`,
`keywords`, `xlinks`, validation), see `FIELD_GUIDE.md` — the two are deliberately separate files
since schema is mechanical and stable while this taxonomy reflects editorial decisions revised more
often, some of them hard-won across many folios (see the historiographic warnings and terminology
rules below — these came from real mistakes in earlier drafts, not abstract principle).

Every entry has a `"group"` field. For **Power**, group = empire/kingdom subdivision
(e.g. "Western Empire", "Eastern Empire", "Kingdom of France"). For all other categories,
use the taxonomies below. These are the *standard* groups — you may add context-specific
ones (e.g. "Gothic Wars", "First Crusade") but keep the structure.

---

## ⚔️ Conflict
| Group | Use for |
|---|---|
| `Civil Wars` | internal Roman/state conflicts, usurpations |
| `Gothic Wars` | conflicts involving Goths (Visigoths, Ostrogoths) |
| `Hunnic Wars` | Attila, Hunnic invasions |
| `Vandal Wars` | Vandal raids and campaigns |
| `Parthian / Persian Wars` | conflicts with Parthia or Sassanid Persia |
| `Rhine Frontier` | Germanic crossings, Rhine/Danube frontier events |
| `Gallic Empire` | breakaway Gallic state conflicts |
| `Palmyrene Conflict` | Zenobia, Palmyrene Empire |
| `[Named War]` | use the specific war name for future periods |

**Peace treaty placement rule:**
- **Peace treaties that END a named war** → `Conflict` (they are the terminal event of the conflict)
- **Diplomatic acts between sovereign powers** (embassies, alliances, personal correspondence) → `Exchange`
- **Religious edicts that also end a conflict** (e.g. Edict of Nantes, Henotikon) → `Order`
- The test: if removing the treaty from Conflict would leave the war's story incomplete, it belongs in Conflict.

---

## ⚖️ Order
Order covers **all government-driven acts** — laws, decrees, administrative reforms, fiscal policy, trade legislation, and any state intervention in economic or social life.

**The key distinguishing question:** *Did a government or sovereign authority cause this?* If yes → Order. If it emerged from market forces, demographic change, ecological factors, or non-state actors → Economy.

| Group | Use for |
|---|---|
| `Imperial Law` | law codes, constitutions, compilations |
| `Constitutional Law` | constitutions, charters, declarations of rights |
| `Administrative Reform` | provincial reorganisation, offices, bureaucracy, prefectural systems |
| `Military Decree` | conscription, frontier policy, army reforms |
| `Ecclesiastical Act` | edicts touching religion (even if issued by ruler) |
| `Fiscal & Monetary Policy` | taxation systems, currency reform, state debt, budget legislation, sovereign defaults |
| `Trade Legislation` | tariff laws, trade agreements, trade monopolies, free trade decrees |
| `Colonial Law` | colonial charters, governance acts, indigenous rights legislation |
| `Social Reform` | state-driven changes to social structure, education, welfare |
| `Human Rights` | legal recognition or denial of rights; judicial landmark cases |

**Examples of what belongs in Order (not Economy):**
- Philip II's bankruptcies → `Fiscal & Monetary Policy` (Crown decision)
- Colbert's mercantilist ordinances → `Trade Legislation` (state policy)
- Code Noir → `Colonial Law` (legislative act)
- Necker's Compte rendu → `Fiscal & Monetary Policy` (state transparency act)
- Ferry's education laws → `Social Reform` (government legislation)
- Free Trade Decree of 1778 → `Trade Legislation`

---

## 🙏 Belief
| Group | Use for |
|---|---|
| `Church of Rome` | Rome-centred Christianity (replaces "Catholic / Western Church") |
| `Eastern Church` | Constantinople-centred Christianity |
| `Christological Controversy` | Nestorian, Monophysite, Chalcedonian disputes |
| `Church of the East (Nestorian)` | Syriac Christianity centred on Seleucia-Ctesiphon |
| `Graeco-Roman Polytheism` | Traditional Roman/Greek religion, mystery cults — NOT "pagan" or "non-Christian" |
| `Traditional Arab Religion` | Pre-Islamic Arabian religious practice |
| `Zoroastrianism` | Sasanian state religion and related traditions |
| `Manichaeism` | Mani's syncretic religion |
| `Judaism` | Jewish communities and institutions |
| `Buddhism` | Buddhist traditions and institutions |
| `Persecution` | State persecution of any religious group |
| `Missions & New Churches` | Missionary activity, new Christian communities |
| `[Specific Tradition]` | Always name the actual tradition — never use "non-[religion]" framing |

**Key rule:** Never define a tradition by what it is *not* relative to another. "Non-Christian", "non-Muslim", "non-Western" are not valid groups. Name what the tradition *is*.

---

## ✨ Expression
| Group | Use for |
|---|---|
| `Architecture` | buildings, monuments, urban projects |
| `Sculpture & Relief` | stone carving, sarcophagi, triumphal reliefs |
| `Mosaic & Painting` | floor/wall mosaics, panel painting, fresco |
| `Metalwork & Luxury Arts` | coins, plate, ivory, jewellery, enamel |
| `Manuscript & Book Arts` | illuminated manuscripts, decorated codices |
| `Music & Performance` | documented musical instruments, performance records, music theory texts, court musicians, named composers — include even when evidence is indirect (instrument depictions on reliefs, descriptions in literary sources) |
| `Literature & Poetry` | verse, epic, drama (as artistic works, not scholarship) |

---

## 💡 Thought
| Group | Use for |
|---|---|
| `History & Chronicle` | annals, chronicles, narrative histories |
| `Theology` | systematic theology, biblical commentary, apologetics |
| `Philosophy` | philosophical works, Neoplatonism, ethics |
| `Science & Geography` | natural history, medicine, astronomy, cartography |
| `Political Theory` | works on governance, law theory, political philosophy |
| `Letters & Correspondence` | letter collections as intellectual sources |

---

## 💰 Economy
Economy covers **material life independent of government decree** — how people produce, trade, survive, and how economic conditions emerge from non-state forces. This includes bottom-up economic activity, demographic change, ecological factors, and structural economic shifts.

**The key distinguishing question:** *Did this emerge from material, demographic or ecological forces rather than a government decision?* If yes → Economy. If a government caused it → Order.

| Group | Use for |
|---|---|
| `Agriculture & Land` | farming systems, land use, irrigation, crop introduction, famine, enclosure |
| `Trade & Commerce` | merchant activity, commercial networks, market prices, trading companies as economic actors |
| `Industry & Production` | manufacturing, mining, craft production, factory system, industrialisation |
| `Fiscal & Monetary` | currency debasement, inflation, market-driven economic crises, silver flows — when not caused by a single government act |
| `Epidemic & Demographic` | plague, population decline or growth, migration as demographic phenomenon |
| `Climate & Environment` | droughts, famines, ecological shifts affecting material life |
| `Nomadic & Subsistence` | hunter-gatherer, pastoral, nomadic economies; the transition between economic modes (nomadic → agricultural; agricultural → urban) |

**Examples of what belongs in Economy (not Order):**
- Potosí silver and the Price Revolution → `Fiscal & Monetary` (market-driven inflation)
- Columbian Exchange crops (potato, maize) transforming European diet → `Agriculture & Land`
- Black Death demographic collapse → `Epidemic & Demographic`
- Haussmann's Paris displacement of workers → `Trade & Commerce` (social consequence of urban economics)
- French industrialisation — railways and banking → `Industry & Production`
- Huguenot refugees bringing manufacturing skills to Prussia → `Trade & Commerce`

**Economy vs Exchange:** Economy covers production and material conditions *within* a society or region. Exchange covers the *movement* of goods, people, and ideas *across* boundaries. The Incense Road as a route → Exchange. The agricultural surplus that fuels it → Economy.

**Economy vs Order:** When a government explicitly legislates an economic condition, it goes in Order (Colbert's tariffs, Free Trade Decree, Code Noir). When the economic condition emerges from market forces, demographic change or ecology, it goes in Economy (silver inflation, famine, industrialisation).

---

## ⚙️ Technology
| Group | Use for |
|---|---|
| `Military Engineering` | fortifications, siege technology, naval construction |
| `Civil Engineering` | roads, aqueducts, bridges, harbours |
| `Information & Communication` | writing technology, book production, archives |
| `Agriculture & Industry` | mills, crop innovation, metallurgy |

---

## 🌍 World
| Group | Use for |
|---|---|
| `Geopolitical Shift` | new empires, state collapses, territorial changes |
| `Migration & Invasion` | population movements, barbarian settlements |
| `Climate & Environment` | droughts, earthquakes, volcanic events, cooling |
| `Epidemic` | pandemic-scale disease events |

---

## Notes for Claude when generating new folios

When asked to generate a new histomap folio, always:
1. Add `"group"` to **every** entry using these taxonomies
2. Use context-specific conflict group names (e.g. "First Crusade", "Hundred Years War")
   rather than generic ones where the period has a named conflict
3. For Belief, always specify the actual tradition/stream — never use "non-[religion]" framing
4. For Expression, always specify the medium — never leave ungrouped
5. Power entries always use empire/kingdom subdivision as group + dynasty field
6. **The Economy / Order distinction is critical.** Before placing any economic entry, ask: *Did a government cause this?* If yes → Order. If it emerged from material/demographic/ecological forces → Economy. When in doubt, ask which category's absence would leave the folio's story more incomplete.
7. **Always look for Music & Performance evidence** — instrument finds, court musicians, music theory texts, depictions of instruments on reliefs or mosaics, named performers. Every culture has music; it is consistently underrepresented. Anchor types include: named instrument finds with museum inventory numbers; descriptions in literary sources; instrument depictions on dated visual art; theoretical treatises. Examples by region/period: Roman (hydraulis, Aquincum find 228 CE; Boethius De Institutione Musica); Sassanid (chang/barbat/ney on Taq-e Bostan reliefs; Barbad at court of Khosrow II); Lakhmid/Arab (barbat→oud transmission via al-Hira); Byzantine (Ambrose antiphonal hymnody 386 CE); Islamic (Kitab al-Aghani as primary source); European Medieval/Early Modern (printed music editions with BnF/BL shelfmarks).

**Terms to avoid in authored text (hints, subtitles):**
- `non-Christian`, `non-Muslim`, `non-Western` — define by what it IS, not what it is not
- `barbarian` — use "Germanic peoples", "federate troops", "steppe peoples" etc. as appropriate;
  exception: when directly quoting or describing a primary source that uses the term
- `the last pagans`, `pagan darkness`, `Dark Ages` — teleological framing
- `Eastern` as a synonym for inferior, exotic or underdeveloped
- `Catholic` for pre-schism Western Christianity — use "Church of Rome" before 1054
- `Byzantine` is acceptable as standard historiographic terminology for the Eastern Roman Empire

---

## 🪞 Lives
*Gender, sexuality & the experience of the marginalised — including categorical shifts*

| Group | Use for |
|---|---|
| `Women's Agency` | documented exercise of political, intellectual, economic or creative power by women |
| `Same-Sex Practice & Law` | evidence of same-sex relations, desire or identity; laws regulating them |
| `Gender Variance` | documented gender non-conforming persons, roles or categories |
| `Enslaved Lives` | legal status, resistance, manumission, and the humanity of enslaved persons |
| `Marginalised Communities` | evidence for the lived experience of any systematically excluded group |

**Two tags specific to this category:**
- `CATEGORICAL SHIFT` — entries documenting when a *new way of classifying* a phenomenon emerges: a new legal category, a new theological framework, a new social role. The Foucauldian layer.
- `EVIDENCE` — direct evidence of a person's or group's life, practice or agency (as opposed to prescriptive texts *about* them)

**Key methodological rules for Lives entries:**
1. **Distinguish acts from identities.** Roman law punished acts and roles; modern identity categories (gay, transgender) are anachronistic if applied uncritically. Note the framework the *source* uses, not the framework we bring.
2. **Distinguish evidence from prescription.** A law against something is evidence the thing existed and was visible — but note it is legal evidence, not biographical evidence.
3. **Name the Foucauldian shift when it occurs.** When a new framework for classifying a category of person or practice emerges, that shift is itself the historical event. Date it, anchor it to a text.
4. **No retroactive identity labels without flagging.** Writing "Elagabalus was transgender" is an anachronistic claim; writing "SHA describes Elagabalus using feminine pronouns and seeking surgical feminisation — modern scholars read this as gender variance" is honest.
5. **The Zoroastrian/Roman/Islamic frameworks are not interchangeable.** Each constructs its categories differently; the differences are historically significant.

---

## 🔀 Exchange
*Diplomacy, trade routes, cultural transmission & the movement of peoples, goods and ideas*

| Group | Use for |
|---|---|
| `Diplomatic Exchange` | formal and informal diplomatic contacts, treaties, embassies, royal correspondence |
| `Silk Road & Trade Routes` | overland and maritime trade routes, caravan networks, trade disruptions |
| `Cultural Transmission` | deliberate movement of texts, artistic forms, technologies or religious ideas across boundaries |
| `Intellectual Exchange` | scholars, philosophers, translators crossing between traditions |
| `Migration & Settlement` | population movements with documented cultural consequences |

**Position in folio:** between Subsistence and World.

**Key principle:** Exchange entries should document the *interface* between cultures, not internal developments. The question is always: what crossed a boundary, how, and what happened as a result?

**Note on moved entries:** some entries that previously lived in Subsistence (trade), Thought (translation) or World (diplomacy) may be better placed here. The test: if the entry is primarily about contact and transmission *between* entities rather than internal to one, it belongs in Exchange.

---

## 🗺️ Folio Region & Sub-Region Taxonomy

Every folio must have a `region` field in the `MODULES` array in `config/registry.js` (not
`index.html` — the config was extracted out of the main script) set to one of the sub-region IDs
below, OR to the top-level region ID when the entity spans multiple sub-regions. The same taxonomy
also lives in `config/regions.js`'s `TAXONOMY` constant, which the app reads at runtime — the table
below should match it; if they ever diverge, `config/regions.js` is the one the app actually uses.

### Exception rule — when to use the top-level region ID
Use the **top-level region ID** (e.g. `"Europe"`, `"Near East"`) when the entity's territorial scope genuinely spans multiple sub-regions and no single sub-region contains its core. Examples:
- Roman Empire → `"Europe"` (spans South Europe, Near East, North Africa)
- Byzantine Empire → `"Near East"` (Constantinople is the core)
- Ottoman Empire → `"Near East"` (Anatolia/Constantinople is the core)
- Mongol Empire → `"Far East"` (Mongolia is the origin)
- Islamic Caliphate → `"Near East"` (Arabia/Iraq is the core)

### Sub-region IDs and their coverage

**Europe** (`"Europe"`)
| Sub-region ID | Coverage |
|---|---|
| `Iberia` | Spain, Portugal |
| `Mediterranean` | Italy, Greece, Malta, Cyprus |
| `West Europe` | Britain, Ireland, France, Germany, Belgium, Netherlands |
| `Central Europe` | Austria, Switzerland, Poland, Czechia, Slovakia, Hungary |
| `North Europe` | Denmark, Finland, Sweden, Norway, Iceland, Baltic States |
| `East Europe` | Russia (European), Belarus, Ukraine, Moldova, Romania, Bulgaria, Western Balkans |

**Near East** (`"Near East"`)
| Sub-region ID | Coverage |
|---|---|
| `Turkey` | Anatolia, Bosphorus region |
| `Caucasus` | Armenia, Georgia, Azerbaijan |
| `Levant` | Syria, Lebanon, Palestine, Jordan, Israel |
| `Egypt` | Nile Valley, Sinai, Delta |
| `Arabia` | Arabian Peninsula, Hejaz, Yemen, Oman, Gulf states |
| `Iraq` | Mesopotamia, Tigris-Euphrates basin |
| `Iran` | Persia, Fars, Khorasan, Zagros region |

**Far East** (`"Far East"`)
| Sub-region ID | Coverage |
|---|---|
| `North Asia` | Siberia, Russian Far East |
| `Central Asia` | Afghanistan, Uzbekistan, Turkmenistan, Tajikistan, Kyrgyzstan, Kazakhstan |
| `East Asia` | China, Tibet, Xinjiang, Mongolia, Korea, Japan |
| `South Asia` | North India, Pakistan, Himalaya, Deccan, South India, Sri Lanka |
| `South East Asia` | Vietnam, Cambodia, Laos, Thailand, Myanmar, Malaysia, Indonesia |

**Africa** (`"Africa"`)
| Sub-region ID | Coverage |
|---|---|
| `North Africa` | Morocco, Algeria, Tunisia, Libya, Sudan |
| `East Africa` | Ethiopia, Somalia, Kenya, Tanzania, Uganda |
| `West Africa` | Mali, Ghana, Nigeria, Senegal, Ivory Coast |
| `Central Africa` | DRC, Congo, Cameroon, Chad |
| `South Africa` | South Africa, Zimbabwe, Mozambique, Zambia, Namibia, Madagascar |

**Americas** (`"Americas"`)
| Sub-region ID | Coverage |
|---|---|
| `North America` | Canada, United States, Mexico |
| `Central America` | Central America, Caribbean |
| `South America` | Brazil, Argentina, Chile, Colombia, Ecuador, Peru, Bolivia |

**Oceania** (`"Oceania"`)
| Sub-region ID | Coverage |
|---|---|
| `Australia` | Australian continent |
| `Oceania` | New Zealand, Melanesia, Micronesia, Polynesia, Easter Island, Hawaii |

### Note on Russia
Russia appears in **two** sub-regions:
- European Russia → `"East Europe"`
- Siberia / Far East Russia → `"North Asia"`

A folio about Russia as a whole (e.g. Tsarist Russia, Soviet Union) → `"Europe"` (the core/capital is western).


---

## 🕐 Modern Period Folios (1900–today) — Special Guidance

Modern folios differ from ancient/medieval ones in evidence type, political sensitivity and the problem of living history. The rules below apply to any folio with `period_label: "Modern"`.

---

### Evidence anchor types for the Modern period

The hierarchy of anchor strength shifts in the modern period:

| Anchor type | Reliability | Examples |
|---|---|---|
| Official state gazette (BOE, Gaceta, etc.) | Highest — legal record | Laws, decrees, appointment dates, constitutional texts |
| Electoral results (Interior Ministry) | High — primary numerical data | Election outcomes, turnout, party seat counts |
| Parliamentary records (Diario de Sesiones) | High — verbatim primary source | Speeches, votes, debates |
| Declassified government documents | High — but note classification date and releasing government's interests | 23-F files (2026), diplomatic cables |
| Statistical surveys (INE, CIS, Eurostat) | High for quantitative claims — note survey methodology | Unemployment, housing prices, public opinion |
| Eyewitness journalism (same-day press) | Medium — note publication's editorial line | El País, ABC, Le Monde dispatches |
| Official commission / inquiry reports | Medium — note who commissioned them | 11-M Commission, Defensor del Pueblo |
| Academic studies | Medium — useful for synthesis, not primary | Carr, Preston, Payne etc. |
| Oral testimony / memoir | Lower — subject to retrospective distortion | Flag explicitly |

**Key principle:** in the modern period, the BOE (Boletín Oficial del Estado) and its equivalents are the primary anchor for almost every Power and Order entry. Always cite the BOE date and decree number where applicable.

---

### Power entries in Modern folios

**Always use two lanes in Modern Power:**

1. **Head of State lane** — monarchs, presidents, using the dynasty field for their party or institutional affiliation (e.g. `"dynasty":"Bourbon"`, `"dynasty":"Republic"`)

2. **Governments lane** — prime ministers / heads of government as dynasty-equivalent, using `"dynasty":"[party abbreviation]"` (e.g. `"dynasty":"PSOE"`, `"dynasty":"PP"`). Each entry anchored to the BOE appointment decree.

**Cross-regional / cross-period entities** (e.g. the EU, NATO) belong in Exchange or World, not Power.

**Ongoing governments:** if a PM is still in office at the time of folio generation, give `y2` as the folio's end year and note in the hint that the tenure continues. Never make forward-looking claims.

---

### Conflict entries in Modern folios

Modern conflict groups to use:

| Group | Use for |
|---|---|
| `[Named War]` | Use the specific war name (e.g. "Spanish Civil War", "Falklands War") |
| `Terrorism` | Non-state political violence with named perpetrator group |
| `Coup Attempt` | Military or political attempts to overthrow constitutional order |
| `Social Movements` | Mass protest movements that constitute historical events (15-M, 8-M) |
| `Colonial Wars` | Wars of decolonisation or imperial conflict |

**Social movements belong in Conflict**, not in World or Thought — they are the exercise of political force by non-state actors, and their documentary evidence (manifestos, turnout data, police records) is primary source material.

---

### Economy entries in Modern folios

Modern economic events should be anchored to:
- **Statistical data with source**: "unemployment peaked at 27%: INE, EPA Q1 2013" — not just "high unemployment"
- **Official policy documents**: decrees, budget laws (BOE), EU commission decisions
- **Note the discrepancy between official and alternative measurements** where it exists (e.g. official COVID deaths vs excess mortality)

Groups to use:
| Group | Use for |
|---|---|
| `Agriculture & Land` | Food production, land reform, agricultural crises |
| `Industry & Production` | Industrial output, factory conditions, economic sectors |
| `Trade & Commerce` | Market-driven economic activity, commercial crises, housing markets |
| `Epidemic & Demographic` | Disease events, population shifts, migration |
| `Climate & Environment` | Environmental disasters, climate policy |

**Note:** Fiscal policy, taxation, trade legislation and government economic decisions belong in **Order**, not Economy.

---

### Lives entries in Modern folios

The Modern period has the richest Lives evidence of any period — opinion surveys, legal texts, parliamentary debates, oral testimony, journalism. Key guidance:

- **Legal CATEGORICAL SHIFTs are the backbone**: every change in the legal status of a group (criminalisation, decriminalisation, equal rights) is a dateable event with a BOE anchor. These are the most reliable Modern Lives entries.
- **Distinguish legal equality from lived reality**: a law granting rights does not mean those rights are exercised equally. Use statistical sources (CIS, INE, NGO reports) to document the gap where it exists.
- **Political sensitivity**: Modern Lives entries on LGBTQ+ rights, minority communities, and gender violence are politically contested in many countries. The folio's job is not to adjudicate but to document. Note where the evidence is disputed.
- **Ongoing situations**: flag clearly with "as of [year]" and note that the situation continues. Never project future outcomes.

---

### World entries in Modern folios

| Group | Use for |
|---|---|
| `Geopolitical Shift` | Major changes in international position, alliances, territorial changes |
| `Climate & Environment` | Environmental disasters, climate agreements |
| `Migration & Invasion` | Mass population movements with documented historical significance |

**International organisations** (EU, NATO, UN) appear in World when their decisions affect the folio's entity, and in Exchange when the entity's relationship with them is the story.

---

### Sensitivity guidelines for Modern folios

Modern folios inevitably cover politically live territory. Follow these rules:

1. **Numbers must be sourced and uncertainty flagged.** Never give a single figure for contested counts (casualties, protest turnout, economic damage) without noting the range and the sources' interests.
2. **Ongoing events are flagged as such.** Add "as of [year of folio generation]" for entries describing situations still in progress.
3. **Government sources are primary but not neutral.** A government's own data (BOE, Interior Ministry) is the authoritative legal record but may undercount (deaths, casualties) or overcount (economic achievements). Note where alternative sources give different figures.
4. **Living political figures.** Avoid characterising living politicians beyond what documentary evidence supports. Describe actions and their documented consequences, not motivations.
5. **No forward-looking claims.** The folio records what happened and when. It does not predict outcomes of ongoing situations (e.g. Catalan independence, housing crisis resolution).
6. **The Lives category requires special care in Modern folios.** Entries on LGBTQ+ rights, minority communities, reproductive rights, and gender violence must cite legal texts and statistical data, not advocacy sources. The CATEGORICAL SHIFT tag is appropriate when a legal framework changes; the EVIDENCE tag for documented lived experience.

---

## Historiographic Warnings for AI-Generated Content

These notes address known biases in the source tradition that Claude should correct for when generating new folios.

### The "Reconquista" label
The term "Reconquista" as a continuous, providential holy war 718–1492 is a **19th-century nationalist construct** — modern medievalists (O'Callaghan, Linehan, Fletcher) demonstrate it was retrojected to build a national founding myth. In practice, Christian and Muslim kingdoms operated in shifting webs of military alliances, *parias* extortion, inter-dynastic marriages, and civil wars. Use "Reconquista" as a Conflict group label for navigational clarity, but always note in entry hints/notes when the specific event was pragmatic rather than ideological.

### Castilian-centric teleology
The folio structure privileges Castilian entities. When generating folios touching the Crown of Aragon, always include entries on **pactismo** (constitutional limitation of royal power through Corts contracts) as a counterweight to Castilian absolutism. Similarly, **Basque and Navarrese fueros** represent continuous constitutional self-governance predating any centralising tendency.

### Habsburg "inevitable decline" narrative
The traditional "decline" narrative of 17th-century Spain has been substantially revised by Elliott, Kamen, and Grafe. The empire was a decentralised, resilient composite confederation, not a failing monolith. When generating late Habsburg entries, acknowledge this revisionism — particularly in World category entries.

### Peninsular vs. imperial geography
The Spain folios oscillate between peninsular and global imperial scope. Colonial entries (Americas, Philippines) are legitimate for the Habsburg folio since they are part of the empire's story, but always use the primary administrative location for `coords` and flag the geographic distance in `loc`.

### Primary source discipline — modern anchors
Entries anchoring to **modern legislation** (e.g. Historical Memory Law 2007) or **modern academic debates** (e.g. convivencia historiography) as their PRIMARY source violate the methodology. These may be referenced as **secondary interpretive frameworks** but the primary anchor must be a medieval/contemporary source: a court record, treaty text, council act, or dated chronicle. Flag this explicitly in the note field.

---

## STRUCTURAL INVARIANTS — apply to every folio without exception

### 1. Canonical category order (11 categories, always in this sequence)
Every folio MUST contain all 11 categories in this exact order:
1. ⚜️  power
2. ⚔️  conflict
3. ⚖️  order
4. 🙏  belief
5. ✨  expression
6. 💡  thought
7. 💰  economy
8. ⚙️  technology
9. 🌐  exchange
10. 🌍  world
11. 🪞  lives

Technology was historically generated as a late addition and ends up appended at the end — always explicitly insert it at position 8. If a folio genuinely has no technology content, add an empty stub with the correct id/label/icon so the category bar renders.

### 2. Timeline lane order
Timeline lanes must mirror the category order above. The power category generates TWO lanes — a span lane for dynasties/rulers (e.g. "bourbon-kings") followed immediately by a span lane for prime ministers or equivalent executives (e.g. "prime-ministers"). This gives:
- [dynasty spans]
- [executive spans]  
- conflict
- order
- belief
- expression
- thought
- economy
- technology
- exchange
- world
- lives

Belief and Thought lanes are frequently omitted — they must always be present with events if the category has entries.

### 3. Chronological order within categories
All entries within every category must be sorted by date ascending (oldest first). The ONE exception is the power category: entries are sorted by GROUP first (groups appear in historical sequence), then by date within each group. The sort key for all entries is the first 4-digit year found in the `date` field.

### 4. Subsistence → Economy
The category id is `economy` (icon 💰). The old id `subsistence` must never be used. If any folio still has `subsistence`, rename it globally before committing.

### 5. Span bars: rulers and PMs only
`y2` values should only be set on events in the **dynasty/ruler lane** and the **prime-ministers lane** (or equivalent executive span lanes). Every other lane uses dots — including Economy, Technology, Exchange, Expression, and Lives — even when the entry is ongoing.

The reason: bars encode *duration as meaningful information*. For a PM, how long they governed is genuinely significant data (14 years of González vs 7 of Aznar). For a trend, a movement, or a structural condition, a bar reaching 2026 adds false precision — it implies a defined endpoint. A dot at the start year says "this begins here" clearly enough.

The current convention for open-ended rulers/PMs: set `y2: 2026` on their timeline event so the bar reaches the right edge of the visible timeline. All other events: no y2, dots only.

### 6. Validation checklist before finalising any folio
Run this check mentally before saving:
- [ ] All 11 categories present in canonical order?
- [ ] Technology category populated (even if stub)?
- [ ] All entries sorted chronologically within categories?
- [ ] All timeline lanes present and ordered?
- [ ] Belief and Thought lanes present with events?
- [ ] No `subsistence` category ids?
- [ ] Open-ended events have y2=2026?
- [ ] No duplicate entry ids?
- [ ] No broken timeline entryId references?

