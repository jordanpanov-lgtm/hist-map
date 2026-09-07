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
