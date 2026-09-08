'use strict';
/**
 * apply-xlinks.js
 * Applies confirmed cross-folio links from _xlink_candidates.json to the actual folio
 * entries, writing bidirectional entry.xlinks[]. This is the "apply" step of the
 * propose (build-xlink-candidates.js) -> review (human) -> apply workflow — it does NOT
 * decide which candidates are correct; it takes an explicit, reviewed list of pairs.
 *
 * Usage: node modules/apply-xlinks.js
 * Edit SELECTED_PAIRS below (or the selection logic that builds it) to control scope —
 * intentionally not "apply everything in the candidates file", since low/medium
 * confidence matches need individual review first.
 *
 * Idempotent (skips a pair if both sides already reference each other) and
 * formatting-preserving (splices into the raw file text, same approach as
 * build-keywords.js, rather than reserializing the whole file).
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;

// ── Selection: which candidates to actually apply ────────────────────────────
// Scope for this run (2026-09, the Arabia-folio split pass): the automated
// candidate file this time is dominated by place- and civilisation-name tokens
// ("Gulf", "Dilmun", "Sasanian", "Qatar") rather than genuine figure matches, so
// a blanket apply of figure_name_matches / keyword_matches would pollute the
// graph. Instead this is an EXPLICIT, hand-verified list — chiefly the temporal
// hand-offs between folios that were split at a period boundary in this pass
// (dilmun, magan, beth-qatraye, trucial-gulf), each checked entry-by-entry.
JSON.parse(fs.readFileSync(path.join(DIR, '_xlink_candidates.json'), 'utf8')); // keep the file fresh; not consumed here
const SELECTED_PAIRS = [
  // ── babylon-1595bc-1155bc ∥ assyria-1400bc-1050bc (the north/south parallel pair) ──
  // Kassite Babylonia — hand-off backward from Hammurabi and the Amorite Kingdoms:
  ['babylon-1595bc-1155bc::k1', 'babylon-2004bc-1595bc::c6'],   // the Hittite raid leaves a throne the Kassites take
  ['babylon-1595bc-1155bc::k2', 'babylon-2004bc-1595bc::c6'],   // Marduk carried off by the Hittites -> Agum II brings him home
  ['babylon-1595bc-1155bc::k3', 'babylon-2004bc-1595bc::c5'],   // the abandonment of the south and the Sealand -> Ulamburiash reunites Babylonia
  ['babylon-1595bc-1155bc::b1', 'babylon-2004bc-1595bc::b1'],   // Marduk's rise continues
  ['babylon-1595bc-1155bc::x4', 'babylon-2004bc-1595bc::x2'],   // the Old Babylonian Gilgamesh -> the Standard Babylonian edition
  ['babylon-1595bc-1155bc::b5', 'babylon-2004bc-1595bc::b2'],   // the righteous sufferer -> Ludlul bel nemeqi
  ['babylon-1595bc-1155bc::t5', 'babylon-2004bc-1595bc::t5'],   // the wisdom-and-theodicy debate
  ['babylon-1595bc-1155bc::e1', 'babylon-2004bc-1595bc::e5'],   // the emptying of the south -> its recovery under the Kassite peace
  // Kassite Babylonia — lateral to the Gulf and to Egypt's Amarna age:
  ['babylon-1595bc-1155bc::xc4', 'dilmun-3000bc-1200bc::o3'],   // Babylonia administers Dilmun <-> the Kassite governor's archive at Qal'at al-Bahrain
  ['babylon-1595bc-1155bc::xc2', 'egypt-1550bc-1200bc::xc1'],   // the two halves of the Amarna correspondence
  ['babylon-1595bc-1155bc::xc1', 'egypt-1550bc-1200bc::w3'],    // Karduniash in the club of great powers
  ['babylon-1595bc-1155bc::l4',  'egypt-1550bc-1200bc::xc2'],   // the princess sent abroad <-> marrying into Egypt
  ['babylon-1595bc-1155bc::xc3', 'egypt-1550bc-1200bc::e1'],    // lapis and horses for the Nubian gold of Egypt's tribute economy
  ['babylon-1595bc-1155bc::g2',  'egypt-1550bc-1200bc::g3'],    // the glass industry, north and south of the sea
  ['babylon-1595bc-1155bc::g4',  'egypt-1550bc-1200bc::g2'],    // iron still a curiosity, everywhere
  // Kassite Babylonia ∥ Middle Assyria — the parallel folios cross-linked:
  ['babylon-1595bc-1155bc::k6', 'assyria-1400bc-1050bc::k1'],   // Ashur-uballit makes a king of Babylon / founds the Assyrian state
  ['babylon-1595bc-1155bc::c2', 'assyria-1400bc-1050bc::xc2'],  // the border war, told from each side
  ['babylon-1595bc-1155bc::c3', 'assyria-1400bc-1050bc::c3'],   // Tukulti-Ninurta takes Babylon — Babylonian and Assyrian accounts
  ['babylon-1595bc-1155bc::k8', 'assyria-1400bc-1050bc::k4'],   // Kashtiliash IV captured by Tukulti-Ninurta I
  ['babylon-1595bc-1155bc::k9', 'assyria-1400bc-1050bc::k5'],   // the Babylonian reaction and the murder of Tukulti-Ninurta
  ['babylon-1595bc-1155bc::o5', 'assyria-1400bc-1050bc::t1'],   // Babylon canonises the tradition, Assyria copies it
  ['babylon-1595bc-1155bc::w4', 'assyria-1400bc-1050bc::w3'],   // both weather the Bronze Age collapse and barely survive
  ['babylon-1595bc-1155bc::xc1', 'assyria-1400bc-1050bc::xc1'], // both in the Great Kings' club, in rivalry
  // ── assyria-1400bc-1050bc (The Middle Assyrian Kingdom) — further links ──
  ['assyria-1400bc-1050bc::k1', 'babylon-2004bc-1595bc::k6'],   // the merchant city-state of Assur becomes a kingdom
  ['assyria-1400bc-1050bc::e4', 'babylon-2004bc-1595bc::e2'],   // the Assur–Kanesh caravan trade, now long gone
  ['assyria-1400bc-1050bc::e4', 'babylon-2004bc-1595bc::xc1'],  // the karum system it once ran
  ['assyria-1400bc-1050bc::xc5', 'babylon-2004bc-1595bc::w1'],  // the Amorite settlement -> the Aramaean flood, the pattern repeats
  ['assyria-1400bc-1050bc::xc1', 'egypt-1550bc-1200bc::xc1'],   // Ashur-uballit writes to Egypt as a Great King
  ['assyria-1400bc-1050bc::c1', 'egypt-1550bc-1200bc::c4'],     // Egypt broke Mitanni's coalition from the west, Assyria destroyed it from the east
  ['assyria-1400bc-1050bc::g2', 'egypt-1550bc-1200bc::g2'],     // iron enters use, still a rarity
  // ── babylon-2004bc-1595bc (Hammurabi and the Amorite Kingdoms) ──
  // hand-off backward from Akkad and the Third Dynasty of Ur:
  ['babylon-2004bc-1595bc::k1',  'mesopotamia-2334bc-2004bc::e6'],  // Ishbi-Erra, sent to buy grain, founds Isin on the wreck of Ur
  ['babylon-2004bc-1595bc::x3',  'mesopotamia-2334bc-2004bc::x5'],  // the Sumerian literary Renaissance copied on in the OB schools
  ['babylon-2004bc-1595bc::x3',  'mesopotamia-2334bc-2004bc::t2'],  // preserving a dying language -> Sumerian as the schoolroom classic
  ['babylon-2004bc-1595bc::o1',  'mesopotamia-2334bc-2004bc::o5'],  // the Code of Hammurabi in the line of the Code of Ur-Namma
  ['babylon-2004bc-1595bc::t1',  'mesopotamia-2334bc-2004bc::t3'],  // the sexagesimal system matures into the golden age of OB mathematics
  ['babylon-2004bc-1595bc::e5',  'mesopotamia-2334bc-2004bc::w2'],  // the salt of the south -> the abandonment of the oldest farmland
  ['babylon-2004bc-1595bc::w1',  'mesopotamia-2334bc-2004bc::w3'],  // the Amorite migration -> the completed Amorite settlement
  ['babylon-2004bc-1595bc::w1',  'mesopotamia-2334bc-2004bc::xc4'], // the Amorites enter the record -> they now rule everywhere
  ['babylon-2004bc-1595bc::xc5', 'mesopotamia-2334bc-2004bc::xc5'], // Elam — province, then destroyer, then great power of the Mari age
  ['babylon-2004bc-1595bc::b3',  'sumer-2900bc-2334bc::l3'],        // the naditu businesswoman-priestess and the range of women's lives
  // lateral to Dilmun (the Gulf trade):
  ['babylon-2004bc-1595bc::xc4', 'dilmun-3000bc-1200bc::ec2'],      // Ea-nasir and the alik Tilmun merchants of Ur
  ['babylon-2004bc-1595bc::xc4', 'dilmun-3000bc-1200bc::k1'],       // <-> Dilmun in the cuneiform record
  // ── mesopotamia-2334bc-2004bc (Akkad and the Third Dynasty of Ur) ──
  // hand-off backward from The Sumerian City-States:
  ['mesopotamia-2334bc-2004bc::k1',  'sumer-2900bc-2334bc::k12'],  // Sargon defeats Lugalzagesi and founds the first empire
  ['mesopotamia-2334bc-2004bc::c1',  'sumer-2900bc-2334bc::c5'],   // the conquest of Sumer completes the unification Lugalzagesi began
  ['mesopotamia-2334bc-2004bc::x6',  'sumer-2900bc-2334bc::c5'],   // the city lament grows from the Lament for Lagash
  ['mesopotamia-2334bc-2004bc::b3',  'sumer-2900bc-2334bc::l3'],   // Enheduanna and the en-priestess of the moon-god at Ur
  ['mesopotamia-2334bc-2004bc::t5',  'sumer-2900bc-2334bc::k13'],  // the King List as a charter for the current dynasty
  ['mesopotamia-2334bc-2004bc::o5',  'sumer-2900bc-2334bc::o5'],   // the Code of Ur-Namma -> law without a code before it
  ['mesopotamia-2334bc-2004bc::w2',  'sumer-2900bc-2334bc::w2'],   // the salt still rising in the south
  ['mesopotamia-2334bc-2004bc::xc5', 'sumer-2900bc-2334bc::xc5'],  // Elam — larder and threat, then destroyer
  ['mesopotamia-2334bc-2004bc::t3',  'sumer-2900bc-2334bc::t4'],   // the mathematics of the field matures into sexagesimal place value
  ['mesopotamia-2334bc-2004bc::b5',  'uruk-3800bc-2900bc::b4'],    // the ziggurat -> the White Temple on the terrace of Anu
  // lateral to the Gulf (Dilmun and Magan):
  ['mesopotamia-2334bc-2004bc::xc1', 'dilmun-3000bc-1200bc::k2'],  // 'ships of Dilmun, Magan and Meluhha' at the quay of Akkad
  ['mesopotamia-2334bc-2004bc::xc1', 'dilmun-3000bc-1200bc::w1'],  // <-> the Akkadian Empire names the Gulf lands
  ['mesopotamia-2334bc-2004bc::k3',  'magan-3000bc-1200bc::k3'],   // Naram-Sin captures Mannu-dannu, lord of Magan
  ['mesopotamia-2334bc-2004bc::xc3', 'magan-3000bc-1200bc::c1'],   // Magan and the copper campaigns <-> Naram-Sin's campaign against Magan
  ['mesopotamia-2334bc-2004bc::g3',  'magan-3000bc-1200bc::x3'],   // mastering imported hard stone <-> diorite for the statues of Gudea
  ['mesopotamia-2334bc-2004bc::e5',  'dilmun-3000bc-1200bc::ec2'], // silver and the private operator <-> the alik Tilmun merchants of Ur
  ['mesopotamia-2334bc-2004bc::xc2', 'magan-3000bc-1200bc::x2'],   // the Meluhha village <-> Indus material and people on the Magan coast
  // ── sumer-2900bc-2334bc (The Sumerian City-States) ──
  // hand-off backward from Uruk and the First Cities:
  ['sumer-2900bc-2334bc::k5',  'uruk-3800bc-2900bc::c2'],   // Gilgamesh of Uruk and the wall the epic credits to him
  ['sumer-2900bc-2334bc::c4',  'uruk-3800bc-2900bc::p7'],   // the southern cities take shape -> their contest for the leadership of the land
  ['sumer-2900bc-2334bc::o6',  'uruk-3800bc-2900bc::p6'],   // the Jemdet Nasr city-seals -> the league of Sumer at Nippur
  ['sumer-2900bc-2334bc::t1',  'uruk-3800bc-2900bc::o1'],   // the birth of writing -> Sumerian written in full
  ['sumer-2900bc-2334bc::e1',  'uruk-3800bc-2900bc::e4'],   // cereal farming and the first salt -> barley, salt and falling yields
  ['sumer-2900bc-2334bc::e4',  'uruk-3800bc-2900bc::o2'],   // the bevelled-rim bowl and the ration -> the ration and the standard of life
  ['sumer-2900bc-2334bc::b2',  'uruk-3800bc-2900bc::b2'],   // the god's household -> the city and its god
  ['sumer-2900bc-2334bc::x4',  'uruk-3800bc-2900bc::x6'],   // the lyre enters the record -> the lyres of the royal tombs
  ['sumer-2900bc-2334bc::xc5', 'uruk-3800bc-2900bc::xc4'],  // Susa and the Proto-Elamite answer -> Elam, larder and threat
  ['sumer-2900bc-2334bc::l2',  'uruk-3800bc-2900bc::l2'],   // the mountain captive and the work gang -> the captive and the debtor
  // lateral to Dilmun (the Gulf trade):
  ['sumer-2900bc-2334bc::xc1', 'dilmun-3000bc-1200bc::k1'],  // Dilmun, Magan and Meluhha <-> Dilmun enters the cuneiform record
  ['sumer-2900bc-2334bc::xc1', 'dilmun-3000bc-1200bc::x1'],  // <-> the Dilmun–Magan–Meluhha triangle
  ['sumer-2900bc-2334bc::e5',  'dilmun-3000bc-1200bc::ec1'], // the merchants of the Gulf <-> Dilmun the entrepôt
  ['sumer-2900bc-2334bc::g4',  'dilmun-3000bc-1200bc::tc3'], // the seagoing boat <-> the magilum-boat
  ['sumer-2900bc-2334bc::o4',  'dilmun-3000bc-1200bc::o1'],  // sealed standard weights <-> the Dilmun weight standard
  // ── uruk-3800bc-2900bc (Uruk and the First Cities) ──
  // hand-off backward from Ubaid Mesopotamia:
  ['uruk-3800bc-2900bc::p1',  'mesopotamia-6500bc-3800bc::p7'],   // the terminal-Ubaid temple towns grow into the first city
  ['uruk-3800bc-2900bc::o1',  'mesopotamia-6500bc-3800bc::o1'],   // the clay-token accounts become writing
  ['uruk-3800bc-2900bc::o2',  'mesopotamia-6500bc-3800bc::o4'],   // the standardised Ubaid bowl hardens into the bevelled-rim ration bowl
  ['uruk-3800bc-2900bc::o4',  'mesopotamia-6500bc-3800bc::o2'],   // the stamp seal and sealed store give way to the cylinder seal
  ['uruk-3800bc-2900bc::b4',  'mesopotamia-6500bc-3800bc::b1'],   // the Eridu temple sequence -> the White Temple on the terrace of Anu
  ['uruk-3800bc-2900bc::e1',  'mesopotamia-6500bc-3800bc::o3'],   // the redistributive temple -> the temple estate as a centralised enterprise
  ['uruk-3800bc-2900bc::g1',  'mesopotamia-6500bc-3800bc::g2'],   // the slow potter's wheel -> the fast wheel and mass production
  ['uruk-3800bc-2900bc::w2',  'mesopotamia-6500bc-3800bc::w5'],   // from hamlet to town -> the hyper-urban revolution
  // lateral to Predynastic Egypt (the Naqada II–III contact):
  ['uruk-3800bc-2900bc::xc2', 'egypt-6000bc-3000bc::ex1'],        // the Gebel el-Arak knife — a Mesopotamian 'Master of Animals'
  ['uruk-3800bc-2900bc::xc2', 'egypt-6000bc-3000bc::ex2'],        // the cylinder seal as an Egyptian borrowing from Uruk
  ['uruk-3800bc-2900bc::xc3', 'egypt-6000bc-3000bc::ex3'],        // the same lapis road reaching Badari and Naqada graves
  // ── mesopotamia-6500bc-3800bc (Ubaid Mesopotamia): the Ubaid expansion down the Gulf ──
  ['mesopotamia-6500bc-3800bc::xc3', 'gulf-prehistory-8000bc-3000bc::e2'],   // the Ubaid on the Gulf coast <-> Ubaid painted pottery on the Arabian shore
  ['mesopotamia-6500bc-3800bc::xc3', 'gulf-prehistory-8000bc-3000bc::x1'],   // <-> the Ubaid maritime network, Kuwait to Qatar to the UAE
  ['mesopotamia-6500bc-3800bc::xc3', 'gulf-prehistory-8000bc-3000bc::x3'],   // <-> Gulf shell and pearl reach Mesopotamia (the return leg)
  ['mesopotamia-6500bc-3800bc::xc3', 'gulf-prehistory-8000bc-3000bc::p4'],   // <-> As-Sabiyah, an Ubaid-linked settlement on Kuwait Bay
  ['mesopotamia-6500bc-3800bc::g6',  'gulf-prehistory-8000bc-3000bc::tc1'],  // the bitumen boat and earliest sail <-> reed boats caulked with bitumen
  ['mesopotamia-6500bc-3800bc::p6',  'gulf-prehistory-8000bc-3000bc::x1'],   // the Ubaid expansion (one culture, whole basin) reaches the Gulf
  // ── egypt-1952-today (The Egyptian Republic): hand-off from Colonial Egypt and the Monarchy ──
  ['egypt-1952-today::k7', 'egypt-1900-1952::k15'],  // the Free Officers and the 23 July 1952 coup — the same event
  ['egypt-1952-today::k1', 'egypt-1900-1952::l6'],   // the Free Officers → Naguib, their figurehead president
  ['egypt-1952-today::k2', 'egypt-1900-1952::l6'],   // the Free Officers → Nasser, their leader and the single centre
  ['egypt-1952-today::k14', 'egypt-1900-1952::k13'], // Hasan al-Banna's Brotherhood → the Brotherhood as perennial opposition
  ['egypt-1952-today::b2', 'egypt-1900-1952::b2'],   // al-Banna's comprehensive Islam → the movement after the gallows
  ['egypt-1952-today::b1', 'egypt-1900-1952::b4'],   // al-Azhar between reform and the state → al-Azhar nationalised
  ['egypt-1952-today::b5', 'egypt-1900-1952::b5'],   // the Sufi orders and the mawlid in the modern city — continuous
  ['egypt-1952-today::b3', 'egypt-1900-1952::b3'],   // national unity and the Coptic question → the Church as a communal state
  ['egypt-1952-today::b7', 'egypt-1900-1952::b3'],   // the national-unity ideal → sectarian violence and the reconciliation formula
  ['egypt-1952-today::x1', 'egypt-1900-1952::x2'],   // Naguib Mahfouz and the realist novel → the Nobel Prize (same figure)
  ['egypt-1952-today::x2', 'egypt-1900-1952::x3'],   // Studio Misr and the Hollywood on the Nile → the nationalised studio and golden age
  ['egypt-1952-today::x3', 'egypt-1900-1952::x4'],   // Umm Kulthum and the radio → the era of the long song (same figure)
  ['egypt-1952-today::x5', 'egypt-1900-1952::x5'],   // the press at its height → from al-Ahram to media consolidation
  ['egypt-1952-today::t4', 'egypt-1900-1952::t3'],   // the feminist movement → feminism and the rights movement — continuous
  ['egypt-1952-today::t1', 'egypt-1900-1952::t2'],   // the identity debate (Pharaonism to Arabism) → Arab nationalism and its disillusion
  ['egypt-1952-today::o1', 'egypt-1900-1952::o2'],   // the 1923 constitution and the liberal experiment → the republic and its many constitutions
  ['egypt-1952-today::k16', 'egypt-1900-1952::o6'],  // the parties and the rigged election → the licensed opposition parties
  ['egypt-1952-today::e1', 'egypt-1900-1952::e4'],   // the land question → agrarian reform and its long undoing
  ['egypt-1952-today::e2', 'egypt-1900-1952::o5'],   // the interventionist state → nationalisation and the planned economy
  ['egypt-1952-today::g1', 'egypt-1900-1952::g1'],   // the Aswan Dam heightenings → building the High Dam
  ['egypt-1952-today::c3', 'egypt-1900-1952::c7'],   // the 1948 Palestine War → the Six-Day War and the loss of Sinai
  ['egypt-1952-today::xc2', 'egypt-1900-1952::xc3'], // the Palestine question → Camp David and the 1979 treaty
  ['egypt-1952-today::xc6', 'egypt-1900-1952::xc1'], // Egypt in the League and the Arab League → the Arab League seat and regional diplomacy
  ['egypt-1952-today::w1', 'egypt-1900-1952::w2'],   // the population problem → the population surge
  ['egypt-1952-today::w2', 'egypt-1900-1952::w1'],   // Cairo and the urban explosion → Cairo the megacity and the informal quarter
  ['egypt-1952-today::l2', 'egypt-1900-1952::l7'],   // the effendi and the fellah → the peasant after land reform
  ['egypt-1952-today::b3', 'egypt-300-641::b3'],     // the Coptic Orthodox Church — the same institution, 1400 years on
  // ── egypt-1900-1952 (Colonial Egypt and the Monarchy): hand-off from Muhammad Ali and the Khedivate ──
  ['egypt-1900-1952::k1', 'egypt-1798-1900::k8'],    // Abbas II Hilmi acceding → deposed on the Protectorate
  ['egypt-1900-1952::k5', 'egypt-1798-1900::k10'],   // the occupation and Cromer → the man in the Residency
  ['egypt-1900-1952::c1', 'egypt-1798-1900::l5'],    // Lord Cromer → his fall over the Denshawai reaction
  ['egypt-1900-1952::k11', 'egypt-1798-1900::b6'],   // religion, the state and national identity → Mustafa Kamil's nationalism
  ['egypt-1900-1952::o1', 'egypt-1798-1900::o6'],    // the Veiled Protectorate → the Protectorate and the reserved points
  ['egypt-1900-1952::xc5', 'egypt-1798-1900::xc5'],  // the Nile question → the Sudan question
  ['egypt-1900-1952::e1', 'egypt-1798-1900::e1'],    // the cotton monoculture → the cotton cycle and the Depression
  ['egypt-1900-1952::e4', 'egypt-1798-1900::o3'],    // private property in land → the land question
  ['egypt-1900-1952::e5', 'egypt-1798-1900::e7'],    // the fellah and the agrarian crisis → the condition of the fellah
  ['egypt-1900-1952::b1', 'egypt-1798-1900::b2'],    // al-Afghani and 'Abduh → Islamic modernism and its reaction
  ['egypt-1900-1952::b3', 'egypt-1798-1900::b3'],    // the Coptic reform movement → national unity and the Coptic question
  ['egypt-1900-1952::b6', 'egypt-1798-1900::xc3'],   // cosmopolitan Alexandria → the Jewish and foreign communities
  ['egypt-1900-1952::t1', 'egypt-1798-1900::t2'],    // the new schools → the Egyptian University
  ['egypt-1900-1952::t3', 'egypt-1798-1900::t5'],    // the woman question → the feminist movement
  ['egypt-1900-1952::t5', 'egypt-1798-1900::t4'],    // the survey of Egypt and Egyptology → the claim on the pharaohs
  ['egypt-1900-1952::x5', 'egypt-1798-1900::x2'],    // the Nahda and the new journalism → the press at its height
  // ── egypt-1798-1900 (Muhammad Ali and the Khedivate): hand-off from Ottoman Egypt ──
  ['egypt-1798-1900::k1', 'egypt-1517-1798::k11'],   // the French invasion → the struggle for power after it
  ['egypt-1798-1900::k1', 'egypt-1517-1798::k10'],   // Ibrahim Bey and Murad Bey → the beys Muhammad Ali displaces
  ['egypt-1798-1900::c1', 'egypt-1517-1798::c8'],    // the Pyramids and the Cairo revolt → the expulsion of the French
  ['egypt-1798-1900::c2', 'egypt-1517-1798::k5'],    // the Mamluk households return → their destruction at the Citadel
  ['egypt-1798-1900::o3', 'egypt-1517-1798::o2'],    // the iltizam tax-farm → the cadastre and private property
  ['egypt-1798-1900::b1', 'egypt-1517-1798::o4'],    // the ulama as the notables of Cairo → their decline under the state
  ['egypt-1798-1900::b2', 'egypt-1517-1798::b6'],    // the stirrings of reform → Islamic modernism
  ['egypt-1798-1900::b3', 'egypt-1517-1798::b4'],    // the Coptic Church under the Ottomans → the Coptic reform movement
  ['egypt-1798-1900::b4', 'egypt-1517-1798::b2'],    // the Sufi orders and the mawlids → brought under state control
  ['egypt-1798-1900::b5', 'egypt-1517-1798::b5'],    // the Jewish community of Ottoman Egypt → in the century of change
  ['egypt-1798-1900::x1', 'egypt-1517-1798::x5'],    // Cairo as a city of manuscripts → the coming of print
  ['egypt-1798-1900::x3', 'egypt-1517-1798::x1'],    // Ottoman-Cairene architecture → the rebuilding of Cairo
  ['egypt-1798-1900::t6', 'egypt-1517-1798::x3'],    // al-Jabarti's chronicle → 'Ali Mubarak's Khitat
  ['egypt-1798-1900::xc4', 'egypt-1517-1798::e2'],   // the transit trade and the Red Sea → the road to India
  ['egypt-1798-1900::xc1', 'egypt-1517-1798::xc6'],  // 1798 and the Eastern Question → the Suez Canal and the occupation
  // ── egypt-1517-1798 (Ottoman Egypt): hand-off from the Mamluk Sultanate ──
  ['egypt-1517-1798::k1', 'mamluks-1250-1517::k14'],   // al-Ghawri, Tuman Bay and the Ottoman conquest → Selim conquers Egypt
  ['egypt-1517-1798::c1', 'mamluks-1250-1517::c11'],   // Marj Dabiq
  ['egypt-1517-1798::c1', 'mamluks-1250-1517::c12'],   // al-Raydaniyya and the fall of Cairo
  ['egypt-1517-1798::k5', 'mamluks-1250-1517::k9'],    // Barquq's Circassian regime → the neo-Mamluk households return
  ['egypt-1517-1798::g3', 'mamluks-1250-1517::tc1'],   // the Mamluk resistance to firearms → and again under the Ottomans
  ['egypt-1517-1798::b1', 'mamluks-1250-1517::b1'],    // the twin capitals of Sunni learning → al-Azhar at its pre-eminence
  ['egypt-1517-1798::b2', 'mamluks-1250-1517::b3'],    // the tariqas and the age of the saint → the Sufi orders and the mawlids
  ['egypt-1517-1798::b4', 'mamluks-1250-1517::b6'],    // the Coptic church retreats to the monasteries → its Ottoman-era revival
  ['egypt-1517-1798::b5', 'mamluks-1250-1517::b7'],    // the Jewish communities and the nagidate → its lapse around 1517
  ['egypt-1517-1798::e2', 'mamluks-1250-1517::ec8'],   // the Portuguese and the collapse of the spice revenue → the transit trade after
  ['egypt-1517-1798::x1', 'mamluks-1250-1517::ex1'],   // the stone city of the Mamluks → Ottoman-Cairene architecture
  ['egypt-1517-1798::x4', 'mamluks-1250-1517::ex7'],   // shadow theatre and the coffee-house epic → carried into Ottoman Cairo
  ['egypt-1517-1798::o2', 'mamluks-1250-1517::ec7'],   // the rural crisis — iqta, Bedouin, shrinking cultivation → the iltizam
  ['egypt-1517-1798::w1', 'mamluks-1250-1517::w3'],    // Cairo, the greatest city west of China → still one of the largest
  // ── egypt-641-969 (Early Islamic Egypt): hand-offs both to Byzantine Egypt and to the Fatimids ──
  ['egypt-641-969::k1', 'egypt-300-641::k15'],    // the Arab conquest of Egypt → the conquest generation
  ['egypt-641-969::o1', 'egypt-300-641::k16'],    // 'Amr founds Fustat → the garrison city as capital
  ['egypt-641-969::k14', 'egypt-300-641::k13'],   // Benjamin I → the Coptic patriarchate under Islam
  ['egypt-641-969::o2', 'egypt-300-641::xc6'],    // the Arab settlement and the dhimma → the kharaj and jizya
  ['egypt-641-969::b6', 'egypt-300-641::b6'],     // the monastic desert → the monasteries endure and thin
  ['egypt-641-969::b7', 'egypt-300-641::xc2'],    // the conversion of Nubia → the Nile churches under the patriarch
  ['egypt-641-969::e5', 'egypt-300-641::w4'],     // plague, cooling and decline → the shrinking cultivated land
  ['egypt-641-969::b1', 'egypt-300-641::b3'],     // the Coptic Church → a still-Christian country
  ['egypt-641-969::k13', 'fatimids-909-1171::k3'],   // Jawhar founds Cairo → al-Muʿizz conquers Egypt and builds Cairo
  ['egypt-641-969::k13', 'fatimids-909-1171::c2'],   // Jawhar founds Cairo → Jawhar takes Egypt
  ['egypt-641-969::c8', 'fatimids-909-1171::c3'],    // the Qarmatian aftermath → the Qarmatians invade Egypt
  ['egypt-641-969::k12', 'fatimids-909-1171::c2'],   // the end of the Ikhshidids → Jawhar takes Egypt
  ['egypt-641-969::xc6', 'fatimids-909-1171::k3'],   // the Fatimid daʿwa reaches Egypt → al-Muʿizz conquers Egypt
  ['egypt-641-969::g3', 'fatimids-909-1171::e4'],    // lustre, tin-glaze and the loom → Fatimid lustre, wood and tiraz
  ['egypt-641-969::xc4', 'fatimids-909-1171::ec1'],  // the Red Sea revival begins → the India trade moves to the Red Sea
  ['egypt-641-969::b5', 'fatimids-909-1171::b8'],    // the Jewish communities of Fustat → their Fatimid-era continuation
  ['egypt-641-969::k14', 'fatimids-909-1171::o5'],   // the Coptic patriarchate → the dhimma under the Fatimids
  // ── egypt-300-641 (Byzantine and Christian Egypt): hand-off from Roman Egypt ──
  ['egypt-300-641::k1', 'egypt-30bc-300ad::b6'],    // the persecutions and Era of the Martyrs → Constantine's Christian turn
  ['egypt-300-641::e1', 'egypt-30bc-300ad::e1'],    // the grain of Rome → the grain of Constantinople
  ['egypt-300-641::b1', 'egypt-30bc-300ad::b1'],    // the temples under Rome → the end of the temples
  ['egypt-300-641::b2', 'egypt-30bc-300ad::b4'],    // the Catechetical School → the Arian and Christological wars
  ['egypt-300-641::b4', 'egypt-30bc-300ad::l6'],    // Antony withdraws to the desert → the birth of the desert life
  ['egypt-300-641::t1', 'egypt-30bc-300ad::t5'],    // Neoplatonism's Alexandrian roots → the last philosophers of Alexandria
  ['egypt-300-641::t3', 'egypt-30bc-300ad::t2'],    // Alexandria the school of the doctors → the Alexandrian curriculum
  ['egypt-300-641::x1', 'egypt-30bc-300ad::x5'],    // the making of Coptic → literary Coptic and the monastic library
  ['egypt-300-641::o2', 'egypt-30bc-300ad::e2'],    // the surveyed land and imperial estates → the great estate
  ['egypt-300-641::xc1', 'egypt-30bc-300ad::xc1'],  // the India trade at its height → the Red Sea trade in decline
  ['egypt-300-641::xc2', 'egypt-30bc-300ad::xc4'],  // the peaceful frontier with Meroe → the conversion of Nubia
  ['egypt-300-641::c1', 'egypt-30bc-300ad::b2'],    // Isis conquers the empire → the destruction of the Serapeum
  // ── egypt-30bc-300ad (Roman Egypt): hand-off from Ptolemaic Egypt ──
  ['egypt-30bc-300ad::k1', 'egypt-332bc-30bc::c9'],   // Actium and the annexation → the Augustan settlement
  ['egypt-30bc-300ad::c1', 'egypt-332bc-30bc::xc4'],  // Meroe and the shared frontier → the war with Meroe
  ['egypt-30bc-300ad::e1', 'egypt-332bc-30bc::e3'],   // grain and the fleet → the grain of Rome
  ['egypt-30bc-300ad::o1', 'egypt-332bc-30bc::o7'],   // Rome the overlord → the emperor's closed province
  ['egypt-30bc-300ad::b1', 'egypt-332bc-30bc::b2'],   // the Ptolemaic temple programme → the temples under Rome
  ['egypt-30bc-300ad::b2', 'egypt-332bc-30bc::b3'],   // Isis becomes universal → Isis conquers the empire
  ['egypt-30bc-300ad::t4', 'egypt-332bc-30bc::t1'],   // the Museum and Library → the Museum after its golden age
  ['egypt-30bc-300ad::xc1', 'egypt-332bc-30bc::xc1'], // the Indian Ocean route opens → the India trade at its height
  ['egypt-30bc-300ad::xc6', 'egypt-332bc-30bc::xc3'], // the Septuagint community → the end of Egyptian Jewry
  ['egypt-30bc-300ad::o3', 'egypt-332bc-30bc::xc6'],  // Greeks and Egyptians blend → Rome re-freezes the ethnic grades
  ['egypt-30bc-300ad::e4', 'egypt-332bc-30bc::e4'],   // the closed currency and the banks → the closed tetradrachm's collapse
  ['egypt-30bc-300ad::t3', 'egypt-332bc-30bc::t7'],   // Egyptian temple learning → the birth of alchemy
  // ── egypt-332bc-30bc (Ptolemaic Egypt): hand-off from The Late Period ──
  ['egypt-332bc-30bc::k1', 'egypt-664bc-332bc::k16'],   // the Second Persian Period → Alexander takes Egypt
  ['egypt-332bc-30bc::k1', 'egypt-664bc-332bc::l6'],    // Somtutefnakht outlives the conquest to serve Alexander
  ['egypt-332bc-30bc::b1', 'egypt-664bc-332bc::b3'],    // the Apis and the Serapeum → Serapis
  ['egypt-332bc-30bc::b2', 'egypt-664bc-332bc::x3'],    // the last native temples → the Ptolemaic temple programme
  ['egypt-332bc-30bc::t7', 'egypt-664bc-332bc::t2'],    // the House of Life → Egyptian temple learning and Manetho
  ['egypt-332bc-30bc::o2', 'egypt-664bc-332bc::o4'],    // the Persian satrapy's extractive apparatus → the dioiketes
  ['egypt-332bc-30bc::xc3', 'egypt-664bc-332bc::xc4'],  // the Jews of Elephantine → the Jews of Egypt and the Septuagint
  ['egypt-332bc-30bc::w3', 'egypt-664bc-332bc::w4'],    // Kush turns to Meroe → Meroe at its height
  ['egypt-332bc-30bc::xc6', 'egypt-664bc-332bc::xc1'],  // the Greeks settle in → Greeks and Egyptians blend
  ['egypt-332bc-30bc::e6', 'egypt-664bc-332bc::e2'],    // the Nile–Red Sea canal → the Red Sea ports
  ['egypt-332bc-30bc::o5', 'egypt-664bc-332bc::o7'],    // the decree stelae of the last native kings → the priestly synods
  ['egypt-332bc-30bc::b6', 'egypt-664bc-332bc::x5'],    // Demotic literature and the Chronicle → the Oracle of the Potter
  // ── egypt-664bc-332bc (The Late Period): hand-off from Priests, Libyans and Kushites ──
  ['egypt-664bc-332bc::k1', 'egypt-1200bc-664bc::k20'],   // Tantamani and the sack of Thebes → Psamtik I takes over
  ['egypt-664bc-332bc::k1', 'egypt-1200bc-664bc::xc6'],   // the Ionians and Carians appear → the 'bronze men' who serve Psamtik I
  ['egypt-664bc-332bc::c1', 'egypt-1200bc-664bc::k15'],   // the God's Wife rules the south → the Nitocris adoption secures Thebes
  ['egypt-664bc-332bc::c1', 'egypt-1200bc-664bc::l4'],    // Montuemhat, lord of Thebes → the handover to the Saites
  ['egypt-664bc-332bc::b1', 'egypt-1200bc-664bc::x5'],    // the archaising turn → the Saite renaissance of art and religion
  ['egypt-664bc-332bc::b3', 'egypt-1200bc-664bc::b3'],    // the sacred animals move to centre stage → the Apis and the Serapeum
  ['egypt-664bc-332bc::e1', 'egypt-1200bc-664bc::xc6'],   // Greeks and Carians on the coast → the trade port of Naukratis
  ['egypt-664bc-332bc::t2', 'egypt-1200bc-664bc::t1'],    // the temple as archive and House of Life → the priestly sciences
  ['egypt-664bc-332bc::w4', 'egypt-1200bc-664bc::w4'],    // the rise of Kush at Napata → Kush turns to Meroe
  ['egypt-664bc-332bc::c4', 'egypt-1200bc-664bc::b4'],    // the Kushite revival of Amun → Psamtik II's raid pushes Kush south
  ['egypt-664bc-332bc::c3', 'egypt-1200bc-664bc::xc3'],   // Egypt among the Levantine kingdoms → Carchemish ends that role
  // ── egypt-1200bc-664bc (Priests, Libyans and Kushites): hand-off from The New Kingdom folio ──
  ['egypt-1200bc-664bc::k1', 'egypt-1550bc-1200bc::k19'],   // the disputed end of Dyn 19 → Setnakhte restores order
  ['egypt-1200bc-664bc::c1', 'egypt-1550bc-1200bc::w4'],    // the Sea Peoples appear → Ramesses III repels them
  ['egypt-1200bc-664bc::w1', 'egypt-1550bc-1200bc::w5'],    // the drying Mediterranean → the Bronze Age collapse
  ['egypt-1200bc-664bc::w1', 'egypt-1550bc-1200bc::w3'],    // the club of great powers → its systemic collapse
  ['egypt-1200bc-664bc::o2', 'egypt-1550bc-1200bc::b1'],    // the empire of Amun → the High Priesthood as a state
  ['egypt-1200bc-664bc::e3', 'egypt-1550bc-1200bc::e2'],    // the rise of the temple estates → the temple as landlord
  ['egypt-1200bc-664bc::o5', 'egypt-1550bc-1200bc::b5'],    // the hidden royal tombs → the tomb-robbery commissions
  ['egypt-1200bc-664bc::o6', 'egypt-1550bc-1200bc::o4'],    // Deir el-Medina → its abandonment and the reburials
  ['egypt-1200bc-664bc::b2', 'egypt-1550bc-1200bc::b4'],    // the Book of the Dead → the portable afterlife
  ['egypt-1200bc-664bc::e4', 'egypt-1550bc-1200bc::e1'],    // Nubian gold and tribute → the loss of that income
  ['egypt-1200bc-664bc::b4', 'egypt-1550bc-1200bc::c2'],    // Egypt conquers and Egyptianises Kush → Kush takes Egypt
  ['egypt-1200bc-664bc::x1', 'egypt-1550bc-1200bc::x1'],    // the temple at imperial scale → Medinet Habu, the last of them
  ['egypt-1200bc-664bc::x2', 'egypt-2100bc-1550bc::xc1'],   // Byblos the Egyptianising city → Wenamun's humbling at Byblos
  // ── egypt-1550bc-1200bc (The New Kingdom): hand-off from the Middle Kingdom & Hyksos folio ──
  ['egypt-1550bc-1200bc::k1', 'egypt-2100bc-1550bc::k18'],   // Ahmose completes the expulsion Kamose began
  ['egypt-1550bc-1200bc::c1', 'egypt-2100bc-1550bc::c6'],    // the Theban war of liberation — its final act
  ['egypt-1550bc-1200bc::c2', 'egypt-2100bc-1550bc::w3'],    // Egypt conquers the Kerma kingdom of Kush
  ['egypt-1550bc-1200bc::o1', 'egypt-2100bc-1550bc::c3'],    // the MK Semna frontier → the NK viceroyalty of Kush
  ['egypt-1550bc-1200bc::b1', 'egypt-2100bc-1550bc::b3'],    // Amun of Thebes rises → the empire of Amun
  ['egypt-1550bc-1200bc::b4', 'egypt-2100bc-1550bc::b2'],    // Coffin Texts → the Book of the Dead
  ['egypt-1550bc-1200bc::b5', 'egypt-2100bc-1550bc::b5'],    // the MK pyramid → the hidden Valley of the Kings tomb
  ['egypt-1550bc-1200bc::e1', 'egypt-2100bc-1550bc::e2'],    // Nubian gold and the Wadi Allaqi road, now the empire's reserve
  ['egypt-1550bc-1200bc::g1', 'egypt-2100bc-1550bc::g6'],    // the chariot arrives with the Hyksos → the chariot workshop
  ['egypt-1550bc-1200bc::g5', 'egypt-2100bc-1550bc::g3'],    // hauling Djehutihotep's colossus → moving the obelisks
  ['egypt-1550bc-1200bc::xc4', 'egypt-2100bc-1550bc::xc2'],  // Punt from Saww → Hatshepsut's Punt expedition
  // ── egypt-2100bc-1550bc (Middle Kingdom & the Hyksos): hand-off from the Old Kingdom folio ──
  ['egypt-2100bc-1550bc::k1', 'egypt-3000bc-2100bc::k15'],  // Mentuhotep II completes the reunification Intef II began
  ['egypt-2100bc-1550bc::c1', 'egypt-3000bc-2100bc::c7'],   // Intef II's campaigns vs Herakleopolis → Mentuhotep II's victory
  ['egypt-2100bc-1550bc::c1', 'egypt-3000bc-2100bc::c6'],   // the FIP civil war → its resolution
  ['egypt-2100bc-1550bc::c1', 'egypt-3000bc-2100bc::w3'],   // the collapse-and-reunification cycle
  ['egypt-2100bc-1550bc::c6', 'egypt-3000bc-2100bc::c6'],   // Thebes as reunifier — again, against the Hyksos
  ['egypt-2100bc-1550bc::b1', 'egypt-3000bc-2100bc::b5'],   // Abydos becomes the Osiris centre → the Osiris mysteries
  ['egypt-2100bc-1550bc::b3', 'egypt-3000bc-2100bc::b7'],   // Monthu of Thebes rises → Amun of Thebes rises to national god
  ['egypt-2100bc-1550bc::e4', 'egypt-3000bc-2100bc::ec4'],  // state turquoise/copper mining in Sinai → the MK expedition system
  ['egypt-2100bc-1550bc::o1', 'egypt-3000bc-2100bc::o1'],   // the nome system → the rebuilt central state at Itjtawy
  ['egypt-2100bc-1550bc::o3', 'egypt-3000bc-2100bc::o6'],   // nomarch offices become hereditary → Senwosret III curbs them
  // ── Dilmun: Bronze Age → Late Dilmun ──
  ['dilmun-3000bc-1200bc::k4', 'dilmun-1200bc-600bc::o1'],   // Kassite governor → the kingship revived
  ['dilmun-3000bc-1200bc::ec6', 'dilmun-1200bc-600bc::ec1'], // entrepôt collapses → the tribute economy
  ['dilmun-3000bc-1200bc::b1', 'dilmun-1200bc-600bc::b1'],   // Inzak, gods of Dilmun → Inzak endures
  ['dilmun-3000bc-1200bc::b3', 'dilmun-1200bc-600bc::b2'],   // serpent burials → snake-bowl deposits continue
  ['dilmun-3000bc-1200bc::w3', 'dilmun-1200bc-600bc::o1'],   // Kassite Babylon absorbs Dilmun → local kingship re-forms
  ['dilmun-3000bc-1200bc::x1', 'magan-3000bc-1200bc::x1'],   // the Dilmun–Magan–Meluhha triangle (both sides)
  // ── Magan: Bronze Age → Iron Age / Maka ──
  ['magan-3000bc-1200bc::k4', 'magan-1200bc-300bc::k5'],     // Wadi Suq reorganisation → Iron Age settlement boom
  ['magan-3000bc-1200bc::tc4', 'magan-1200bc-300bc::tc1'],   // tin bronze → iron working reaches the peninsula
  ['magan-3000bc-1200bc::b2', 'magan-1200bc-300bc::b3'],     // carved serpents on tombs → the Iron Age snake shrines
  ['magan-3000bc-1200bc::t3', 'magan-1200bc-300bc::t2'],     // a world at the edge of literacy → the oral order under Persia
  ['magan-3000bc-1200bc::ec6', 'magan-1200bc-300bc::k5'],    // the aridity/Wadi Suq shift → the Iron Age recovery
  // ── Beth Qatraye: Late Antique → First Islamic Century ──
  ['beth-qatraye-240-632::k1', 'beth-qatraye-632-750::w3'],  // Sasanian province → the Arab conquest ends it
  ['beth-qatraye-240-632::c3', 'beth-qatraye-632-750::w3'],  // the empires exhaust themselves → the conquest
  ['beth-qatraye-240-632::b2', 'beth-qatraye-632-750::b2'],  // the bishoprics founded → the twilight of Gulf Christianity
  ['beth-qatraye-240-632::b3', 'beth-qatraye-632-750::e1'],  // the Gulf monasteries → the last phase at Al-Qusur
  ['beth-qatraye-240-632::t1', 'beth-qatraye-632-750::t3'],  // the Syriac school comes to the Gulf → the cluster of scholars
  ['beth-qatraye-240-632::t2', 'beth-qatraye-632-750::t2'],  // Gabriel of Qatar → Abraham bar Lipeh (who depends on him)
  ['beth-qatraye-240-632::k3', 'beth-qatraye-632-750::c2'],  // al-Mundhir accepts Islam → the Ridda war after his death
  ['beth-qatraye-240-632::k4', 'beth-qatraye-632-750::c3'],  // Jayfar & Abd bring Oman into Islam → the Battle of Dibba
  ['beth-qatraye-240-632::o4', 'beth-qatraye-632-750::lv4'], // the Prophet's letter / dhimma → becoming dhimmi
  ['beth-qatraye-240-632::b5', 'beth-qatraye-632-750::lv4'], // Jewish communities → becoming dhimmi
  ['beth-qatraye-240-632::ec1', 'beth-qatraye-632-750::ec1'],// the Sasanian trade artery → the trade under the caliphate
  ['beth-qatraye-240-632::ec3', 'beth-qatraye-632-750::ec3'],// pearl fishery under Persia → pearls as caliphal revenue
  ['beth-qatraye-240-632::e3', 'beth-qatraye-632-750::ec2'], // the Sasanian torpedo jar → the Sasanian–Islamic ceramic continuum
  ['beth-qatraye-240-632::tc1', 'beth-qatraye-632-750::tc1'],// Sasanian deep-water shipping → the sewn boat under new management
  ['beth-qatraye-632-750::b1', 'eastern-arabia-750-1200::k2'],// the Ibadi da'wa reaches Oman → the Imamate restored at Nizwa
  ['beth-qatraye-632-750::c4', 'eastern-arabia-750-1200::k2'],// the first imamate crushed → the imamate rebuilt a generation later
  // ── Trucial Gulf: Maritime Truce century → Pearl-bust-to-independence ──
  ['trucial-gulf-1820-1900::k1', 'trucial-gulf-1900-1971::k1'],   // the Political Resident → the Residency's last half-century
  ['trucial-gulf-1820-1900::o1', 'trucial-gulf-1900-1971::o2'],   // the treaty ladder → the Qatar treaty completes the system
  ['trucial-gulf-1820-1900::k6', 'trucial-gulf-1900-1971::k5'],   // the Al Thani recognised → Qatar enters the British system
  ['trucial-gulf-1820-1900::c4', 'trucial-gulf-1900-1971::k5'],   // the Ottoman occupation → the garrison leaves, Qatar joins the system
  ['trucial-gulf-1820-1900::ec1', 'trucial-gulf-1900-1971::ec1'], // the 19th-century pearl trade → the pearling golden age
  ['trucial-gulf-1820-1900::ec1', 'trucial-gulf-1900-1971::ec2'], // the pearl trade → the pearl crash
  ['trucial-gulf-1820-1900::lv1', 'trucial-gulf-1900-1971::lv1'], // the diver and the debt bond → the years of hunger
  ['trucial-gulf-1820-1900::lv2', 'trucial-gulf-1900-1971::lv2'], // the enslaved on the pearl banks → manumission and the long end of slavery
  ['trucial-gulf-1820-1900::o3', 'trucial-gulf-1900-1971::lv2'],  // the anti-slave-trade engagements → the long end of Gulf slavery
  ['trucial-gulf-1820-1900::x1', 'trucial-gulf-1900-1971::x1'],   // the Gulf run from India → from the India Office to the Foreign Office
  ['trucial-gulf-1820-1900::x2', 'trucial-gulf-1900-1971::x2'],   // merchants across the water → the Lingeh merchants and the Ajam
  ['trucial-gulf-1820-1900::lv4', 'trucial-gulf-1900-1971::x2'],  // the Ajam and the Hawala → the Lingeh merchants and the Ajam
  ['trucial-gulf-1820-1900::e1', 'trucial-gulf-1900-1971::e1'],   // the wind-tower house → the wind-tower house at its peak and end
  ['trucial-gulf-1820-1900::t1', 'trucial-gulf-1900-1971::t1'],   // the Persian Gulf charted → Lorimer's Gazetteer
  ['trucial-gulf-1820-1900::t3', 'trucial-gulf-1900-1971::t1'],   // tribal genealogy and the oral chronicle → Lorimer's Gazetteer
  ['trucial-gulf-1820-1900::w1', 'trucial-gulf-1900-1971::w2'],   // keeping the rivals out → Persian oil and the Royal Navy's fuel
];

// ── Aggregate into per-entry target sets (bidirectional, deduped) ────────────
const xlinksToAdd = new Map(); // "folio::id" -> Set of "folio::id"
for (const [a, b] of SELECTED_PAIRS) {
  if (!xlinksToAdd.has(a)) xlinksToAdd.set(a, new Set());
  if (!xlinksToAdd.has(b)) xlinksToAdd.set(b, new Set());
  xlinksToAdd.get(a).add(b);
  xlinksToAdd.get(b).add(a);
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Same string-state-tracking close-brace finder as build-keywords.js.
function findEntryClose(text, fromIndex) {
  let inString = false, esc = false;
  for (let i = fromIndex; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '}') return i;
  }
  return -1;
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && !f.startsWith('_') && f !== 'schema.json').sort();

let entriesUpdated = 0, alreadyPresent = 0, errors = 0;

for (const file of files) {
  const folioId = file.replace(/\.json$/, '');
  let text = fs.readFileSync(path.join(DIR, file), 'utf8');
  const data = JSON.parse(text);
  let fileChanged = false;

  for (const cat of data.categories || []) {
    for (const e of cat.entries || []) {
      const key = `${folioId}::${e.id}`;
      if (!xlinksToAdd.has(key)) continue;

      const existing = new Set(e.xlinks || []);
      const targets = [...xlinksToAdd.get(key)].sort();
      const merged = [...new Set([...existing, ...targets])].sort();
      if (existing.size === merged.length && targets.every(t => existing.has(t))) {
        alreadyPresent++;
        continue;
      }

      const idRe = new RegExp('"id"\\s*:\\s*"' + escapeRegex(e.id) + '"');
      const m = idRe.exec(text);
      if (!m) { console.error(`WARN: could not locate id "${e.id}" in ${file}`); errors++; continue; }
      const closeIdx = findEntryClose(text, m.index);
      if (closeIdx === -1) { console.error(`WARN: no closing brace for "${e.id}" in ${file}`); errors++; continue; }

      const span = text.slice(m.index, closeIdx);
      const multiline = span.includes('\n');
      const xlinksJson = JSON.stringify(merged);

      let prevEnd = closeIdx;
      while (prevEnd > m.index && /\s/.test(text[prevEnd - 1])) prevEnd--;

      // If xlinks already exists, we need to replace the old field instead of inserting
      // a new one — find and remove the old "xlinks": [...] span first.
      let insertion;
      if (e.xlinks) {
        const xlRe = /"xlinks"\s*:\s*\[[^\]]*\]/;
        const window = text.slice(m.index, closeIdx);
        const xlMatch = xlRe.exec(window);
        if (xlMatch) {
          const absStart = m.index + xlMatch.index;
          const absEnd = absStart + xlMatch[0].length;
          text = text.slice(0, absStart) + `"xlinks": ${xlinksJson}` + text.slice(absEnd);
          fileChanged = true;
          entriesUpdated++;
          continue;
        }
      }

      if (multiline) {
        const lineStart = text.lastIndexOf('\n', closeIdx) + 1;
        const braceIndent = text.slice(lineStart, closeIdx).match(/^\s*/)[0];
        insertion = ',\n' + braceIndent + '  "xlinks": ' + xlinksJson;
      } else {
        insertion = ',"xlinks":' + xlinksJson;
      }
      text = text.slice(0, prevEnd) + insertion + text.slice(prevEnd);
      fileChanged = true;
      entriesUpdated++;
    }
  }

  if (fileChanged) {
    JSON.parse(text); // safety check before writing
    fs.writeFileSync(path.join(DIR, file), text, 'utf8');
    console.log('updated', file);
  }
}

console.log('---');
console.log(`${entriesUpdated} entries updated, ${alreadyPresent} already had these xlinks, ${errors} error(s)`);
if (errors > 0) process.exit(1);
