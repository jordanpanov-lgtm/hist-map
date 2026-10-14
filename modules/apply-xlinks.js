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
  // ── iraq-2003-today (Iraq after Saddam) ──
  // hand-off backward from Saddam's Iraq:
  ['iraq-2003-today::k1', 'iraq-1979-2003::c6'],      // the 2003 invasion -> the occupation and the CPA
  ['iraq-2003-today::k1', 'iraq-1979-2003::w4'],      // 2003 — the fall as a beginning -> de-Ba'thification and the dissolved army
  ['iraq-2003-today::k4', 'iraq-1979-2003::b3'],      // sectarian consciousness sharpened -> ISIS from the Sunni exclusion
  ['iraq-2003-today::k7', 'iraq-1979-2003::k6'],      // SCIRI and Badr in Tehran -> the Iran-backed militias and the PMF
  ['iraq-2003-today::k6', 'iraq-1979-2003::l3'],      // Muhammad Sadiq al-Sadr -> Muqtada inherits the movement
  ['iraq-2003-today::k8', 'iraq-1979-2003::k7'],      // the Kurdish safe haven -> the Kurdistan Region
  ['iraq-2003-today::c2', 'iraq-1979-2003::o5'],      // the re-tribalisation -> a militia-ready society and the civil war
  ['iraq-2003-today::o5', 'iraq-1979-2003::b2'],      // the Shia clergy under the regime -> Sistani the decisive arbiter
  ['iraq-2003-today::l2', 'iraq-1979-2003::b2'],      // the marjaʿiyya nearly extinguished -> Ali al-Sistani
  ['iraq-2003-today::b4', 'iraq-1979-2003::b4'],      // the exile and the diaspora -> the minorities' catastrophe
  ['iraq-2003-today::b1', 'iraq-1979-2003::b1'],      // religion from above and below -> the shrine cities revived
  ['iraq-2003-today::o4', 'iraq-1979-2003::o3'],      // the command economy of scarcity -> the oil-rentier state at maximum
  ['iraq-2003-today::e3', 'iraq-1979-2003::c5'],      // the draining of the marshes -> the water and climate emergency
  ['iraq-2003-today::e3', 'iraq-1979-2003::e5'],      // the wrecked resource base -> the water catastrophe continued
  ['iraq-2003-today::e4', 'iraq-1979-2003::e4'],      // Oil-for-Food -> the corruption economy institutionalised
  ['iraq-2003-today::w1', 'iraq-1979-2003::w1'],      // the self-inflicted catastrophe -> the twenty-year war and its cost
  ['iraq-2003-today::w2', 'iraq-1979-2003::w3'],      // the unmaking of Iraqi society -> the failed state that held
  ['iraq-2003-today::w3', 'iraq-1979-2003::xc1'],     // the Iran war and the world's tilt -> the strategic reversal of 2003
  ['iraq-2003-today::x2', 'iraq-1979-2003::x3'],      // the looting and rebuilding of heritage -> ISIS and the reconstruction
  ['iraq-2003-today::x1', 'iraq-1979-2003::x1'],      // the literature of war and exile -> the Iraqi novel comes into its own
  ['iraq-2003-today::t1', 'iraq-1979-2003::t1'],      // the making of the case against Iraq -> the debate over what went wrong
  ['iraq-2003-today::t4', 'iraq-1979-2003::t4'],      // documenting the crimes -> documenting the atrocities
  ['iraq-2003-today::c4', 'iraq-1979-2003::c2'],      // the Anfal -> the Yazidi genocide at Sinjar
  ['iraq-2003-today::b3', 'iraq-1979-2003::b3'],      // sectarian consciousness sharpened -> the Sunni Arabs' predicament
  ['iraq-2003-today::o3', 'iraq-1979-2003::o2'],      // the security state -> the fragmented monopoly of force
  ['iraq-2003-today::l4', 'iraq-1979-2003::l5'],      // the child of the sanctions -> the Tishreen protester
  ['iraq-2003-today::x5', 'iraq-1979-2003::x2'],      // the monumental Baghdad of Saddam -> the memory wars
  // lateral to Egypt 1952–today (the parallel Arab upheaval and counter-revolution):
  ['iraq-2003-today::k5', 'egypt-1952-today::k15'],   // the protest generation — Tishreen and Kefaya / 6 April
  ['iraq-2003-today::c5', 'egypt-1952-today::c8'],    // the 25 January Revolution and the Tishreen uprising
  ['iraq-2003-today::t2', 'egypt-1952-today::x6'],    // the 2011 generation — graffiti, satire and the demand for a civil state
  ['iraq-2003-today::o4', 'egypt-1952-today::e7'],    // the state and the economy — the rentier and the debt-and-megaproject models
  ['iraq-2003-today::x4', 'egypt-1952-today::x5'],    // the media explosion and its consolidation
  ['iraq-2003-today::w2', 'egypt-1952-today::k6'],    // the state reasserting itself — el-Sisi's officers' state
  ['iraq-2003-today::b1', 'egypt-1952-today::b4'],    // the Islamic revival
  ['iraq-2003-today::xc4', 'egypt-1952-today::w4'],   // the diaspora
  // lateral to the Saudi state (the regional order and the Iran contest):
  ['iraq-2003-today::xc1', 'saudi-1902-today::x4'],   // the duel with revolutionary Iran
  ['iraq-2003-today::xc2', 'saudi-1902-today::x6'],   // the MBS foreign policy and the Baghdad mediation
  ['iraq-2003-today::k7', 'saudi-1902-today::x5'],    // the Gulf War and its blowback — the militias born of the wars
  ['iraq-2003-today::e1', 'saudi-1902-today::ec4'],   // two oil states and the rentier social contract
  ['iraq-2003-today::b2', 'saudi-1902-today::b3'],    // the sect question across the Gulf
  // deep-time links — the shrine cities, the marjaiyya, the rivers:
  ['iraq-2003-today::b1', 'iraq-1258-1534::w4'],      // Najaf and Karbala — the surviving Iraq, then and now
  ['iraq-2003-today::o5', 'iraq-1831-1914::b2'],      // the marjaiyya's political power — the Tobacco Protest and the 2019 fatwa
  ['iraq-2003-today::e3', 'iraq-945-1258::g1'],       // the fragility of a hydraulic society, the lesson repeated
  ['iraq-2003-today::w4', 'iraq-1914-1958::w1'],      // the invented state — a century on, the same unresolved questions
  // ── iraq-1979-2003 (Saddam's Iraq) ──
  // hand-off backward from The Iraqi Republic:
  ['iraq-1979-2003::k1', 'iraq-1958-1979::w3'],       // the making of Saddam's Iraq -> Saddam absolute
  ['iraq-1979-2003::k1', 'iraq-1958-1979::k5'],       // Saddam's rise from the deputy's chair -> to total power
  ['iraq-1979-2003::k2', 'iraq-1958-1979::xc5'],      // 1979 — the Iranian Revolution -> the invasion of 1980
  ['iraq-1979-2003::c2', 'iraq-1958-1979::o6'],       // the Arabisation of the north -> the Anfal genocide
  ['iraq-1979-2003::k7', 'iraq-1958-1979::k7'],       // the Kurdish movement, the 1970 deal and Algiers -> the safe haven and the KRG
  ['iraq-1979-2003::c4', 'iraq-1958-1979::c6'],       // the 1977 Safar Intifada -> the crushed Sha'ban Intifada of 1991
  ['iraq-1979-2003::o2', 'iraq-1958-1979::o3'],       // the security state -> the security state at war
  ['iraq-1979-2003::o1', 'iraq-1958-1979::o2'],       // the Ba'th and the RCC -> total personal rule
  ['iraq-1979-2003::e1', 'iraq-1958-1979::e5'],       // the arms economy and the militarisation -> the war economy and the debt
  ['iraq-1979-2003::e3', 'iraq-1958-1979::w2'],       // the oil decade -> the sanctions collapse
  ['iraq-1979-2003::g1', 'iraq-1958-1979::g3'],       // the start of the WMD ambition -> the programmes and their dismantlement
  ['iraq-1979-2003::b2', 'iraq-1958-1979::b2'],       // the Shia Islamic movement rises -> the clergy under the regime
  ['iraq-1979-2003::k6', 'iraq-1958-1979::l2'],       // Muhammad Baqir al-Sadr -> the movement in exile and at home
  ['iraq-1979-2003::o4', 'iraq-1958-1979::b1'],       // Ba'thism as the state creed -> the Faith Campaign that replaced it
  ['iraq-1979-2003::o5', 'iraq-1958-1979::o1'],       // the land reform broke the tribes -> the re-tribalisation restored them
  ['iraq-1979-2003::b3', 'iraq-1958-1979::b4'],       // the minorities under the Ba'th -> sectarian consciousness sharpened
  ['iraq-1979-2003::x2', 'iraq-1958-1979::x2'],       // modern Iraqi art under the state -> the monumental Baghdad of Saddam
  ['iraq-1979-2003::x3', 'iraq-1958-1979::x3'],       // the state claims the ancient past -> the rebuilding of Babylon and the museum loot
  ['iraq-1979-2003::x1', 'iraq-1958-1979::x1'],       // the poets of the republic and exile -> the literature of war and exile
  ['iraq-1979-2003::b4', 'iraq-1958-1979::b3'],       // the suppression of the left -> the exile and the diaspora
  ['iraq-1979-2003::w1', 'iraq-1958-1979::w1'],       // the revolution devours itself -> the self-inflicted catastrophe
  ['iraq-1979-2003::o3', 'iraq-1958-1979::e4'],       // the state economy and its distortions -> the command economy of scarcity
  ['iraq-1979-2003::xc1', 'iraq-1958-1979::xc1'],     // Iraq and the Soviet tie -> the Iran war and the world's tilt
  ['iraq-1979-2003::xc3', 'iraq-1958-1979::xc2'],     // Iraq, OPEC and the oil weapon -> the oil leverage lost under sanctions
  ['iraq-1979-2003::t3', 'iraq-1958-1979::t1'],       // al-Sadr's political economy -> the Shia thought worked out in exile
  ['iraq-1979-2003::l1', 'iraq-1958-1979::l5'],       // Saddam Hussein to 1979 -> and after
  ['iraq-1979-2003::c5', 'iraq-1958-1979::g2'],       // the dams and the water projects -> the marshes drained as a weapon
  ['iraq-1979-2003::w2', 'iraq-1958-1979::w4'],       // on the edge of the abyss -> three wars and a genocide
  // lateral to Egypt 1952–today (the parallel Arab republic that diverged):
  ['iraq-1979-2003::o1', 'egypt-1952-today::k4'],     // the entrenched autocrat — Saddam and Mubarak
  ['iraq-1979-2003::o2', 'egypt-1952-today::k12'],    // the Mukhabarat and the Ministry of the Interior
  ['iraq-1979-2003::o4', 'egypt-1952-today::b4'],     // the state and the Islamic revival
  ['iraq-1979-2003::k2', 'egypt-1952-today::xc2'],    // 1979 — Egypt makes peace at Camp David, Iraq starts a war
  ['iraq-1979-2003::b4', 'egypt-1952-today::xc4'],    // Egyptians in Iraq — the labour migration of the war years
  ['iraq-1979-2003::b3', 'egypt-1952-today::b7'],     // sectarian violence and the 'national unity' formula
  ['iraq-1979-2003::l4', 'egypt-1952-today::l3'],     // the migrant's family
  ['iraq-1979-2003::x1', 'egypt-1952-today::x1'],     // Arabic letters under the republics — Mahfouz and the Iraqi war-and-exile writers
  ['iraq-1979-2003::xc1', 'egypt-1952-today::xc3'],   // the American embrace, then the rupture
  // lateral to the Saudi state (the Gulf War, the Arab Cold War, the 1979 hinge):
  ['iraq-1979-2003::k3', 'saudi-1902-today::x5'],     // the Gulf War and its blowback
  ['iraq-1979-2003::e1', 'saudi-1902-today::ec3'],    // the Gulf oil money that funded the Iran war
  ['iraq-1979-2003::xc1', 'saudi-1902-today::x4'],    // the duel with revolutionary Iran
  ['iraq-1979-2003::o4', 'saudi-1902-today::b2'],     // 1979 and the Islamisation of the state
  // ── iraq-1958-1979 (The Iraqi Republic) ──
  // hand-off backward from the Mandate and the Hashemite Kingdom:
  ['iraq-1958-1979::k1', 'iraq-1914-1958::k8'],       // the 14 July Revolution -> Qasim and the sole leader
  ['iraq-1958-1979::o1', 'iraq-1914-1958::o4'],       // the land regime and the making of the sheikhs -> the land reform that broke them
  ['iraq-1958-1979::e3', 'iraq-1914-1958::e2'],       // the land question and rural misery -> the countryside emptied
  ['iraq-1958-1979::o3', 'iraq-1914-1958::o5'],       // the army as the core of the state -> the security state
  ['iraq-1958-1979::k5', 'iraq-1914-1958::k5'],       // the army and the coups -> Saddam's rise from the deputy's chair
  ['iraq-1958-1979::o4', 'iraq-1914-1958::o3'],       // the oil and the state's income -> the nationalisation and the rentier state
  ['iraq-1958-1979::e1', 'iraq-1914-1958::xc4'],      // the consortium and the world market -> the 1972 nationalisation and the 1973 boom
  ['iraq-1958-1979::w2', 'iraq-1914-1958::w2'],       // the oil curse begins -> the one decade the money reached the people
  ['iraq-1958-1979::b3', 'iraq-1914-1958::b3'],       // communism and Arab nationalism -> the destruction of the left
  ['iraq-1958-1979::b2', 'iraq-1914-1958::t4'],       // the revival of religious thought at Najaf -> the Shia Islamic movement rises
  ['iraq-1958-1979::t1', 'iraq-1914-1958::b2'],       // the Shia clergy and the modern state -> al-Sadr's political economy
  ['iraq-1958-1979::k7', 'iraq-1914-1958::c5'],       // the Barzani revolts -> the Kurdish movement, the 1970 deal and Algiers
  ['iraq-1958-1979::l4', 'iraq-1914-1958::xc5'],      // the Kurdish question across the borders -> Mustafa Barzani, everyone's proxy
  ['iraq-1958-1979::b4', 'iraq-1914-1958::b1'],       // the exodus of the Jews -> the 1969 hangings and the end
  ['iraq-1958-1979::b4', 'iraq-1914-1958::b4'],       // the Christians, Yazidis and minorities in the nationalist state
  ['iraq-1958-1979::x3', 'iraq-1914-1958::x5'],       // the Iraq Museum and the national heritage -> the state claims the ancient past
  ['iraq-1958-1979::t2', 'iraq-1914-1958::t1'],       // making a nation from three vilayets -> Ba'thist historiography
  ['iraq-1958-1979::x1', 'iraq-1914-1958::x1'],       // the free-verse revolution -> the poets of the republic and exile
  ['iraq-1958-1979::x2', 'iraq-1914-1958::x2'],       // Jewad Selim and modern Iraqi art, carried on under the state
  ['iraq-1958-1979::t4', 'iraq-1914-1958::t3'],       // Ali al-Wardi's sociology -> his social history of modern Iraq
  ['iraq-1958-1979::w1', 'iraq-1914-1958::w4'],       // the 14 July watershed -> the revolution devours itself
  ['iraq-1958-1979::xc1', 'iraq-1914-1958::xc1'],     // Iraq in the British system -> the swing to the Soviet tie
  ['iraq-1958-1979::xc2', 'iraq-1914-1958::o3'],      // OPEC founded in Baghdad, 1960 -> the oil weapon
  ['iraq-1958-1979::o5', 'iraq-1914-1958::o6'],       // the Development Board -> the welfare state and the developmental Ba'th
  ['iraq-1958-1979::g3', 'iraq-1914-1958::g1'],       // air control and the aeroplane -> the modern arsenal and the WMD ambition
  ['iraq-1958-1979::l1', 'iraq-1914-1958::l2'],       // Nuri al-Sa'id -> Qasim, who overthrew the regime he ran
  // lateral to Nasser's Egypt and the Arab republic:
  ['iraq-1958-1979::k1', 'egypt-1952-today::k2'],     // Qasim and Nasser — the single-centre republic
  ['iraq-1958-1979::k4', 'egypt-1952-today::k7'],     // the Free Officers and the Revolutionary Command Council
  ['iraq-1958-1979::o1', 'egypt-1952-today::e1'],     // agrarian reform
  ['iraq-1958-1979::o2', 'egypt-1952-today::k8'],     // the single party — the Ba'th and the ASU
  ['iraq-1958-1979::o4', 'egypt-1952-today::e2'],     // nationalisation and the planned economy
  ['iraq-1958-1979::o5', 'egypt-1952-today::o4'],     // the public sector and the graduate guarantee
  ['iraq-1958-1979::o3', 'egypt-1952-today::k12'],    // the Mukhabarat and the Ministry of the Interior
  ['iraq-1958-1979::b1', 'egypt-1952-today::t1'],     // Arab nationalism and the disillusion of 1967
  ['iraq-1958-1979::b3', 'egypt-1952-today::t2'],     // the Marxist current and the student left
  ['iraq-1958-1979::b2', 'egypt-1952-today::t3'],     // the Islamist thought forming under the secular regime — al-Sadr and Qutb
  ['iraq-1958-1979::c5', 'egypt-1952-today::c3'],     // the Six-Day War and the loss of Sinai
  ['iraq-1958-1979::xc1', 'egypt-1952-today::xc1'],   // non-alignment and the Soviet alliance
  ['iraq-1958-1979::e4', 'egypt-1952-today::t5'],     // the critique of the state economy
  ['iraq-1958-1979::x1', 'egypt-1952-today::x1'],     // Naguib Mahfouz and the Iraqi poets — Arabic letters under the republics
  // lateral to the Saudi state (the Arab Cold War, OPEC, the 1979 hinge):
  ['iraq-1958-1979::xc2', 'saudi-1902-today::ec3'],   // the oil weapon and the price shocks
  ['iraq-1958-1979::xc4', 'saudi-1902-today::x3'],    // the Arab Cold War
  ['iraq-1958-1979::xc5', 'saudi-1902-today::w3'],    // 1979 as the hinge
  // ── iraq-1914-1958 (Mandate and the Hashemite Kingdom) ──
  // hand-off backward from Late Ottoman Iraq:
  ['iraq-1914-1958::k1', 'iraq-1831-1914::c6'],       // the British landing at Basra -> the conquest and the Mandate
  ['iraq-1914-1958::w1', 'iraq-1831-1914::w2'],       // the three vilayets -> the invented state welded from them
  ['iraq-1914-1958::o1', 'iraq-1831-1914::xc1'],      // the Anglo-Ottoman-German contest -> the Mandate and the RAF
  ['iraq-1914-1958::o3', 'iraq-1831-1914::e5'],       // the oil that was coming -> the oil and the state's income
  ['iraq-1914-1958::o4', 'iraq-1831-1914::o2'],       // the 1858 Land Code -> the land regime and the making of the sheikhs
  ['iraq-1914-1958::e2', 'iraq-1831-1914::e4'],       // the land boom and the sarkal -> the land question and rural misery
  ['iraq-1914-1958::e3', 'iraq-1831-1914::w3'],       // the tribal-agrarian country -> the shuruq and the sarifa slums
  ['iraq-1914-1958::k8', 'iraq-1831-1914::k8'],       // the Arab officers of al-Ahd -> the Free Officers of 1958
  ['iraq-1914-1958::k5', 'iraq-1831-1914::t2'],       // Ottoman modern learning and the officer class -> the coups
  ['iraq-1914-1958::b1', 'iraq-1831-1914::b4'],       // the Jews of Baghdad at their height -> the exodus
  ['iraq-1914-1958::b1', 'iraq-1831-1914::xc3'],      // the Baghdadi Jewish trading world -> its end
  ['iraq-1914-1958::b2', 'iraq-1831-1914::b3'],       // the Najaf ulama and the Iranian revolution -> the clergy and the modern state
  ['iraq-1914-1958::c2', 'iraq-1831-1914::c5'],       // the clergy in politics — the Constitutional Revolution, then the 1920 Revolt
  ['iraq-1914-1958::e4', 'iraq-1831-1914::g3'],       // the Hindiyya Barrage -> the Development Board and the dams
  ['iraq-1914-1958::x5', 'iraq-1831-1914::x3'],       // the Assyrian excavations -> the Iraq Museum and the national heritage
  ['iraq-1914-1958::t1', 'iraq-1831-1914::t3'],       // the Nahda reaches Iraq -> making a nation from three vilayets
  ['iraq-1914-1958::x1', 'iraq-1831-1914::x2'],       // al-Zahawi and al-Rusafi -> the free-verse revolution
  ['iraq-1914-1958::c5', 'iraq-1831-1914::o6'],       // the end of the Kurdish emirates -> the Barzani revolts
  ['iraq-1914-1958::xc1', 'iraq-1831-1914::w3'],      // Iraq caught in the powers' rivalries -> tied to Britain until 1958
  ['iraq-1914-1958::x4', 'iraq-1831-1914::x1'],       // the press and the birth of public opinion -> the press, radio and effendiyya
  ['iraq-1914-1958::l3', 'iraq-1831-1914::l5'],       // Hormuzd Rassam and the diggers -> Gertrude Bell and the Iraq Museum
  // lateral to Egypt 1900–1952 (the parallel Arab monarchy and liberal experiment):
  ['iraq-1914-1958::w3', 'egypt-1900-1952::o2'],      // the 1923/1925 constitutions and the failed liberal experiment
  ['iraq-1914-1958::o1', 'egypt-1900-1952::o1'],      // the Protectorate / Mandate and the reserved points
  ['iraq-1914-1958::xc1', 'egypt-1900-1952::o3'],     // the 1936 / 1930 Anglo-Egyptian and Anglo-Iraqi treaties
  ['iraq-1914-1958::c2', 'egypt-1900-1952::c3'],      // the 1920 Revolt and the 1919 Revolution — the founding uprisings
  ['iraq-1914-1958::k7', 'egypt-1900-1952::k12'],     // Sa'd Zaghlul and the Wafd — the mass nationalist party
  ['iraq-1914-1958::k8', 'egypt-1900-1952::k15'],     // the Free Officers coups of 1958 and 1952
  ['iraq-1914-1958::x4', 'egypt-1900-1952::o7'],      // the effendi state and the graduate glut
  ['iraq-1914-1958::e2', 'egypt-1900-1952::e4'],      // the land question
  ['iraq-1914-1958::e3', 'egypt-1900-1952::e5'],      // the condition of the fellah
  ['iraq-1914-1958::xc2', 'egypt-1900-1952::c7'],     // the 1948 Palestine War and the humiliation of the old regimes
  ['iraq-1914-1958::b1', 'egypt-1900-1952::xc4'],     // Egyptianisation and the turn against the foreign and Jewish communities
  ['iraq-1914-1958::l2', 'egypt-1900-1952::l2'],      // Nuri al-Sa'id <-> Mustafa al-Nahhas — the perennial politician
  ['iraq-1914-1958::t1', 'egypt-1900-1952::t2'],      // the identity debate — Arabism, territorial patriotism, the past
  ['iraq-1914-1958::x5', 'egypt-1900-1952::t5'],      // the claim on the ancient past as national heritage
  // lateral to the Sharifian Hejaz (the Hashemite origin):
  ['iraq-1914-1958::k2', 'hejaz-1900-1925::x3'],      // the 'Sharifian solution' of 1921 — Faisal to the Iraqi throne
  ['iraq-1914-1958::k1', 'hejaz-1900-1925::x2'],      // Paris, San Remo and the mandates
  ['iraq-1914-1958::l1', 'hejaz-1900-1925::k3'],      // Faisal I, son of Sharif Hussein
  // lateral to the Saudi state (the desert neighbour, the oil state):
  ['iraq-1914-1958::k1', 'saudi-1902-today::o1'],     // the two states forming — the 1932 unification, the drawn borders
  ['iraq-1914-1958::o3', 'saudi-1902-today::o2'],     // the oil concession and the company town
  // ── iraq-1831-1914 (Late Ottoman Iraq) ──
  // hand-off backward from Ottoman Iraq: the Three Provinces:
  ['iraq-1831-1914::k1', 'iraq-1534-1831::c6'],       // the fall of Dawud Pasha -> direct Ottoman rule and the first reformers
  ['iraq-1831-1914::c1', 'iraq-1534-1831::c4'],       // Karbala sacked in 1802 by the Wahhabis, in 1843 by the state
  ['iraq-1831-1914::o2', 'iraq-1534-1831::o3'],       // the tax-farmer and the ruined land -> the 1858 Land Code and the landlord class
  ['iraq-1831-1914::o4', 'iraq-1534-1831::o6'],       // the shrine cities as a state within the state, under the clergy
  ['iraq-1831-1914::b1', 'iraq-1534-1831::b2'],       // the triumph of Usulism -> the single source of emulation
  ['iraq-1831-1914::b3', 'iraq-1534-1831::t1'],       // the rational defence of clerical authority -> the ulama and the Iranian revolution
  ['iraq-1831-1914::b4', 'iraq-1534-1831::b6'],       // the Jews of Baghdad -> at their height
  ['iraq-1831-1914::xc3', 'iraq-1534-1831::xc5'],     // the Baghdadi Jewish diaspora begins -> spans British Asia
  ['iraq-1831-1914::e1', 'iraq-1534-1831::e1'],       // the long depression and Mamluk recovery -> Iraq joins the world economy
  ['iraq-1831-1914::e2', 'iraq-1534-1831::g3'],       // the Residency surveys and the coming of steam -> the steamers and the telegraph
  ['iraq-1831-1914::t4', 'iraq-1534-1831::t4'],       // science through the Residency -> Assyriology born from Iraqi soil
  ['iraq-1831-1914::x3', 'iraq-1534-1831::l4'],       // Claudius James Rich -> the Assyrian excavations
  ['iraq-1831-1914::k7', 'iraq-1534-1831::xc4'],      // the Wahhabi–Ottoman war -> the desert, al-Hasa and Kuwait
  ['iraq-1831-1914::o6', 'iraq-1534-1831::o4'],       // the hereditary Kurdish lordships -> the end of the emirates
  ['iraq-1831-1914::k5', 'iraq-1534-1831::k8'],       // the Muntafiq, the Baban and the Bedouin -> the tribal shaykhs made landlords
  ['iraq-1831-1914::w1', 'iraq-1534-1831::w2'],       // a Shia country under Sunni rule -> the making of modern Iraqi society
  ['iraq-1831-1914::w4', 'iraq-1534-1831::w4'],       // Iraq on the eve of the modern -> the Ottoman order at its end
  ['iraq-1831-1914::x5', 'iraq-1534-1831::x2'],       // poetry between three languages and the Iraqi maqam
  ['iraq-1831-1914::o1', 'iraq-1534-1831::g1'],       // the failure to modernise -> the Tanzimat state arrives
  ['iraq-1831-1914::xc2', 'iraq-1534-1831::xc2'],     // the atabat and the Oudh Bequest -> the shrine cities and the Iranian revolution
  ['iraq-1831-1914::xc4', 'iraq-1534-1831::e5'],      // the pilgrimage and corpse traffic -> the pilgrimage and the Hajj road
  // lateral to Muhammad Ali's Egypt (the parallel reforming Ottoman Arab province):
  ['iraq-1831-1914::k2', 'egypt-1798-1900::k2'],      // Midhat Pasha <-> Muhammad Ali — the reforming provincial ruler
  ['iraq-1831-1914::o1', 'egypt-1798-1900::o2'],      // the monopoly state and the modern bureaucracy
  ['iraq-1831-1914::o2', 'egypt-1798-1900::o3'],      // the cadastre and private property in land
  ['iraq-1831-1914::e1', 'egypt-1798-1900::e4'],      // from monopoly to market
  ['iraq-1831-1914::e4', 'egypt-1798-1900::e7'],      // the fellah and the agrarian crisis
  ['iraq-1831-1914::g3', 'egypt-1798-1900::g1'],      // Willcocks and the barrages — the Hindiyya and the Nile
  ['iraq-1831-1914::g1', 'egypt-1798-1900::g2'],      // the railway and the telegraph
  ['iraq-1831-1914::t3', 'egypt-1798-1900::b2'],      // the Nahda — al-Afghani and Abduh and Islamic modernism
  ['iraq-1831-1914::x1', 'egypt-1798-1900::x2'],      // the new journalism
  ['iraq-1831-1914::x2', 'egypt-1798-1900::x5'],      // the reinvention of Arabic literature
  ['iraq-1831-1914::e5', 'egypt-1798-1900::xc1'],     // the Suez Canal, the oil — the strategic asset drawing the powers
  ['iraq-1831-1914::t2', 'egypt-1798-1900::t1'],      // the student missions, al-Tahtawi and the new schools
  ['iraq-1831-1914::l1', 'egypt-1798-1900::l1'],      // Midhat Pasha <-> Muhammad Ali, the men
  ['iraq-1831-1914::c4', 'egypt-1798-1900::c3'],      // the war against the Saudis in Arabia
  // lateral to the Ottoman Hejaz and the desert:
  ['iraq-1831-1914::xc4', 'hejaz-1517-1900::o2'],     // the organisation of the Hajj
  ['iraq-1831-1914::x3', 'hejaz-1517-1900::t1'],      // the European explorer-scholars in the Ottoman Arab lands
  ['iraq-1831-1914::k7', 'najd-1744-1900::k9'],       // Muhammad ibn Rashid of Ha'il
  ['iraq-1831-1914::c4', 'najd-1744-1900::c6'],       // the Battle of Mulayda
  // lateral to the Trucial Gulf:
  ['iraq-1831-1914::k7', 'trucial-gulf-1820-1900::k7'], // Mubarak the Great and the 1899 Kuwait agreement
  ['iraq-1831-1914::xc1', 'trucial-gulf-1820-1900::w2'], // the scramble touches the Gulf
  // ── iraq-1534-1831 (Ottoman Iraq: the Three Provinces) ──
  // hand-off backward from Iraq under the Ilkhans and the Turkmen:
  ['iraq-1534-1831::k1', 'iraq-1258-1534::k7'],       // Suleiman takes Baghdad -> the three provinces organised
  ['iraq-1534-1831::k2', 'iraq-1258-1534::xc4'],      // the Ottoman–Safavid confessional war -> the wars for Baghdad and Zuhab
  ['iraq-1534-1831::o6', 'iraq-1258-1534::w4'],       // the shrine cities as the surviving Iraq -> a state within the state
  ['iraq-1534-1831::b3', 'iraq-1258-1534::b1'],       // Hilla, Najaf and the atabat -> the atabat at their height
  ['iraq-1534-1831::b2', 'iraq-1258-1534::t2'],       // al-Hilli and the systematising of Twelver law -> the triumph of Usulism
  ['iraq-1534-1831::o3', 'iraq-1258-1534::e2'],       // the pastoral takeover -> the tax-farmer and the ruined land
  ['iraq-1534-1831::e1', 'iraq-1258-1534::e1'],       // the nadir of the Sawad -> the long depression and a partial recovery
  ['iraq-1534-1831::g2', 'iraq-1258-1534::g4'],       // the losing fight with the rivers -> the Hindiyya crisis
  ['iraq-1534-1831::o4', 'iraq-1258-1534::o4'],       // the tribal order at its widest -> the hereditary Kurdish and Arab lordships
  ['iraq-1534-1831::k8', 'iraq-1258-1534::k8'],       // the tribes, the Kurds and the Musha'sha' -> the Muntafiq, the Baban and the Bedouin
  ['iraq-1534-1831::b6', 'iraq-1258-1534::b5'],       // the Jews and Christians of Iraq, reduced -> the Jews of Baghdad, an emerging golden age
  ['iraq-1534-1831::b4', 'iraq-1258-1534::b3'],       // the Sufi orders as the common faith -> the Kaylanis and the Khalidi revival
  ['iraq-1534-1831::e5', 'iraq-1258-1534::e4'],       // the pilgrimage economy of the atabat -> the pilgrimage and corpse traffic
  ['iraq-1534-1831::w2', 'iraq-1258-1534::w2'],       // a land divided against its future -> a Shia country under Sunni rule
  ['iraq-1534-1831::t3', 'iraq-1258-1534::t3'],       // the age of compilation -> transmission in the manuscript age
  ['iraq-1534-1831::x3', 'iraq-1258-1534::e5'],       // the Safavid canal to Najaf -> the Mamluk pashas gild the shrines
  // lateral to Ottoman Egypt (the parallel Ottoman Arab province with a Mamluk regime):
  ['iraq-1534-1831::k1', 'egypt-1517-1798::k3'],      // the Qanunname and the ordered eyalet
  ['iraq-1534-1831::o2', 'egypt-1517-1798::k5'],      // the Mamluk households return / rule in the Ottoman name
  ['iraq-1534-1831::k6', 'egypt-1517-1798::k8'],      // Sulayman the Great <-> Ali Bey al-Kabir — the strong autonomous Mamluk
  ['iraq-1534-1831::c3', 'egypt-1517-1798::c4'],      // the Mamluk civil wars <-> the Faqari–Qasimi wars
  ['iraq-1534-1831::o3', 'egypt-1517-1798::o2'],      // the iltizam tax-farm and the village
  ['iraq-1534-1831::b6', 'egypt-1517-1798::b5'],      // the Jewish communities of the two Ottoman Arab provinces
  ['iraq-1534-1831::b3', 'egypt-1517-1798::b1'],      // Najaf and al-Azhar — the Shia and the Sunni centre of learning
  ['iraq-1534-1831::x1', 'egypt-1517-1798::x3'],      // the local chronicle <-> al-Jabarti's chronicle of the age
  ['iraq-1534-1831::e2', 'egypt-1517-1798::xc1'],     // the transit trade — Aleppo–Basra and the Cairo crossroads
  ['iraq-1534-1831::e4', 'egypt-1517-1798::xc6'],     // the East India Company route <-> 1798 and the Eastern Question
  ['iraq-1534-1831::w3', 'egypt-1517-1798::w3'],      // the Bedouin and the retreat of settled power
  ['iraq-1534-1831::g1', 'egypt-1517-1798::g3'],      // the firearm and the Mamluk who would not use it
  ['iraq-1534-1831::l1', 'egypt-1517-1798::l1'],      // Sulayman Pasha the Great <-> Ali Bey al-Kabir, the men
  ['iraq-1534-1831::l4', 'egypt-1517-1798::t5'],      // Rich at Babylon <-> the French savants and the Description de l'Égypte
  ['iraq-1534-1831::c1', 'egypt-1517-1798::c1'],      // Marj Dabiq and al-Raydaniyya — the Ottoman conquest of the Arab lands
  // lateral to the first Saudi state (the Wahhabi shock):
  ['iraq-1534-1831::c4', 'najd-1744-1900::c2'],       // the sack of Karbala
  ['iraq-1534-1831::b5', 'najd-1744-1900::b2'],       // takfir and the war on the shrines
  ['iraq-1534-1831::xc4', 'najd-1744-1900::x2'],      // Muhammad Ali and Arabia — the destruction of the first Saudi state
  // lateral to Oman and the Gulf (Basra and the sea trade):
  ['iraq-1534-1831::e3', 'oman-gulf-1650-1820::ec1'], // Basra and Muscat — the entrepots of the western Indian Ocean
  ['iraq-1534-1831::c2', 'oman-gulf-1650-1820::c2'],  // Nader Shah in Iraq and in Oman
  ['iraq-1534-1831::e4', 'oman-gulf-1650-1820::x3'],  // Britain enters Gulf diplomacy
  // ── iraq-1258-1534 (Iraq under the Ilkhans and the Turkmen) ──
  // hand-off backward from Iraq from the Buyids to the Mongols:
  ['iraq-1258-1534::k1', 'iraq-945-1258::k8'],        // Hulagu and the Ilkhanate -> Iraq a province governed from Tabriz
  ['iraq-1258-1534::o1', 'iraq-945-1258::w2'],        // from the centre of the world to a march -> ruled from the north
  ['iraq-1258-1534::e1', 'iraq-945-1258::e1'],        // the end of the Sawad -> its recorded nadir
  ['iraq-1258-1534::e2', 'iraq-945-1258::e3'],        // the militarised land -> the pastoral takeover of the farmland
  ['iraq-1258-1534::g4', 'iraq-945-1258::g1'],        // the fragility of a hydraulic society -> the losing fight with the rivers
  ['iraq-1258-1534::b1', 'iraq-945-1258::b1'],        // the Baghdad school of Twelver theology -> Hilla, Najaf and the atabat
  ['iraq-1258-1534::e4', 'iraq-945-1258::e5'],        // the pilgrimage and shrine economy -> the atabat as the mainstay
  ['iraq-1258-1534::o3', 'iraq-945-1258::o5'],        // the waqf that built the city -> the shrine administrations that outlast every sack
  ['iraq-1258-1534::b3', 'iraq-945-1258::b4'],        // Sufism becomes institutional orders -> the orders as the common faith
  ['iraq-1258-1534::b5', 'iraq-945-1258::b6'],        // the Jews and Christians of Iraq, diminished, and further reduced
  ['iraq-1258-1534::t4', 'iraq-945-1258::t5'],        // the rational sciences narrowed -> metaphysics moves from the madrasa to the lodge
  ['iraq-1258-1534::w1', 'iraq-945-1258::w4'],        // the end of the Abbasid Caliphate -> the great undoing of Iraq
  ['iraq-1258-1534::c1', 'iraq-945-1258::xc3'],       // the Ilkhanate and the Mongol world -> its dissolution after 1335
  ['iraq-1258-1534::x3', 'iraq-945-1258::x1'],        // the Persianate turn -> Persian and Turkic poetry at the Turkmen courts
  ['iraq-1258-1534::t1', 'iraq-945-1258::t4'],        // the last generation of Buyid science -> the Maragha observatory
  ['iraq-1258-1534::o4', 'iraq-945-1258::xc1'],       // the Turkmen migration -> the tribal order at its widest
  ['iraq-1258-1534::o6', 'iraq-945-1258::w3'],        // the plural society thins and hardens -> the Sunni–Shia state frontier
  // lateral to the Caliphate 945–1258 (the tail overlap — the sack and its aftermath):
  ['iraq-1258-1534::k1', 'caliphate-945-1258::k13'], // Hulagu and the Ilkhanate
  ['iraq-1258-1534::xc1', 'caliphate-945-1258::x6'], // the Mongols and the wider world
  ['iraq-1258-1534::b1', 'caliphate-945-1258::b5'],  // the Shia academy moves to Najaf
  ['iraq-1258-1534::w1', 'caliphate-945-1258::ec2'], // the end of the Sawad
  ['iraq-1258-1534::w4', 'caliphate-945-1258::w6'],  // the end of the institutional caliphate; the shrine cities carry on
  // lateral to the Mamluk Sultanate (the other survivor of the Mongol shock, the rival, the Cairo caliphate):
  ['iraq-1258-1534::k1', 'mamluks-1250-1517::c1'],   // the Mongols stopped at Ayn Jalut while Baghdad fell
  ['iraq-1258-1534::k1', 'mamluks-1250-1517::c2'],   // Iraq the Ilkhanid base for the invasions of Mamluk Syria
  ['iraq-1258-1534::k2', 'mamluks-1250-1517::k10'],  // Sultan Ahmad Jalayir sheltered in Mamluk Cairo from Timur
  ['iraq-1258-1534::c2', 'mamluks-1250-1517::c7'],   // Timur's campaign — Baghdad, and Aleppo and Damascus
  ['iraq-1258-1534::o1', 'mamluks-1250-1517::o2'],   // the Abbasid caliphate reinstalled in Cairo while Iraq had none
  ['iraq-1258-1534::b3', 'mamluks-1250-1517::b3'],   // the tariqas and the age of the saint
  ['iraq-1258-1534::t4', 'mamluks-1250-1517::b4'],   // the school of Ibn Arabi and the unity of being
  ['iraq-1258-1534::x5', 'mamluks-1250-1517::b5'],   // Sunni hadith scholarship now centred on Cairo and Damascus
  ['iraq-1258-1534::t1', 'mamluks-1250-1517::t4'],   // the Maragha planetary models reach Ibn al-Shatir at Damascus
  ['iraq-1258-1534::g1', 'mamluks-1250-1517::tc1'],  // the cavalry states and the Mamluk and Turkmen resistance to firearms
  ['iraq-1258-1534::e1', 'mamluks-1250-1517::ec7'],  // the rural crisis — iqta, Bedouin and shrinking cultivation
  ['iraq-1258-1534::e3', 'mamluks-1250-1517::ec1'],  // the transit trade that ran through the Red Sea and the Karimi
  ['iraq-1258-1534::xc1', 'mamluks-1250-1517::ec3'], // the Black Death, travelling the Mongol roads west
  ['iraq-1258-1534::c6', 'mamluks-1250-1517::c12'],  // the Ottomans absorb the last independent Islamic states, 1517 and 1534
  ['iraq-1258-1534::k7', 'mamluks-1250-1517::k14'],  // the Ottoman conquest — al-Ghawri and Tuman Bay, then Baghdad
  // ── iraq-945-1258 (Iraq from the Buyids to the Mongols) ──
  // hand-off backward from Early Islamic Iraq:
  ['iraq-945-1258::k1', 'iraq-632-945::k8'],        // power passes to the amir al-umara -> the Buyids rule in the caliph's name
  ['iraq-945-1258::o1', 'iraq-632-945::w4'],        // the caliphate emptied out -> al-Mawardi's theory of the powerless caliph
  ['iraq-945-1258::b1', 'iraq-632-945::b3'],        // the shrines and the Occultation -> the Baghdad school of Twelver theology
  ['iraq-945-1258::e1', 'iraq-632-945::e1'],        // the Sawad's peak -> the failure of the Nahrawan and the end of the Sawad
  ['iraq-945-1258::o4', 'iraq-632-945::e4'],        // the coming of the iqta -> the iqta becomes the whole system
  ['iraq-945-1258::g1', 'iraq-632-945::g2'],        // the canals that made Baghdad a river port -> the fragility of a hydraulic society
  ['iraq-945-1258::e4', 'iraq-632-945::w1'],        // Baghdad the largest city outside China -> Baghdad contracts to a tenth
  ['iraq-945-1258::b6', 'iraq-632-945::b5'],        // the geonim and the catholicos at their height -> the same, diminished
  ['iraq-945-1258::l4', 'iraq-632-945::l2'],        // the gaon of Sura -> the exilarch of Benjamin of Tudela's Baghdad
  ['iraq-945-1258::t2', 'iraq-632-945::x4'],        // paper and the booksellers -> the Buyid library culture and the Fihrist
  ['iraq-945-1258::x1', 'iraq-632-945::x2'],        // adab and the prose of the salon -> al-Hariri and the Arabic silver age
  ['iraq-945-1258::t4', 'iraq-632-945::t3'],        // al-Khwarizmi and the exact sciences -> the last great generation of Buyid science
  ['iraq-945-1258::b4', 'iraq-632-945::b6'],        // the first Sufis -> Sufism becomes institutional orders
  ['iraq-945-1258::c1', 'iraq-632-945::c2'],        // Karbala and the Kufan revolts -> the Sunni–Shia street wars of Baghdad
  ['iraq-945-1258::e2', 'iraq-632-945::e3'],        // Basra and the sea road to China -> the trade axis shifts to the Red Sea
  ['iraq-945-1258::xc1', 'iraq-632-945::k7'],       // al-Mu'tasim's Turkish guard -> the Turkmen migration as a whole people
  ['iraq-945-1258::w2', 'iraq-632-945::w3'],        // the rebellious granary -> from the centre of the world to a march
  // lateral to the Caliphate 945–1258 (the imperial backbone of the same centuries):
  ['iraq-945-1258::k2', 'caliphate-945-1258::k9'],  // Tughril Beg — the Seljuks take Baghdad
  ['iraq-945-1258::k8', 'caliphate-945-1258::k13'], // Hulagu and the Ilkhanate
  ['iraq-945-1258::c2', 'caliphate-945-1258::c2'],  // the Basasiri revolt
  ['iraq-945-1258::c6', 'caliphate-945-1258::c10'], // the sack of Baghdad and the check at Ayn Jalut
  ['iraq-945-1258::o1', 'caliphate-945-1258::o1'],  // al-Mawardi writes the constitution of the caliphate
  ['iraq-945-1258::o3', 'caliphate-945-1258::o3'],  // the madrasa as an instrument of state
  ['iraq-945-1258::o4', 'caliphate-945-1258::o4'],  // the iqta becomes the military-fiscal system
  ['iraq-945-1258::o5', 'caliphate-945-1258::o5'],  // the waqf — the endowment that built the Islamic city
  ['iraq-945-1258::o6', 'caliphate-945-1258::o6'],  // al-Nasir's futuwwa order
  ['iraq-945-1258::b1', 'caliphate-945-1258::w1'],  // the Shi'i century
  ['iraq-945-1258::b2', 'caliphate-945-1258::b1'],  // the Sunni revival
  ['iraq-945-1258::b3', 'caliphate-945-1258::b2'],  // al-Ghazali — law, theology and Sufism reconciled
  ['iraq-945-1258::b5', 'caliphate-945-1258::b6'],  // the Nizari 'Resurrection' at Alamut
  ['iraq-945-1258::e1', 'caliphate-945-1258::ec2'], // the end of the Sawad
  ['iraq-945-1258::e2', 'caliphate-945-1258::ec1'], // the economic centre leaves Iraq
  ['iraq-945-1258::g2', 'caliphate-945-1258::e2'],  // the tomb tower and the muqarnas vault
  ['iraq-945-1258::g3', 'caliphate-945-1258::t5'],  // al-Jazari's Book of Ingenious Mechanical Devices
  ['iraq-945-1258::x3', 'caliphate-945-1258::t6'],  // Ibn al-Athir and the historians of the catastrophe
  ['iraq-945-1258::xc2', 'caliphate-945-1258::w3'], // the Crusades
  ['iraq-945-1258::xc4', 'caliphate-945-1258::b8'], // the Church of the East reaches the Mongols
  ['iraq-945-1258::w4', 'caliphate-945-1258::w6'],  // the end of the institutional caliphate
  // ── iraq-632-945 (Early Islamic Iraq — the place-view alongside the caliphate-* backbone) ──
  // hand-off backward from Sasanian Mesopotamia:
  ['iraq-632-945::k1', 'mesopotamia-224-637::c6'],   // al-Qadisiyya and the fall of Ctesiphon -> the garrison cities founded
  ['iraq-632-945::k5', 'mesopotamia-224-637::o2'],   // al-Madā'in -> al-Mansur's Baghdad, 30 km upstream
  ['iraq-632-945::o3', 'mesopotamia-224-637::xc5'],  // the Sasanian apparatus passes to Islam -> Baghdad the machine of empire
  ['iraq-632-945::o2', 'mesopotamia-224-637::o3'],   // Khosrow I's cadastral tax -> the Sawad kept as a taxed common endowment
  ['iraq-632-945::o1', 'mesopotamia-224-637::w4'],   // Sasanian Iraq becomes Islamic Iraq -> the amsar and the stipend state
  ['iraq-632-945::o6', 'mesopotamia-224-637::o5'],   // the protected communities under their heads -> the dhimma continued
  ['iraq-632-945::e1', 'mesopotamia-224-637::e1'],   // the Nahrawan -> the Sawad's agriculture still at its height
  ['iraq-632-945::e4', 'mesopotamia-224-637::e2'],   // the richest tax base -> the base erodes and the iqta comes
  ['iraq-632-945::g2', 'mesopotamia-224-637::g2'],   // the engineering of the Nahrawan -> the canals that make Baghdad a river port
  ['iraq-632-945::b5', 'mesopotamia-224-637::b2'],   // Sura and Pumbedita and the Talmud -> the geonim now in Baghdad
  ['iraq-632-945::l2', 'mesopotamia-224-637::l2'],   // the head of the academy -> the gaon of Sura at Baghdad
  ['iraq-632-945::l3', 'mesopotamia-224-637::l5'],   // the court physician of Gondeshapur -> Hunayn ibn Ishaq the translator
  ['iraq-632-945::t1', 'mesopotamia-224-637::t4'],   // Syriac, the bridge from Greek -> the Arabic translation movement
  ['iraq-632-945::t4', 'mesopotamia-224-637::t1'],   // Gondeshapur -> the Baghdad hospital and its physicians
  ['iraq-632-945::b6', 'mesopotamia-224-637::b6'],   // the Mandaean and gnostic ferment -> the first Muslim ascetics of Iraq
  ['iraq-632-945::x5', 'mesopotamia-224-637::x5'],   // the great vault of Ctesiphon -> the Round City and Samarra
  ['iraq-632-945::w1', 'mesopotamia-224-637::w1'],   // Mesopotamia the heart of a great power -> Baghdad the world city
  ['iraq-632-945::w2', 'mesopotamia-224-637::w2'],   // the plural society and its heads -> the Arabising Iraq that grows from it
  // lateral to the Caliphate 632–750:
  ['iraq-632-945::k1', 'caliphate-632-750::o1'],     // the diwan and the garrison cities — Kufa and Basra the type
  ['iraq-632-945::c1', 'caliphate-632-750::c5'],     // the Battle of the Camel and Siffin, fought from Iraq
  ['iraq-632-945::c2', 'caliphate-632-750::c6'],     // Karbala
  ['iraq-632-945::b1', 'caliphate-632-750::o5'],     // the qadi and the beginnings of Islamic law — Kufa and Basra
  ['iraq-632-945::x1', 'caliphate-632-750::t2'],     // Arabic grammar and the two schools, Basra and Kufa
  ['iraq-632-945::b6', 'caliphate-632-750::b6'],     // al-Hasan al-Basri and the beginnings of renunciation
  // lateral to the Caliphate 750–945:
  ['iraq-632-945::k5', 'caliphate-750-945::k1'],     // al-Saffah and al-Mansur — the founding of Baghdad
  ['iraq-632-945::k7', 'caliphate-750-945::w3'],     // Samarra and the slave-soldier state
  ['iraq-632-945::k8', 'caliphate-750-945::k12'],    // the amir al-umara and the Buyid entry
  ['iraq-632-945::c4', 'caliphate-750-945::c2'],     // the siege of Baghdad in the war of the brothers
  ['iraq-632-945::c5', 'caliphate-750-945::c6'],     // the Zanj Revolt
  ['iraq-632-945::c6', 'caliphate-750-945::c8'],     // the Qarmatians and the humiliation of the Hajj
  ['iraq-632-945::b4', 'caliphate-750-945::o2'],     // the mihna — the inquisition of the created Quran
  ['iraq-632-945::b3', 'caliphate-750-945::b5'],     // the line of imams ends — the Occultation, at Samarra
  ['iraq-632-945::b5', 'caliphate-750-945::b8'],     // the geonim, Saadia Gaon and the Karaite schism
  ['iraq-632-945::t1', 'caliphate-750-945::t1'],     // the Translation Movement
  ['iraq-632-945::e3', 'caliphate-750-945::ec2'],    // the Indian Ocean trade at its height — Basra and Siraf
  ['iraq-632-945::e1', 'caliphate-750-945::ec3'],    // the Sawad — the granary and the beginning of its decline
  ['iraq-632-945::xc2', 'caliphate-750-945::x6'],    // the Darb Zubayda — the pilgrim road
  ['iraq-632-945::w4', 'caliphate-750-945::w5'],     // the Buyids take Baghdad
  // lateral to Egypt under Islam (the parallel caliphal province):
  ['iraq-632-945::k1', 'egypt-641-969::o1'],         // Fustat <-> Kufa and Basra — the garrison city as capital
  ['iraq-632-945::o6', 'egypt-641-969::o5'],         // the dhimma in practice, in both provinces
  ['iraq-632-945::b1', 'egypt-641-969::b2'],         // the Iraqi schools of law <-> al-Shafiʿi's Egypt
  ['iraq-632-945::e4', 'egypt-641-969::e2'],         // from tribute to tax-farm to assignment
  ['iraq-632-945::k7', 'egypt-641-969::k6'],         // the tax-farm and the Turkish generals
  // lateral to the Lakhmids (Kufa rose next to al-Hira):
  ['iraq-632-945::c2', 'lakhmid-268-602::w5'],       // al-Hira falls to the Islamic state, and Kufa is built beside it
  // ── mesopotamia-224-637 (Sasanian Mesopotamia) ──
  // hand-off backward from Parthian Mesopotamia:
  ['mesopotamia-224-637::k1', 'mesopotamia-141bc-224::c6'],   // Ardashir destroys Artabanus IV -> the founding of Ērānšahr
  ['mesopotamia-224-637::o2', 'mesopotamia-141bc-224::g1'],   // the palaces of Ctesiphon -> al-Madā'in the imperial capital
  ['mesopotamia-224-637::x5', 'mesopotamia-141bc-224::g2'],   // the iwan -> the great pitched-brick vault of Ctesiphon
  ['mesopotamia-224-637::x3', 'mesopotamia-141bc-224::x3'],   // Parthian frontality -> the Sasanian royal image in rock and silver
  ['mesopotamia-224-637::b1', 'mesopotamia-141bc-224::b3'],   // the first churches at Edessa and Adiabene -> the Church of the East organised
  ['mesopotamia-224-637::b2', 'mesopotamia-141bc-224::b2'],   // the exilarch and the first rabbis -> Sura, Pumbedita and the Talmud
  ['mesopotamia-224-637::xc4', 'mesopotamia-141bc-224::t4'],  // the oral Torah moves east -> the Jewish world tilts decisively to Babylonia
  ['mesopotamia-224-637::b5', 'mesopotamia-141bc-224::b6'],   // the baptising sects of the lower canals -> Mani and the religion of light
  ['mesopotamia-224-637::b6', 'mesopotamia-141bc-224::t5'],   // the exorcist's craft outlives the script -> the Mandaeans and the incantation bowls
  ['mesopotamia-224-637::x1', 'mesopotamia-141bc-224::x2'],   // Syriac becomes a written language -> the schools of Edessa and Nisibis
  ['mesopotamia-224-637::t5', 'mesopotamia-141bc-224::t2'],   // Ptolemy's synthesis -> the royal astronomical tables at Ctesiphon
  ['mesopotamia-224-637::e1', 'mesopotamia-141bc-224::g4'],   // the grand canal answer waits for the Sasanians -> the Nahrawan
  ['mesopotamia-224-637::o3', 'mesopotamia-141bc-224::w4'],   // the Parthian template -> the Sasanians centralise the tax and the state
  ['mesopotamia-224-637::w1', 'mesopotamia-141bc-224::w1'],   // the land between the empires -> Mesopotamia the heart of a great power
  ['mesopotamia-224-637::e5', 'mesopotamia-141bc-224::e5'],   // the Arsacid drachm -> the Sasanian fire-altar drachm that becomes the dirham
  ['mesopotamia-224-637::l1', 'mesopotamia-141bc-224::l4'],   // the Christian of Edessa -> the catholicos of the East at the royal city
  ['mesopotamia-224-637::l3', 'mesopotamia-141bc-224::l5'],   // the Parthian nobleman -> the dihqan of the Sasanian village
  ['mesopotamia-224-637::xc1', 'mesopotamia-141bc-224::xc1'], // the land between Rome and Parthia -> the three-century Byzantine frontier war
  ['mesopotamia-224-637::xc3', 'mesopotamia-141bc-224::k8'],  // Hatra, Edessa, Adiabene -> al-Hira and the Lakhmid shield
  // lateral to the Lakhmids of al-Hira (exact overlap):
  ['mesopotamia-224-637::xc3', 'lakhmid-268-602::o1'],        // al-Hira as the Sasanian administrative hub facing Arabia
  ['mesopotamia-224-637::c6', 'lakhmid-268-602::w3'],         // the abolition of al-Hira opens the vacuum for the Arab conquest
  ['mesopotamia-224-637::b1', 'lakhmid-268-602::r1'],         // the Church of the East -> al-Hira a major Nestorian centre
  ['mesopotamia-224-637::o5', 'lakhmid-268-602::o2'],         // the protected communities -> the Sasanian grant of autonomy to the Lakhmids
  ['mesopotamia-224-637::t4', 'lakhmid-268-602::t3'],         // Syriac scholarship -> the Arabic script develops at al-Hira and al-Anbar
  ['mesopotamia-224-637::l1', 'lakhmid-268-602::o3'],         // the catholicos -> the Church of the East synod held at al-Hira
  // lateral to Late Roman / Byzantine Egypt — the other great eastern land:
  ['mesopotamia-224-637::b1', 'egypt-300-641::b3'],           // two churches at the empire's edge going their own christological way
  ['mesopotamia-224-637::c5', 'egypt-300-641::c7'],           // the same war — Khosrow II against Heraclius
  ['mesopotamia-224-637::k7', 'egypt-300-641::k14'],          // Khosrow II's conquests -> the Persian occupation of Egypt
  ['mesopotamia-224-637::c6', 'egypt-300-641::k15'],          // the Arab conquest — Ctesiphon and Alexandria in the same decade
  ['mesopotamia-224-637::o6', 'egypt-300-641::o3'],           // the dihqan <-> the pagarch — the local landed men who ran the tax
  ['mesopotamia-224-637::t1', 'egypt-300-641::t3'],           // Gondeshapur <-> the Alexandrian medical curriculum
  ['mesopotamia-224-637::t2', 'egypt-300-641::t1'],           // the Athenian Neoplatonists at Ctesiphon <-> the last philosophers of Alexandria
  ['mesopotamia-224-637::xc2', 'egypt-300-641::xc3'],         // the Church of the East to Asia <-> Egyptian monasticism to the world
  // lateral / forward to the Caliphate (the conquest and the successor state):
  ['mesopotamia-224-637::c6', 'caliphate-632-750::c3'],       // al-Qadisiyya, Jalula and Nihawand — the end of Sasanian Persia
  ['mesopotamia-224-637::w4', 'caliphate-632-750::w1'],       // Sasanian Iraq becomes Islamic Iraq -> the Sassanid Empire falls
  ['mesopotamia-224-637::o3', 'caliphate-632-750::o1'],       // Khosrow I's cadastral tax -> the diwan and the garrison cities
  ['mesopotamia-224-637::xc5', 'caliphate-632-750::x3'],      // the apparatus passes to Islam -> the inherited Persian bureaucracy
  ['mesopotamia-224-637::e5', 'caliphate-632-750::o3'],       // the Sasanian drachm -> the reformed dirham of 697, same weight
  ['mesopotamia-224-637::e1', 'caliphate-632-750::ec4'],      // the Nahrawan -> al-Hajjaj and the reclamation of lower Iraq
  // ── mesopotamia-141bc-224 (Parthian Mesopotamia) ──
  // hand-off backward from Seleucid Mesopotamia:
  ['mesopotamia-141bc-224::k1', 'mesopotamia-331bc-141bc::c6'],   // Mithridates I takes Babylonia -> the Parthian settlement
  ['mesopotamia-141bc-224::o3', 'mesopotamia-331bc-141bc::o2'],   // the constitution of Seleucia, kept under Parthian suzerainty
  ['mesopotamia-141bc-224::o2', 'mesopotamia-331bc-141bc::e1'],   // Seleucia draws off Babylon -> Ctesiphon rises across the river from Seleucia
  ['mesopotamia-141bc-224::o4', 'mesopotamia-331bc-141bc::o4'],   // the temple assembly left to govern itself, still meeting
  ['mesopotamia-141bc-224::o5', 'mesopotamia-331bc-141bc::o1'],   // the Seleucid Era -> now written beside the Arsacid era
  ['mesopotamia-141bc-224::b1', 'mesopotamia-331bc-141bc::x2'],   // the last copying of the classics -> the last cuneiform tablet
  ['mesopotamia-141bc-224::b1', 'mesopotamia-331bc-141bc::b2'],   // the Astronomical Diaries at their fullest -> the record finally stops
  ['mesopotamia-141bc-224::t1', 'mesopotamia-331bc-141bc::t1'],   // Systems A and B -> the observatory winds down
  ['mesopotamia-141bc-224::t2', 'mesopotamia-331bc-141bc::t5'],   // the parameters pass to Hipparchus -> Ptolemy builds the Almagest on them
  ['mesopotamia-141bc-224::t3', 'mesopotamia-331bc-141bc::t4'],   // the horoscope comes of age -> astrology becomes a universal science
  ['mesopotamia-141bc-224::b4', 'mesopotamia-331bc-141bc::b1'],   // Marduk and the New Year still kept -> Bel, Nabu and Nanaya carry on
  ['mesopotamia-141bc-224::b2', 'mesopotamia-331bc-141bc::b4'],   // the Jewish community of Babylonia continues -> the exilarch and the first rabbis
  ['mesopotamia-141bc-224::x1', 'mesopotamia-331bc-141bc::x3'],   // the Graeco-Babyloniaca tablets -> the last colophons in cuneiform
  ['mesopotamia-141bc-224::x5', 'mesopotamia-331bc-141bc::xc3'],  // the Chaldeans as a profession abroad -> the Chaldean handbooks in Greek
  ['mesopotamia-141bc-224::e1', 'mesopotamia-331bc-141bc::xc1'],  // Seleucia the great emporium of the East -> still the emporium under Parthia
  ['mesopotamia-141bc-224::e5', 'mesopotamia-331bc-141bc::e2'],   // the coined-silver economy arrives -> the Arsacid drachm and the Seleucia tetradrachm
  ['mesopotamia-141bc-224::e3', 'mesopotamia-331bc-141bc::e5'],   // the Gulf route and the desert road -> Characene and the Palmyrene sea trade
  ['mesopotamia-141bc-224::l1', 'mesopotamia-331bc-141bc::l1'],   // the astronomer-scribe of the Esagila -> the last scribe of the Esagila
  ['mesopotamia-141bc-224::w2', 'mesopotamia-331bc-141bc::w2'],   // a Greek layer over an Aramaic land -> the Aramaic renaissance as Greek recedes
  ['mesopotamia-141bc-224::w4', 'mesopotamia-331bc-141bc::w4'],   // the Seleucid template -> the Parthian template, lighter still
  // lateral to Roman Egypt — the rival empire's grain province in the same centuries:
  ['mesopotamia-141bc-224::c4', 'egypt-30bc-300ad::k6'],          // Trajan on both fronts — Ctesiphon and the Egyptian canal and fort
  ['mesopotamia-141bc-224::c4', 'egypt-30bc-300ad::c4'],          // the Jewish diaspora revolt of 115–117 spans Mesopotamia, Cyrene and Egypt
  ['mesopotamia-141bc-224::b2', 'egypt-30bc-300ad::xc6'],         // Egyptian Jewry destroyed in the revolt while Babylonian Jewry rises
  ['mesopotamia-141bc-224::b3', 'egypt-30bc-300ad::b3'],          // the first churches — Edessa and Adiabene / Alexandria and the villages
  ['mesopotamia-141bc-224::t2', 'egypt-30bc-300ad::t1'],          // Ptolemy in Alexandria synthesises the Babylonian record
  ['mesopotamia-141bc-224::t3', 'egypt-30bc-300ad::b7'],          // horoscopes and spells in daily life across the Roman world
  ['mesopotamia-141bc-224::e2', 'egypt-30bc-300ad::xc1'],         // the two routes to India — overland through Parthia, sea through Egypt
  ['mesopotamia-141bc-224::e3', 'egypt-30bc-300ad::xc2'],         // the Charax trade <-> the Muziris papyrus — the India commerce documented
  ['mesopotamia-141bc-224::x3', 'egypt-30bc-300ad::x1'],          // Parthian frontality <-> the Faiyum portraits — two provincial idioms
  ['mesopotamia-141bc-224::c5', 'egypt-30bc-300ad::w4'],          // the Antonine Plague, carried back from the sack of Seleucia
  ['mesopotamia-141bc-224::xc2', 'egypt-30bc-300ad::k12'],        // Palmyra's reach — down the Euphrates, and briefly over Egypt
  // lateral to Tylos–Mleiha (the Gulf, exact overlap):
  ['mesopotamia-141bc-224::k7', 'tylos-mleiha-300bc-240ad::w2'],  // Characene emerges as an independent Gulf kingdom
  ['mesopotamia-141bc-224::c6', 'tylos-mleiha-300bc-240ad::k5'],  // Ardashir ends the Parthian Gulf order
  ['mesopotamia-141bc-224::l3', 'tylos-mleiha-300bc-240ad::ec5'], // the Palmyrene caravan chief on the Charax–India axis
  // lateral to the Lakhmids of al-Hira (the Arab buffer kingdom, from 268):
  ['mesopotamia-141bc-224::k8', 'lakhmid-268-602::k1'],           // Hatra, Edessa, Adiabene -> the Arab client kingdom pattern continued at al-Hira
  ['mesopotamia-141bc-224::xc5', 'lakhmid-268-602::r1'],          // the Christian mission east -> al-Hira a major Nestorian centre
  ['mesopotamia-141bc-224::w1', 'lakhmid-268-602::w1'],           // the land between the empires -> the Lakhmid–Ghassanid proxy war
  // ── mesopotamia-331bc-141bc (Seleucid Mesopotamia) ──
  // hand-off backward from Achaemenid Mesopotamia:
  ['mesopotamia-331bc-141bc::k1', 'mesopotamia-539bc-331bc::k6'],   // Alexander enters Babylon -> the successor who kept it
  ['mesopotamia-331bc-141bc::k1', 'mesopotamia-539bc-331bc::xc5'],  // Alexander's Babylonian-capital plan -> Seleucia realises it 40 km north
  ['mesopotamia-331bc-141bc::k7', 'mesopotamia-539bc-331bc::k7'],   // the satrapy of Babylonia, Persian then Greek
  ['mesopotamia-331bc-141bc::o1', 'mesopotamia-539bc-331bc::o4'],   // the Aramaic chancery and the coming of the coin -> the era count and coined silver
  ['mesopotamia-331bc-141bc::o4', 'mesopotamia-539bc-331bc::o2'],   // the temples kept under a royal eye -> left to govern themselves under an epistates
  ['mesopotamia-331bc-141bc::b1', 'mesopotamia-539bc-331bc::b1'],   // the New Year without a king -> still kept, the king takes the hand of Bel when present
  ['mesopotamia-331bc-141bc::b2', 'mesopotamia-539bc-331bc::b2'],   // the great century of astronomy -> the Diaries at their fullest
  ['mesopotamia-331bc-141bc::b3', 'mesopotamia-539bc-331bc::b4'],   // the Uruk revival of Anu -> the colossal rebuilding of the Uruk temples
  ['mesopotamia-331bc-141bc::b4', 'mesopotamia-539bc-331bc::b3'],   // the Judean community after the return -> continues through the Greek centuries
  ['mesopotamia-331bc-141bc::t1', 'mesopotamia-539bc-331bc::t1'],   // mathematical astronomy in its mature form -> Systems A and B
  ['mesopotamia-331bc-141bc::t5', 'mesopotamia-539bc-331bc::t2'],   // the channel to Greece -> the parameters pass to Hipparchus
  ['mesopotamia-331bc-141bc::t4', 'mesopotamia-539bc-331bc::t3'],   // the astrological worldview -> the horoscope comes of age
  ['mesopotamia-331bc-141bc::x2', 'mesopotamia-539bc-331bc::x1'],   // the scholarly tradition holds -> the last copying of the classics
  ['mesopotamia-331bc-141bc::x4', 'mesopotamia-539bc-331bc::t4'],   // history written as prophecy -> the Hellenistic chronicles on clay
  ['mesopotamia-331bc-141bc::e4', 'mesopotamia-539bc-331bc::e4'],   // the date-and-canal economy at its peak -> the four-century price record
  ['mesopotamia-331bc-141bc::e1', 'mesopotamia-539bc-331bc::xc1'],  // Babylon a royal capital of the empire -> Seleucia draws off its people and trade
  ['mesopotamia-331bc-141bc::l1', 'mesopotamia-539bc-331bc::l1'],   // the temple scholar as the last carrier -> the astronomer-scribe of the Esagila
  ['mesopotamia-331bc-141bc::w4', 'mesopotamia-539bc-331bc::w4'],   // the Achaemenid model for a millennium -> the Seleucid template continues it
  ['mesopotamia-331bc-141bc::l5', 'mesopotamia-539bc-331bc::x3'],   // the triumph of Aramaic and the alphabet -> the bilingual scribe of the changeover
  // lateral to Ptolemaic Egypt — the parallel Hellenistic kingdom:
  ['mesopotamia-331bc-141bc::k1', 'egypt-332bc-30bc::k3'],          // Seleucus I and Ptolemy I — the two founder-Diadochi
  ['mesopotamia-331bc-141bc::c1', 'egypt-332bc-30bc::c2'],          // the Babylonian War / Ptolemy secures Egypt — the wars of the successors
  ['mesopotamia-331bc-141bc::c2', 'egypt-332bc-30bc::c3'],          // Ipsus -> the Syrian Wars, the Seleucid–Ptolemaic contest
  ['mesopotamia-331bc-141bc::c3', 'egypt-332bc-30bc::k5'],          // the Ptolemaic army in Babylon under Ptolemy III
  ['mesopotamia-331bc-141bc::o5', 'egypt-332bc-30bc::o3'],          // the kleros on the Tigris <-> the cleruchy on the Nile
  ['mesopotamia-331bc-141bc::b5', 'egypt-332bc-30bc::b1'],          // Greek gods and the cult of the king <-> Serapis and the living king
  ['mesopotamia-331bc-141bc::b6', 'egypt-332bc-30bc::t7'],          // Berossus <-> Manetho — the priest who wrote his land's history in Greek
  ['mesopotamia-331bc-141bc::b4', 'egypt-332bc-30bc::b5'],          // the Jews of Babylonia <-> the Jews of Egypt and the temple of Onias
  ['mesopotamia-331bc-141bc::xc5', 'egypt-332bc-30bc::xc3'],        // the Judaean tie <-> the Septuagint and Jewish-Greek culture
  ['mesopotamia-331bc-141bc::e1', 'egypt-332bc-30bc::w1'],          // Seleucia <-> Alexandria — the two Hellenistic megacities
  ['mesopotamia-331bc-141bc::o2', 'egypt-332bc-30bc::x4'],          // the constitution of Seleucia <-> Alexandria the model Hellenistic city
  ['mesopotamia-331bc-141bc::t3', 'egypt-332bc-30bc::t5'],          // Seleucus of Seleucia <-> the moving Earth and the mechanised sky
  ['mesopotamia-331bc-141bc::xc1', 'egypt-332bc-30bc::xc1'],        // Seleucia the eastern emporium <-> the Indian Ocean route opens
  // lateral to Tylos–Mleiha (the Gulf in the same centuries):
  ['mesopotamia-331bc-141bc::xc4', 'tylos-mleiha-300bc-240ad::k1'], // the Ikaros garrison <-> Seleucid administration of Tylos and the islands
  ['mesopotamia-331bc-141bc::e5', 'tylos-mleiha-300bc-240ad::ec1'], // the desert road <-> Gerrha, 'the richest of all tribes'
  ['mesopotamia-331bc-141bc::c5', 'tylos-mleiha-300bc-240ad::c1'],  // Antiochus III's anabasis <-> his expedition against Gerrha
  ['mesopotamia-331bc-141bc::xc2', 'tylos-mleiha-300bc-240ad::t1'], // Megasthenes east <-> Androsthenes surveys the Gulf for Alexander
  // ── mesopotamia-539bc-331bc (Achaemenid Mesopotamia) ──
  // hand-off backward from Babylon between Assyria and Persia:
  ['mesopotamia-539bc-331bc::k1', 'babylon-1155bc-539bc::k11'],  // Cyrus takes Babylon
  ['mesopotamia-539bc-331bc::c1', 'babylon-1155bc-539bc::c6'],   // Opis and the walk-in of 539
  ['mesopotamia-539bc-331bc::k1', 'babylon-1155bc-539bc::xc5'],  // the Cyrus Cylinder and the propaganda of the light hand
  ['mesopotamia-539bc-331bc::o2', 'babylon-1155bc-539bc::o2'],   // the temple survives, now under a royal overseer
  ['mesopotamia-539bc-331bc::b3', 'babylon-1155bc-539bc::b3'],   // the exile -> the community that returned and the one that stayed
  ['mesopotamia-539bc-331bc::o3', 'babylon-1155bc-539bc::e2'],   // the Egibi banking house -> the confiscation that ends the archives
  ['mesopotamia-539bc-331bc::b2', 'babylon-1155bc-539bc::b5'],   // astrology becomes a science -> its great century
  ['mesopotamia-539bc-331bc::b2', 'babylon-1155bc-539bc::t1'],   // mathematical predictive astronomy — one continuous tradition
  ['mesopotamia-539bc-331bc::t1', 'babylon-1155bc-539bc::t5'],   // the seven-century Diaries -> the mature ephemeris
  ['mesopotamia-539bc-331bc::b1', 'babylon-1155bc-539bc::b2'],   // the New Year that remakes the world -> the year with no king to lead it
  ['mesopotamia-539bc-331bc::b4', 'babylon-1155bc-539bc::o3'],   // the Uruk Eanna archive -> the Uruk revival of Anu
  ['mesopotamia-539bc-331bc::l4', 'babylon-1155bc-539bc::l2'],   // the Judean exile by the Nippur canal -> the Judean who stayed
  ['mesopotamia-539bc-331bc::e4', 'babylon-1155bc-539bc::e4'],   // the date-and-canal economy of the south, at its peak
  ['mesopotamia-539bc-331bc::x1', 'babylon-1155bc-539bc::t4'],   // the commentary and the sacred text — the scholarly tradition holds
  // lateral to Egypt (the fellow Persian province, then Alexander):
  ['mesopotamia-539bc-331bc::k1', 'egypt-664bc-332bc::c5'],      // Cambyses' conquest of Egypt at Pelusium
  ['mesopotamia-539bc-331bc::k2', 'egypt-664bc-332bc::k8'],      // Darius I — the canal, the law code and Hibis, in both provinces
  ['mesopotamia-539bc-331bc::o1', 'egypt-664bc-332bc::e5'],      // the tribute of a Persian province
  ['mesopotamia-539bc-331bc::xc3', 'egypt-664bc-332bc::xc4'],    // the Judean diaspora <-> the Jews of Elephantine
  ['mesopotamia-539bc-331bc::o5', 'egypt-664bc-332bc::l4'],      // the military colonist <-> the mercenaries and their names
  ['mesopotamia-539bc-331bc::k6', 'egypt-332bc-30bc::c1'],       // Alexander takes Egypt / enters Babylon
  ['mesopotamia-539bc-331bc::xc5', 'egypt-332bc-30bc::x4'],      // Alexander's Babylonian-capital plan / Alexandria the model Hellenistic city
  // ── assyria-911bc-609bc ∥ babylon-1155bc-539bc (the Ancient-bucket north/south parallel pair) ──
  // The Neo-Assyrian Empire — hand-off backward from the Middle Assyrian Kingdom:
  ['assyria-911bc-609bc::k1', 'assyria-1400bc-1050bc::w4'],   // the dark age that kept the memory -> the recovery
  ['assyria-911bc-609bc::o4', 'assyria-1400bc-1050bc::x1'],   // the painted palace -> the carved narrative wall
  ['assyria-911bc-609bc::x4', 'assyria-1400bc-1050bc::b4'],   // the first Assyrian library -> the Library of Nineveh
  ['assyria-911bc-609bc::b1', 'assyria-1400bc-1050bc::b2'],   // the campaign as holy war -> Ashur's war on the world
  ['assyria-911bc-609bc::o5', 'assyria-1400bc-1050bc::g3'],   // the military machine takes form -> the standing professional army
  ['assyria-911bc-609bc::o2', 'assyria-1400bc-1050bc::e2'],   // deportation as economic policy -> demographic engineering
  ['assyria-911bc-609bc::o1', 'assyria-1400bc-1050bc::o3'],   // the dunnu and the provincial grid -> the provincial reform
  ['assyria-911bc-609bc::e6', 'assyria-1400bc-1050bc::g2'],   // iron enters use -> the iron economy
  ['assyria-911bc-609bc::t4', 'assyria-1400bc-1050bc::x4'],   // the annal -> the articulated ideology of centre and chaos
  // The Neo-Assyrian Empire — lateral to Egypt and Arabia:
  ['assyria-911bc-609bc::c6', 'egypt-1200bc-664bc::c8'],      // Assyria sacks Thebes — Assyrian and Egyptian accounts
  ['assyria-911bc-609bc::c6', 'egypt-1200bc-664bc::k19'],     // <-> Taharqa, the peak and the Assyrian war
  ['assyria-911bc-609bc::c6', 'egypt-1200bc-664bc::xc5'],     // <-> Assyria enters Egypt
  ['assyria-911bc-609bc::xc4', 'qedar-853bc-330bc::x1'],      // Assyria and the Arabs — both sides
  ['assyria-911bc-609bc::xc4', 'qedar-853bc-330bc::k3'],      // <-> the Arab queens
  ['assyria-911bc-609bc::xc4', 'dedan-tayma-1200bc-300bc::k2'], // <-> Taymāʾ and the Assyrians
  // The Neo-Assyrian Empire ∥ Babylon between Assyria and Persia — the parallel folios:
  ['assyria-911bc-609bc::c5', 'babylon-1155bc-539bc::k5'],    // the destruction of Babylon — from each side
  ['assyria-911bc-609bc::o7', 'babylon-1155bc-539bc::c3'],    // the unsolved Babylon problem -> the wars of resistance to Assyria
  ['assyria-911bc-609bc::k6', 'babylon-1155bc-539bc::k4'],    // Sargon II drives out Merodach-Baladan
  ['assyria-911bc-609bc::c7', 'babylon-1155bc-539bc::c4'],    // the fall of Nineveh — Assyrian and Babylonian accounts
  ['assyria-911bc-609bc::c7', 'babylon-1155bc-539bc::k6'],    // Shamash-shum-ukin's revolt begins the collapse
  ['assyria-911bc-609bc::k10', 'babylon-1155bc-539bc::k7'],   // the Assyrian collapse -> Nabopolassar founds the empire
  ['assyria-911bc-609bc::b6', 'babylon-1155bc-539bc::b5'],    // the sky-watch network -> astrology as a mathematical science
  ['assyria-911bc-609bc::t2', 'babylon-1155bc-539bc::t1'],    // predictive astronomy — one Babylonian tradition
  ['assyria-911bc-609bc::b6', 'babylon-1155bc-539bc::t5'],    // the reporting network -> the Astronomical Diaries
  ['assyria-911bc-609bc::xc5', 'babylon-1155bc-539bc::xc2'],  // the Median alliance — from each side
  // ── babylon-1155bc-539bc (Babylon between Assyria and Persia) — further links ──
  ['babylon-1155bc-539bc::k1', 'babylon-1595bc-1155bc::c5'],  // the Elamite sack -> Nebuchadnezzar I recovers Marduk from Elam
  ['babylon-1155bc-539bc::b1', 'babylon-1595bc-1155bc::b1'],  // Marduk's rise -> Marduk becomes king of the gods
  ['babylon-1155bc-539bc::k2', 'babylon-1595bc-1155bc::xc5'], // the Sutean and Aramaean pressure -> the Chaldean centuries
  ['babylon-1155bc-539bc::t5', 'babylon-1595bc-1155bc::t3'],  // the star lists -> the seven-century Astronomical Diaries
  ['babylon-1155bc-539bc::t4', 'babylon-1595bc-1155bc::t1'],  // the scholars as editors -> the text as sacred and the commentary
  ['babylon-1155bc-539bc::x1', 'babylon-1595bc-1155bc::x1'],  // the glazed moulded-brick facade -> the Ishtar Gate at its peak
  ['babylon-1155bc-539bc::b3', 'egypt-664bc-332bc::xc4'],     // the exile and Judaism <-> the Jews of Elephantine
  ['babylon-1155bc-539bc::b3', 'dedan-tayma-1200bc-300bc::b4'], // <-> the first Jews of the northern oases
  ['babylon-1155bc-539bc::xc3', 'dedan-tayma-1200bc-300bc::k3'], // Nabonidus at Taymāʾ — both
  ['babylon-1155bc-539bc::xc3', 'dedan-tayma-1200bc-300bc::x1'], // <-> Babylon reaches the Hejaz
  ['babylon-1155bc-539bc::k10', 'dedan-tayma-1200bc-300bc::k4'], // <-> Nabonidus's oasis campaign
  ['babylon-1155bc-539bc::c5', 'egypt-664bc-332bc::k2'],      // Carchemish — Necho II and Nebuchadnezzar
  ['babylon-1155bc-539bc::c5', 'egypt-664bc-332bc::c2'],      // <-> Megiddo and the death of Josiah on Necho's march north
  ['babylon-1155bc-539bc::k11', 'egypt-664bc-332bc::c5'],     // the Persian conquest of Babylon and then of Egypt at Pelusium
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
  // ── achaemenid-550bc-330bc (the Iran/Persia program, first folio) ──
  // reviewed out of build-xlink-candidates.js's figure_name_matches and keyword_matches;
  // rejected: two "Babylon"/"Achaemenid" matches that were place-name/dynasty-name
  // coincidences with no real date/content overlap, and a Xerxes I vs Xerxes II conflation
  // (two different kings sharing a similar regnal name — exactly CLAUDE.md's warning case).
  ['achaemenid-550bc-330bc::p1', 'mesopotamia-539bc-331bc::k1'],   // Cyrus II -> Cyrus and Cambyses, conquest and continuity
  ['achaemenid-550bc-330bc::c1', 'mesopotamia-539bc-331bc::k1'],   // Cyrus's Conquests -> Cyrus and Cambyses
  ['achaemenid-550bc-330bc::o5', 'mesopotamia-539bc-331bc::k1'],   // Cyrus's Edict for Jerusalem -> Cyrus and Cambyses
  ['achaemenid-550bc-330bc::b5', 'mesopotamia-539bc-331bc::k1'],   // the Cyrus Cylinder -> Cyrus and Cambyses
  ['achaemenid-550bc-330bc::e2', 'mesopotamia-539bc-331bc::k1'],   // the Tomb of Cyrus -> Cyrus and Cambyses
  ['achaemenid-550bc-330bc::p4', 'mesopotamia-539bc-331bc::k2'],   // Darius I -> Darius I and the pretenders on the cliff
  ['achaemenid-550bc-330bc::p5', 'mesopotamia-539bc-331bc::k3'],   // Xerxes I -> Xerxes and the end of 'King of Babylon'
  ['achaemenid-550bc-330bc::p11', 'mesopotamia-539bc-331bc::k5'],  // Artaxerxes III -> Artaxerxes III, Darius III and the fall
  ['achaemenid-550bc-330bc::p13', 'mesopotamia-539bc-331bc::k5'],  // Darius III -> Artaxerxes III, Darius III and the fall
  ['achaemenid-550bc-330bc::c8', 'mesopotamia-539bc-331bc::k6'],   // Alexander's Conquest -> Alexander enters Babylon
  ['achaemenid-550bc-330bc::c7', 'mesopotamia-539bc-331bc::c3'],   // Cunaxa and the March of the Ten Thousand -> Babylonia in the empire's wars
  ['achaemenid-550bc-330bc::o6', 'egypt-664bc-332bc::o3'],         // Darius and the codification of Egyptian law -> the law of Egypt codified
  // ── seleucid-iran-330bc-148bc (Iran/Persia program, second folio) ──
  // rejected: two bare "Seleucid" dynasty-word matches to t2 (Tylos administration and the
  // final loss of Mesopotamia) with no real content overlap with Antiochus III's ideology.
  ['seleucid-iran-330bc-148bc::p1', 'mesopotamia-331bc-141bc::k1'],  // Seleucus I -> Seleucus I, the satrap who won a kingdom
  ['seleucid-iran-330bc-148bc::p2', 'mesopotamia-331bc-141bc::k2'],  // Antiochus I -> Antiochus I, the restorer of the temples
  ['seleucid-iran-330bc-148bc::o4', 'mesopotamia-331bc-141bc::k2'],  // Antiochus I's model of temple patronage -> same Borsippa Cylinder
  ['seleucid-iran-330bc-148bc::t3', 'mesopotamia-331bc-141bc::k2'],  // Berossus dedicated to Antiochus I -> Antiochus I, the restorer of the temples
  ['seleucid-iran-330bc-148bc::p3', 'mesopotamia-331bc-141bc::k3'],  // Antiochus II and Seleucus II -> the same, Mesopotamia's middle reigns
  ['seleucid-iran-330bc-148bc::p4', 'mesopotamia-331bc-141bc::k4'],  // Antiochus III's Anabasis -> the march east and the Roman check
  ['seleucid-iran-330bc-148bc::c6', 'mesopotamia-141bc-224::k1'],    // Mithridates I's conquest of Media -> the Parthian settlement
  ['seleucid-iran-330bc-148bc::t2', 'mesopotamia-539bc-331bc::k1'],  // the memory of Cyrus in Seleucid ideology -> Cyrus and Cambyses
  ['seleucid-iran-330bc-148bc::b2', 'mesopotamia-539bc-331bc::k6'],  // later memory of Alexander's damage -> Alexander enters Babylon
  // ── parthia-148bc-224 (Iran/Persia program, third folio — completes Step 1) ──
  // rejected: generic "Seleucid" dynasty-word matches, and three "Houses" matches that were
  // a different sense of the word entirely (a banking family, a weaving workshop, merchant
  // firms) versus this folio's noble-clan confederacy.
  ['parthia-148bc-224::p1', 'mesopotamia-141bc-224::k1'],            // Mithridates I -> the Parthian settlement (same twin entry)
  ['parthia-148bc-224::p2', 'mesopotamia-141bc-224::k2'],            // Mithridates II -> the height of the empire (same twin entry)
  ['parthia-148bc-224::p3', 'mesopotamia-141bc-224::k3'],            // Orodes II -> Carrhae and the wars with Rome begin (same twin entry)
  ['parthia-148bc-224::p4', 'mesopotamia-141bc-224::k4'],            // Phraates IV to Vologases I (same twin entry)
  ['parthia-148bc-224::p5', 'mesopotamia-141bc-224::k5'],            // Osroes I and the Trajanic war (same twin entry)
  ['parthia-148bc-224::p6', 'mesopotamia-141bc-224::k6'],            // Vologases IV to Artabanus IV (same twin entry)
  ['parthia-148bc-224::p7', 'mesopotamia-141bc-224::o1'],            // the great houses -> the King of Kings and the great houses
  ['parthia-148bc-224::p1', 'mesopotamia-331bc-141bc::c6'],          // Mithridates I's conquest -> Mithridates I takes Babylonia
  ['parthia-148bc-224::p1', 'seleucid-iran-330bc-148bc::c6'],        // Mithridates I's conquest of Media -> same event, Seleucid side
  ['parthia-148bc-224::c4', 'egypt-30bc-300ad::k6'],                 // Trajan's Parthian war -> Trajan, the canal and the Jewish war
  ['parthia-148bc-224::c4', 'hispania-27bc-409ad::k2'],              // Trajan's Parthian war -> Trajan and Hadrian, born at Italica
  ['parthia-148bc-224::c6', 'sassanid-224-484::c1'],                 // Ardashir's rebellion at Hormozdgan -> the Sassanid foundation battle
  // ── iran-651-821 (Iran/Persia program, Step 2) ──
  // rejected: four bare "Abbasid" dynasty-word matches to ec2 with no real content overlap.
  ['iran-651-821::c1', 'sassanid-484-651::k11'],                     // Yazdegerd III's death at Merv -> the same king, Sassanid side
  ['iran-651-821::x2', 'caliphate-750-945::e3'],                     // paper spreads from Samarkand -> paper, the warraqs and the book trade
  // ── zagros-elam-8000bc-3200bc (Iran/Persia program, Step 3 — the Elam chain begins) ──
  // rejected: two bare "Zagros" geography matches spanning a 5,000+ year gap (Neolithic
  // farmers vs. the much later Kassites), and a generic "Herders" match to an unrelated
  // pastoral phenomenon in Arabia with no actual connection to the Zagros.
  ['zagros-elam-8000bc-3200bc::p5', 'uruk-3800bc-2900bc::p1'],       // Susa II and contact with Uruk -> the making of Uruk
  ['zagros-elam-8000bc-3200bc::p5', 'uruk-3800bc-2900bc::p4'],       // Susa II and contact with Uruk -> the Uruk expansion
  ['zagros-elam-8000bc-3200bc::x2', 'uruk-3800bc-2900bc::p1'],       // Uruk settlers or traders at Susa -> the making of Uruk
  ['zagros-elam-8000bc-3200bc::x2', 'uruk-3800bc-2900bc::p4'],       // Uruk settlers or traders at Susa -> the Uruk expansion
  ['zagros-elam-8000bc-3200bc::w2', 'uruk-3800bc-2900bc::p1'],       // the Uruk expansion's eastern edge -> the making of Uruk
  ['zagros-elam-8000bc-3200bc::w2', 'uruk-3800bc-2900bc::p4'],       // the Uruk expansion's eastern edge -> the Uruk expansion
  // ── elam-3200bc-1500bc (Iran/Persia program, Step 3 continued) ──
  // rejected: a bare "Zagros" geography coincidence with the much later Kassites, and a
  // generic "Bronze Age" era-name match with no real content overlap.
  ['elam-3200bc-1500bc::p4', 'babylon-2004bc-1595bc::xc5'],          // the Sukkalmah -> Elam of the Sukkalmah, Babylon's own view
  ['elam-3200bc-1500bc::c1', 'mesopotamia-2334bc-2004bc::k3'],       // the Naram-Sin treaty -> Naram-Sin, god of Akkad
  ['elam-3200bc-1500bc::ec1', 'magan-3000bc-1200bc::tc4'],           // tin and lapis lazuli through Elam -> tin bronze (the complementary copper leg via Magan)
  // ── elam-1500bc-1100bc (Iran/Persia program, Step 3 continued) ──
  // rejected: a generic "Rule" word match to an unrelated Gulf council-governance folio,
  // 1,900 years and an unconnected region apart.
  ['elam-1500bc-1100bc::c3', 'babylon-1155bc-539bc::k1'],            // Nebuchadnezzar I's counter-invasion -> the same event, Babylon's own view
  // ── elam-1100bc-539bc ∥ media-728bc-550bc (Iran/Persia program, Step 3 closes) ──
  // rejected: three bare "Elamite" ethnonym coincidences 600 years apart (Middle Elamite
  // Babylon sack vs. Neo-Elamite religious/linguistic decline), a generic "Babylon" place
  // match, and three "Fragments" word-coincidences (political fragmentation vs. fragmentary
  // surviving Roman historical texts — same word, unrelated meanings).
  ['elam-1100bc-539bc::c4', 'assyria-911bc-609bc::k9'],              // Ashurbanipal's destruction of Susa -> the same king, scholar-king facet
  ['media-728bc-550bc::c5', 'babylon-1155bc-539bc::k11'],            // Cyrus's revolt against Astyages -> the fall of Babylon to Cyrus
  ['media-728bc-550bc::l1', 'babylon-1155bc-539bc::k11'],            // Mandane and the infant Cyrus legend -> the fall of Babylon to Cyrus
  ['media-728bc-550bc::c5', 'mesopotamia-539bc-331bc::k1'],          // Cyrus's revolt against Astyages -> Cyrus and Cambyses, conquest and continuity
  ['media-728bc-550bc::l1', 'mesopotamia-539bc-331bc::k1'],          // Mandane and the infant Cyrus legend -> Cyrus and Cambyses
  // ── iran-821-1055 (Iran/Persia program, Step 4 begins) ──
  // rejected: a generic "Dynasty" word match 2,700 years apart, a "Baghdad" place match to an
  // unrelated financial-history topic, and a bare "Caliphate" institution-name coincidence.
  ['iran-821-1055::o2', 'caliphate-750-945::k12'],                   // the Buyid amirate as a model -> the amir al-umara and the Buyid entry
  ['iran-821-1055::b1', 'caliphate-750-945::k12'],                   // Twelver Shiism under Buyid patronage -> the amir al-umara and the Buyid entry
  ['iran-821-1055::p5', 'caliphate-750-945::w5'],                    // the Buyids, amirate over a powerless caliph -> the Buyids take Baghdad
  ['iran-821-1055::o2', 'caliphate-945-1258::k8'],                   // the Buyid amirate as a model -> Buyid decline and the rise of Ghazna
  ['iran-821-1055::b1', 'caliphate-945-1258::k8'],                   // Twelver Shiism under Buyid patronage -> Buyid decline and the rise of Ghazna
  ['iran-821-1055::p5', 'eastern-arabia-750-1200::w3'],              // the Buyids -> the Buyids take Baghdad, Eastern Arabia's view
  ['iran-821-1055::o2', 'iraq-945-1258::k1'],                        // the Buyid amirate as a model -> the Buyid amirs in the caliph's name, Iraq's own folio
  ['iran-821-1055::b1', 'iraq-945-1258::k1'],                        // Twelver Shiism under Buyid patronage -> the Buyid amirs in the caliph's name
  // ── iran-1055-1219 (Iran/Persia program, Step 4 continued) ──
  // rejected: two "Sunni" matches to Ayyubid Egypt's own separate, century-later Sunni
  // restoration (a parallel trend, not the same movement), and a cluster of bare "Seljuk"
  // dynasty-word mismatches that paired entries with unrelated topics (e.g. an architecture
  // entry matched to a succession-war entry) rather than their real counterparts.
  ['iran-1055-1219::p1', 'caliphate-945-1258::k9'],                  // Tughril Beg founds the sultanate -> the Seljuks take Baghdad
  ['iran-1055-1219::c1', 'caliphate-945-1258::k9'],                  // Tughril Beg enters Baghdad -> the same event
  ['iran-1055-1219::p2', 'caliphate-945-1258::k10'],                 // Alp Arslan -> Alp Arslan, Malik-Shah and Nizam al-Mulk
  ['iran-1055-1219::p3', 'caliphate-945-1258::k10'],                 // Malik-Shah and Nizam al-Mulk -> the same trio
  ['iran-1055-1219::p4', 'caliphate-945-1258::k10'],                 // the fragmentation after Malik-Shah -> the same trio's reign
  ['iran-1055-1219::p2', 'caliphate-945-1258::c3'],                  // Alp Arslan, Manzikert -> Manzikert
  ['iran-1055-1219::c2', 'caliphate-945-1258::c3'],                  // the Battle of Manzikert -> the same battle
  ['iran-1055-1219::w1', 'caliphate-945-1258::c3'],                  // Manzikert's long consequences -> Manzikert
  ['iran-1055-1219::p3', 'caliphate-945-1258::o2'],                  // Malik-Shah and Nizam al-Mulk -> Nizam al-Mulk's manual of rule
  ['iran-1055-1219::c3', 'caliphate-945-1258::o2'],                  // the assassination of Nizam al-Mulk -> the same figure
  ['iran-1055-1219::t2', 'caliphate-945-1258::o2'],                  // the Siyasatnama -> Nizam al-Mulk's manual of rule (the same work)
  ['iran-1055-1219::b2', 'caliphate-945-1258::b1'],                  // the Sunni revival under Seljuk patronage -> the same Sunni revival
  ['iran-1055-1219::b1', 'fatimids-909-1171::b5'],                   // the Nizari state at Alamut -> the da'wa split that produced the Nizaris
  ['iran-1055-1219::p3', 'iraq-945-1258::k3'],                       // Malik-Shah and Nizam al-Mulk -> Nizam al-Mulk and the vizieral state
  ['iran-1055-1219::c3', 'iraq-945-1258::k3'],                       // the assassination of Nizam al-Mulk -> the same figure
  ['iran-1055-1219::t2', 'iraq-945-1258::k3'],                       // the Siyasatnama -> Nizam al-Mulk and the vizieral state
  // ── ilkhanate-1219-1335 (Iran/Persia program, Step 4 continued) ──
  // rejected: a generic "Dynasty" word match 3,300 years apart, a "Baghdad" match to an
  // unrelated painting-school entry, and a generic "Mongol" match pairing a destruction-themed
  // entry with an unrelated later cultural-product entry.
  ['ilkhanate-1219-1335::p3', 'caliphate-945-1258::k13'],            // Hulagu founds the Ilkhanate -> the same, caliphate backbone's view
  ['ilkhanate-1219-1335::c3', 'caliphate-945-1258::k13'],            // Hulagu destroys Alamut -> the same figure
  ['ilkhanate-1219-1335::c4', 'caliphate-945-1258::c10'],            // the sack of Baghdad -> the sack of Baghdad and the check at Ayn Jalut
  ['ilkhanate-1219-1335::p3', 'iraq-945-1258::k8'],                  // Hulagu founds the Ilkhanate -> Iraq's own Hulagu entry
  ['ilkhanate-1219-1335::c3', 'iraq-945-1258::k8'],                  // Hulagu destroys Alamut -> the same figure
  ['ilkhanate-1219-1335::c5', 'mamluks-1250-1517::c1'],              // the Battle of Ayn Jalut -> the same battle, the Mamluk victors' view
  ['ilkhanate-1219-1335::p5', 'iraq-1258-1534::o2'],                 // Ghazan's conversion and reform -> the Ilkhanid reforms and their limits
  ['ilkhanate-1219-1335::p5', 'iraq-1258-1534::g2'],                 // Ghazan's reign -> the Ilkhanid channel from China (Rashid al-Din's own project)
  // ── iran-1335-1501 (Iran/Persia program, Step 4 continued) ──
  // "Timur" names one specific person, not a dynasty label, so these fan out legitimately —
  // his campaigns really did reach all these regions. Rejected: a generic "Sunni" match to an
  // unrelated Mamluk learning-center entry.
  ['iran-1335-1501::p2', 'hormuz-1200-1507::w2'],                    // Timur the conqueror -> Timur's empire and Timurid Persia
  ['iran-1335-1501::c1', 'hormuz-1200-1507::w2'],                    // Timur subdues the regional successors -> same
  ['iran-1335-1501::o1', 'hormuz-1200-1507::w2'],                    // Timur's extractive conquest state -> same
  ['iran-1335-1501::e2', 'hormuz-1200-1507::w2'],                    // Timur's monuments at Samarkand -> same
  ['iran-1335-1501::l2', 'hormuz-1200-1507::w2'],                    // the demographic toll of Timur's campaigns -> same
  ['iran-1335-1501::p1', 'iraq-1258-1534::k2'],                      // the Jalayirids -> the Jalayirids make Baghdad a capital again
  ['iran-1335-1501::p1', 'iraq-1258-1534::c3'],                      // the Jalayirids -> the Turkmen displace the Jalayirids
  ['iran-1335-1501::p2', 'iraq-1258-1534::k3'],                      // Timur the conqueror -> Timur and the two sacks of Baghdad
  ['iran-1335-1501::p2', 'iraq-1258-1534::c2'],                      // Timur the conqueror -> Timur's campaigns and the tower of skulls
  ['iran-1335-1501::c1', 'iraq-1258-1534::k3'],                      // Timur subdues the regional successors -> same
  ['iran-1335-1501::o1', 'iraq-1258-1534::k3'],                      // Timur's extractive conquest state -> same
  ['iran-1335-1501::e2', 'iraq-1258-1534::k3'],                      // Timur's monuments at Samarkand -> same
  ['iran-1335-1501::l2', 'iraq-1258-1534::k3'],                      // the demographic toll of Timur's campaigns -> same
  ['iran-1335-1501::b1', 'iraq-1258-1534::k6'],                      // the Safavid order's quiet beginnings -> the Safavid conquest and the Shia turn
  ['iran-1335-1501::p2', 'mamluks-1250-1517::c7'],                   // Timur the conqueror -> Timur sacks Aleppo and Damascus
  ['iran-1335-1501::c1', 'mamluks-1250-1517::c7'],                   // Timur subdues the regional successors -> same
  ['iran-1335-1501::o1', 'mamluks-1250-1517::c7'],                   // Timur's extractive conquest state -> same
  ['iran-1335-1501::e2', 'mamluks-1250-1517::c7'],                   // Timur's monuments at Samarkand -> same
  ['iran-1335-1501::l2', 'mamluks-1250-1517::c7'],                   // the demographic toll of Timur's campaigns -> same
  // ── safavid-1501-1722 (Iran/Persia program, Step 4 continued) ──
  // rejected: a bare "Ottomans" empire-name mismatch (unrelated Gulf annexation), and two
  // "Forced" adjective coincidences between unrelated conversion/baptism events.
  ['safavid-1501-1722::tc1', 'mamluks-1250-1517::tc1'],              // gunpowder adoption too slow -> the Mamluks' comparable resistance to firearms
  ['safavid-1501-1722::w1', 'portuguese-gulf-1507-1650::k4'],        // the Sunni-Shia fault line with the Ottomans -> the Ottomans annex al-Hasa and Qatif
  ['safavid-1501-1722::p4', 'portuguese-gulf-1507-1650::k5'],        // Shah Abbas's golden age -> Shah Abbas takes Hormuz
  ['safavid-1501-1722::c3', 'portuguese-gulf-1507-1650::k5'],        // Shah Abbas's reconquest -> same
  ['safavid-1501-1722::o2', 'portuguese-gulf-1507-1650::k5'],        // crown land expansion under Shah Abbas -> same
  ['safavid-1501-1722::t2', 'portuguese-gulf-1507-1650::k5'],        // Iskandar Beg Munshi's chronicle -> same (covers this campaign)
  ['safavid-1501-1722::p4', 'portuguese-gulf-1507-1650::w3'],        // Shah Abbas's golden age -> Shah Abbas rebuilds Persian power
  ['safavid-1501-1722::c3', 'portuguese-gulf-1507-1650::w3'],        // Shah Abbas's reconquest -> same
  ['safavid-1501-1722::o2', 'portuguese-gulf-1507-1650::w3'],        // crown land expansion -> same
  ['safavid-1501-1722::t2', 'portuguese-gulf-1507-1650::w3'],        // Iskandar Beg Munshi's chronicle -> same
  // ── canaan-2000bc-1200bc (Levant program) — found by direct content verification, not the
  // automated candidate pipeline (build-xlink-candidates.js surfaced nothing for this folio
  // pair; keyword overlap was too weak despite the events being identical). Confirmed by reading
  // both folios' entries side by side before adding, per the same review standard as the
  // pipeline-sourced pairs above.
  ['canaan-2000bc-1200bc::c1', 'egypt-1550bc-1200bc::c3'],           // the Battle of Megiddo -> the same battle, Egypt's own account
  ['canaan-2000bc-1200bc::p2', 'egypt-1550bc-1200bc::o2'],           // Late Bronze Canaan under Egyptian rule -> ruling Canaan by vassalage
  ['canaan-2000bc-1200bc::c2', 'egypt-1550bc-1200bc::xc1'],          // vassal rivalries in the Amarna Letters -> the Amarna letters and the great kings
  ['canaan-2000bc-1200bc::x1', 'egypt-1550bc-1200bc::xc1'],          // cuneiform diplomacy -> same archive
  ['canaan-2000bc-1200bc::l1', 'egypt-1550bc-1200bc::xc1'],          // the Habiru -> same archive (which itself names "the roving Habiru")
  ['canaan-2000bc-1200bc::ec1', 'egypt-1550bc-1200bc::xc5'],         // the Uluburun shipwreck's cargo -> the same shipwreck, Egypt's own entry
  // ── phoenicia-1200bc-539bc (Levant program, Phase 2) ──
  // rejected: a generic "Mediterranean" match to an unrelated 12th-13th century Ayyubid Egypt
  // entry, and nine bare "Assyrian" dynasty-word matches (my own entry is broadly titled
  // "Assyrian and Babylonian Overlordship", so it shares that one word with dozens of unrelated
  // Assyria-adjacent entries across the corpus) — only one of the ten actually discusses
  // Phoenicia specifically.
  ['phoenicia-1200bc-539bc::c1', 'assyria-911bc-609bc::k3'],         // Shalmaneser III imposes tribute -> the same king
  ['phoenicia-1200bc-539bc::c2', 'assyria-911bc-609bc::k8'],         // Esarhaddon destroys Sidon -> the same king
  ['phoenicia-1200bc-539bc::c3', 'babylon-1155bc-539bc::k8'],        // Nebuchadnezzar II's siege of Tyre -> the same king, Babylon's own view
  ['phoenicia-1200bc-539bc::p3', 'assyria-911bc-609bc::e5'],         // Assyrian and Babylonian overlordship -> the Phoenicians and Arabs under the Assyrian peace
  // ── iran-1722-1789 (Iran/Persia program, Step 4 continued) ──
  // rejected: two bare "Ottoman(s)" empire-name mismatches, and an "East India Company" match to
  // an unrelated 1839 event (Aden) nearly a century after Karim Khan's 1763 agreement.
  ['iran-1722-1789::p2', 'oman-gulf-1650-1820::c2'],                 // Nader Shah -> his forces occupy Oman
  ['iran-1722-1789::p2', 'oman-gulf-1650-1820::w2'],                 // Nader Shah -> a Persian navy on the Gulf
  ['iran-1722-1789::c4', 'oman-gulf-1650-1820::c2'],                 // the assassination of Nader Shah -> same figure
  ['iran-1722-1789::t1', 'oman-gulf-1650-1820::c2'],                 // Marvi's chronicle of Nader Shah -> same figure
  ['iran-1722-1789::c4', 'oman-gulf-1650-1820::w2'],                 // the assassination of Nader Shah -> same figure
  ['iran-1722-1789::t1', 'oman-gulf-1650-1820::w2'],                 // Marvi's chronicle of Nader Shah -> same figure
  // ── qajar-1789-1925 (Iran/Persia program, Step 4 continued) ──
  // rejected: three bare "Iran" country-name matches to an unrelated 1971 event (Iran seizing
  // the Tunbs and Abu Musa), 46 years after this folio ends.
  ['qajar-1789-1925::p2', 'oman-gulf-1650-1820::w6'],                // the early Qajars -> the Qajars take Persia
  // ── israel-judah-1200bc-586bc (Levant program, Phase 2) — several pairs found by direct
  // content verification rather than the automated candidate pipeline, which surfaced the
  // Merneptah, Sennacherib and Sargon II matches but missed the Qarqar/Black Obelisk double
  // match within a single Assyrian entry and the whole Babylonian-exile cluster; confirmed by
  // reading both folios' entries side by side before adding.
  ['israel-judah-1200bc-586bc::p1', 'egypt-1550bc-1200bc::k18'],     // the Merneptah Stele naming Israel -> same stele, Egyptian side
  ['israel-judah-1200bc-586bc::c1', 'assyria-911bc-609bc::k3'],      // Ahab's chariots at Qarqar -> Shalmaneser III names Ahab of Israel
  ['israel-judah-1200bc-586bc::p8', 'assyria-911bc-609bc::k3'],      // Jehu's coup on the Black Obelisk -> same Shalmaneser III entry
  ['israel-judah-1200bc-586bc::c2', 'assyria-911bc-609bc::k6'],      // the fall of Samaria -> Sargon II destroys and deports Israel
  ['israel-judah-1200bc-586bc::c3', 'assyria-911bc-609bc::k7'],      // Sennacherib's siege of Jerusalem -> same king's own reign entry
  ['israel-judah-1200bc-586bc::c4', 'babylon-1155bc-539bc::c5'],     // the 597 BC deportation -> Nebuchadnezzar's Carchemish/Jerusalem/Tyre entry
  ['israel-judah-1200bc-586bc::c5', 'babylon-1155bc-539bc::c5'],     // the 586 BC destruction -> same Nebuchadnezzar campaign entry
  ['israel-judah-1200bc-586bc::c5', 'babylon-1155bc-539bc::k8'],     // the 586 BC destruction -> Nebuchadnezzar II, builder and exiler
  ['israel-judah-1200bc-586bc::w2', 'babylon-1155bc-539bc::b3'],     // exile and an open question -> the exile and the making of Judaism
  ['israel-judah-1200bc-586bc::w2', 'babylon-1155bc-539bc::l2'],     // exile and an open question -> the al-Yahudu Judean exile community
  // ── aram-damascus-1200bc-732bc (Levant program, Phase 2) — the Qarqar coalition told from four
  // sides (Aram, Israel, Assyria, Egypt) and the Tel Dan Stele read from the Damascene side.
  ['aram-damascus-1200bc-732bc::c1', 'israel-judah-1200bc-586bc::c1'],   // Qarqar, Aram's side -> Qarqar, Israel's side
  ['aram-damascus-1200bc-732bc::c1', 'assyria-911bc-609bc::k3'],         // Qarqar -> Shalmaneser III's own Qarqar entry
  ['aram-damascus-1200bc-732bc::c1', 'egypt-1200bc-664bc::c5'],          // Qarqar -> Egypt's minor "Musri" contingent
  ['aram-damascus-1200bc-732bc::p4', 'israel-judah-1200bc-586bc::c1'],   // Hadadezer leads the coalition -> Qarqar, Israel's side
  ['aram-damascus-1200bc-732bc::p4', 'assyria-911bc-609bc::k3'],         // Hadadezer leads the coalition -> Shalmaneser III's own entry
  ['aram-damascus-1200bc-732bc::p4', 'egypt-1200bc-664bc::c5'],          // Hadadezer leads the coalition -> Egypt's minor contingent
  ['aram-damascus-1200bc-732bc::e1', 'israel-judah-1200bc-586bc::p4'],   // the Tel Dan Stele, Damascene reading -> same stele, Davidic reading
  // ── philistia-1200bc-604bc (Levant program, Phase 2 complete) ──
  ['philistia-1200bc-604bc::p1', 'egypt-1200bc-664bc::x1'],          // the Peleset settle the coast -> the Medinet Habu reliefs themselves
  ['philistia-1200bc-604bc::p1', 'egypt-1200bc-664bc::c1'],          // the Peleset settle the coast -> "the Sea Peoples repelled," Egyptian side
  ['philistia-1200bc-604bc::p1', 'egypt-1200bc-664bc::k2'],          // the Peleset settle the coast -> Ramesses III's own reign entry
  ['philistia-1200bc-604bc::p4', 'assyria-911bc-609bc::k6'],         // the Ashdod revolt -> Sargon II's own reign entry
  ['philistia-1200bc-604bc::c2', 'israel-judah-1200bc-586bc::p3'],   // Saul's death at Gilboa -> Saul's own reign entry
  ['philistia-1200bc-604bc::p3', 'israel-judah-1200bc-586bc::p4'],   // Achish and a fugitive David -> David's own reign entry
  // ── levant-539bc-332bc (Levant program, Phase 3) — Cyrus's Edict told from five folios' own
  // angles (Persia's imperial policy, Babylon's conquest x2, Mesopotamia's succession, and here).
  ['levant-539bc-332bc::p1', 'achaemenid-550bc-330bc::o5'],   // Cyrus's Edict -> "Cyrus's Edict for Jerusalem," Persia's own entry
  ['levant-539bc-332bc::p1', 'achaemenid-550bc-330bc::b5'],   // Cyrus's Edict -> the Cyrus Cylinder and Marduk's restoration
  ['levant-539bc-332bc::p1', 'babylon-1155bc-539bc::k11'],    // Cyrus's Edict -> "the fall to Cyrus," Babylon's own conquest entry
  ['levant-539bc-332bc::p1', 'babylon-1155bc-539bc::xc5'],    // Cyrus's Edict -> the Cyrus Cylinder, Babylon's own reading
  ['levant-539bc-332bc::p1', 'mesopotamia-539bc-331bc::k1'],  // Cyrus's Edict -> Cyrus and Cambyses, conquest and continuity
  ['levant-539bc-332bc::p2', 'achaemenid-550bc-330bc::b3'],   // the Second Temple's completion -> same event, Persia's own entry
  ['levant-539bc-332bc::p3', 'achaemenid-550bc-330bc::b4'],   // Nehemiah's mission -> same event, Persia's own entry
  ['levant-539bc-332bc::p6', 'mesopotamia-539bc-331bc::k6'],  // Alexander's arrival -> "Alexander enters Babylon," 331 BC
  // ── hasmonean-332bc-63bc (Levant program, Phase 3 complete) ──
  ['hasmonean-332bc-63bc::p7', 'nabataean-312bc-106ce::c1'],  // Alexander Jannaeus's reign -> "Obodas I defeats Alexander Jannaeus" at Gadara
  // ── herod-judea-63bc-135ce (Levant program, Phase 4) ──
  ['herod-judea-63bc-135ce::p1', 'hasmonean-332bc-63bc::c5'],  // Pompey's Settlement -> Pompey's siege of the Temple Mount, the event it follows
  ['herod-judea-63bc-135ce::p1', 'hasmonean-332bc-63bc::p9'],  // Pompey's Settlement -> the civil war and appeal to Pompey that caused it
  ['herod-judea-63bc-135ce::p2', 'hasmonean-332bc-63bc::p9'],  // Antipater's rise -> same civil war, Antipater's patron Hyrcanus II's side of it
  ['herod-judea-63bc-135ce::p8', 'egypt-30bc-300ad::k5'],      // Vespasian and Titus's reconquest -> "Vespasian proclaimed at Alexandria," same 69 AD departure
  // ── roman-byzantine-levant-135-638 (Levant program, Phase 4 complete) — rejected ~26 generic
  // "Conquest" word-fan-out false positives spanning eras from 2004 BC to the 10th century AD.
  ['roman-byzantine-levant-135-638::p1', 'herod-judea-63bc-135ce::c5'],  // Aelia Capitolina/Syria Palaestina -> the same renaming act
  ['roman-byzantine-levant-135-638::p3', 'egypt-300-641::k1'],           // Constantine's conversion -> "Constantine and the Christian turn," Egypt's side
  ['roman-byzantine-levant-135-638::p4', 'egypt-300-641::k3'],           // Julian's pagan restoration -> "Julian and the pagan last stand," Egypt's side
  ['roman-byzantine-levant-135-638::p5', 'egypt-300-641::k6'],           // Justinian's building/legal legacy -> "Justinian and Egypt"
  ['roman-byzantine-levant-135-638::c2', 'sassanid-484-651::c3'],        // the 614 sack -> "Khosrow II captures Jerusalem," same event, Persian side
  ['roman-byzantine-levant-135-638::c2', 'sassanid-484-651::r4'],        // the 614 sack -> same capture, dual Zoroastrian/Christian framing
  ['roman-byzantine-levant-135-638::p6', 'sassanid-484-651::r3'],        // Persian conquest/restoration -> Khosrow II and Shirin, the same reign's context
  ['roman-byzantine-levant-135-638::c4', 'caliphate-632-750::k2'],       // Jerusalem's surrender to Umar -> Umar's own reign entry
  // ── levant-634-750 (Levant program, Phase 5) — heavy overlap with caliphate-632-750 expected,
  // since this folio is the deliberate "Levant as place" companion to that empire-wide backbone.
  // Rejected: 3 generic "Abbasid" dynasty-name matches to unrelated later-Abbasid-era topics
  // (Egypt's al-Askar governors, Abbasid slavery practices, Abbasid Ḥaramayn patronage), and 2
  // "Jerusalem"/"Temple Mount" matches to herod-judea entries 750+ years earlier — same physical
  // site, no connecting event.
  ['levant-634-750::p4', 'caliphate-632-750::k8'],           // Dome of the Rock -> "Abd al-Malik refounds the state"
  ['levant-634-750::o2', 'caliphate-632-750::k8'],           // currency/language reform -> same Abd al-Malik entry
  ['levant-634-750::b1', 'caliphate-632-750::k8'],           // the Dome's contested purpose -> same Abd al-Malik entry
  ['levant-634-750::p5', 'caliphate-632-750::k9'],           // the Great Mosque of Damascus -> "Al-Walid I — the conquests at their limit"
  ['levant-634-750::c3', 'caliphate-632-750::c8'],           // the sieges of Constantinople -> the first siege, caliphate's own entry
  ['levant-634-750::c3', 'caliphate-632-750::c9'],           // the sieges of Constantinople -> the second siege, caliphate's own entry
  ['levant-634-750::p4', 'caliphate-632-750::b3'],           // the Dome of the Rock -> "the caliph as God's deputy"
  ['levant-634-750::b1', 'caliphate-632-750::b3'],           // the Dome's contested purpose -> same ideological-angle entry
  ['levant-634-750::p4', 'caliphate-632-750::e1'],           // the Dome of the Rock -> "the first monument of Islamic art"
  ['levant-634-750::b1', 'caliphate-632-750::e1'],           // the Dome's contested purpose -> same art-historical entry
  ['levant-634-750::p5', 'caliphate-632-750::e2'],           // the Great Mosque of Damascus -> same building, caliphate's own entry
  ['levant-634-750::e2', 'caliphate-632-750::e3'],           // the desert palaces' figurative art -> "the Umayyad desert palaces"
  ['levant-634-750::c2', 'caliphate-632-750::tc3'],          // the Battle of the Masts -> "the Arab fleet and the Battle of the Masts"
  ['levant-634-750::t1', 'caliphate-632-750::b7'],           // John of Damascus -> "John of Damascus answers Islam"
  ['levant-634-750::p6', 'beth-qatraye-632-750::w5'],        // the Abbasid Revolution -> its ripple effect on the Omani Ibadi imamate
  // ── levant-750-1099 (Levant program, Phase 5 complete) — rejected generic "Baghdad"/"Rule"/
  // "Periphery"/"Fatimid" (decorative-arts and ceremonial-calendar entries)/"Seljuk" (architectural
  // style entry) word-fan-out matches with no specific shared event.
  ['levant-750-1099::p2', 'egypt-641-969::k7'],                  // Ahmad ibn Tulun's autonomous rule -> Egypt's own entry on him
  ['levant-750-1099::p3', 'egypt-641-969::k12'],                 // the Ikhshidids restore Egypt-based rule -> "the end of the Ikhshidids"
  ['levant-750-1099::p4', 'egypt-641-969::c8'],                  // the Fatimid conquest -> "the Fatimid conquest and the Qarmatian aftermath"
  ['levant-750-1099::b1', 'fatimids-909-1171::k5'],              // al-Hakim destroys the Holy Sepulchre -> his own reign entry
  ['levant-750-1099::b2', 'fatimids-909-1171::k5'],              // the Druze faith's origins -> same al-Hakim reign entry
  ['levant-750-1099::b1', 'fatimids-909-1171::lv6'],             // al-Hakim destroys the Holy Sepulchre -> "the caliph as an enigma"
  ['levant-750-1099::b2', 'fatimids-909-1171::lv6'],             // the Druze faith's origins -> same "enigma" entry
  ['levant-750-1099::b1', 'fatimids-909-1171::c5'],              // al-Hakim destroys the Holy Sepulchre -> same event, Fatimid folio's own entry
  ['levant-750-1099::p6', 'fatimids-909-1171::c8'],              // Fatimid reconquest, then the Crusaders -> "the Crusaders take Jerusalem; the Battle of Ascalon"
  ['levant-750-1099::c3', 'fatimids-909-1171::c8'],              // the Crusader capture of Jerusalem -> same event, Fatimid folio's own entry
  ['levant-750-1099::c2', 'eastern-arabia-750-1200::o2'],        // Qarmatian raids -> "the Qarmatian commonwealth of al-Ahsa," their home base
  ['levant-750-1099::c2', 'eastern-arabia-750-1200::o3'],        // Qarmatian raids -> "the Qarmatian toll system on Hajj and shipping"
  ['levant-750-1099::c2', 'eastern-arabia-750-1200::ec2'],       // Qarmatian raids -> "the Qarmatian estates and their thirty thousand slaves"
  // ── crusader-states-1099-1291 (Levant program, Phase 6) — heavy overlap with the dedicated
  // ayyubids-1171-1250 and mamluks-1250-1517 dynasty folios expected, since they narrate the same
  // events from the Muslim side. Several pipeline "Jerusalem"/"Syria"/"Mamluk"/"Acre" matches were
  // re-routed to the correct specific entry after checking content (e.g. ayyubids::c2 "the surrender
  // of Jerusalem" is the 1187 event, matching my c3, not the 1229 or 1244 Jerusalem events the
  // pipeline also proposed it against). Rejected: ayyubids::o4 (coinage), ex3 (decorative citadel
  // facades), hejaz::k8 and mamluks::o1/ex3/lv1/lv5/x7 (Mamluk institutional/artistic/literary
  // topics unrelated to Baibars's specific anti-Crusader campaigns), and a "Dynasty" collision
  // 3000+ years off.
  ['crusader-states-1099-1291::p4', 'ayyubids-1171-1250::k1'],      // Saladin's rise -> "Saladin welds Egypt and Syria into one bloc"
  ['crusader-states-1099-1291::p4', 'ayyubids-1171-1250::k2'],      // Saladin's rise -> "Saladin — the reconquest and the last years"
  ['crusader-states-1099-1291::p4', 'ayyubids-1171-1250::k3'],      // Saladin's rise -> the war of his heirs and al-Adil's rise
  ['crusader-states-1099-1291::c2', 'ayyubids-1171-1250::c1'],      // the Battle of Hattin -> same battle, Ayyubid folio's own entry
  ['crusader-states-1099-1291::c3', 'ayyubids-1171-1250::c2'],      // Jerusalem's 1187 recapture -> "the surrender of Jerusalem," same event
  ['crusader-states-1099-1291::c4', 'ayyubids-1171-1250::c3'],      // the Third Crusade's siege of Acre -> "the siege of Acre," same event
  ['crusader-states-1099-1291::p4', 'ayyubids-1171-1250::c5'],      // Saladin's rise -> "the wars of Saladin's house"
  ['crusader-states-1099-1291::p6', 'ayyubids-1171-1250::c8'],      // Frederick II's 1229 recovery -> "the 1229 cession of Jerusalem," same event
  ['crusader-states-1099-1291::c3', 'ayyubids-1171-1250::o6'],      // Jerusalem's 1187 recapture -> "the re-Islamisation of Jerusalem"
  ['crusader-states-1099-1291::c5', 'ayyubids-1171-1250::c9'],      // the Khwarazmian sack -> same event, Ayyubid folio's own entry
  ['crusader-states-1099-1291::tc1', 'ayyubids-1171-1250::tc1'],    // concentric castle design -> "the answer to the Crusader castle"
  ['crusader-states-1099-1291::p4', 'ayyubids-1171-1250::w1'],      // Saladin's rise -> "Egypt and Syria under one hand"
  ['crusader-states-1099-1291::p6', 'ayyubids-1171-1250::x2'],      // Frederick II's 1229 recovery -> "al-Kamil and Frederick II," the same treaty
  ['crusader-states-1099-1291::p3', 'caliphate-945-1258::c6'],      // Nur al-Din unifies Muslim Syria -> "the unification of Syria under Nur al-Din"
  ['crusader-states-1099-1291::c2', 'caliphate-945-1258::c7'],      // the Battle of Hattin -> "Hattin and the Third Crusade"
  ['crusader-states-1099-1291::c4', 'caliphate-945-1258::c7'],      // the Third Crusade's siege of Acre -> same combined entry
  ['crusader-states-1099-1291::p1', 'caliphate-945-1258::c4'],      // four states founded -> "the First Crusade and the fall of Jerusalem"
  ['crusader-states-1099-1291::p4', 'fatimids-909-1171::v6'],       // Saladin's rise -> "Saladin ends the caliphate"
  ['crusader-states-1099-1291::p8', 'mamluks-1250-1517::c4'],       // the Fall of Acre ends the Crusader states -> same event, Mamluk folio's own entry
  ['crusader-states-1099-1291::p7', 'mamluks-1250-1517::c4'],       // Baibars and the Mamluk reconquest -> same Acre-siege culmination
  ['crusader-states-1099-1291::x1', 'levant-634-750::x1'],          // cross-frontier knowledge transfer -> the same pattern under Umayyad rule
  ['crusader-states-1099-1291::x1', 'levant-750-1099::x1'],         // cross-frontier knowledge transfer -> the same pattern, 750-1099 AD
  ['crusader-states-1099-1291::p4', 'levant-750-1099::p4'],         // Saladin ends the Fatimid caliphate -> the same caliphate's 969 AD founding
  // ── mamluk-syria-1260-1516 (Levant program, Phase 6 complete) — rejected generic "Aleppo"/
  // "Damascus"/"Syria"/"Cairo"/"Mamluk"/"Ottoman" word-fan-out matches to unrelated dynastic-branch,
  // institutional, decorative-arts and other-region topics (Hejaz's own Mamluk overlordship, other
  // Ottoman-era regional conquests entirely unconnected to Marj Dabiq).
  ['mamluk-syria-1260-1516::p1', 'crusader-states-1099-1291::p7'],   // Baibars consolidates Syria -> same figure's Mamluk-reconquest entry
  ['mamluk-syria-1260-1516::p1', 'ayyubids-1171-1250::k11'],         // Baibars consolidates Syria -> "the end of the dynasty in Syria," the direct bridge
  ['mamluk-syria-1260-1516::p1', 'ayyubids-1171-1250::w1'],          // Baibars consolidates Syria -> "Egypt and Syria under one hand," continuity
  ['mamluk-syria-1260-1516::e1', 'ayyubids-1171-1250::ex3'],         // Mamluk-era building -> "the citadels of Syria and the ablaq facade"
  ['mamluk-syria-1260-1516::p2', 'mamluks-1250-1517::ex2'],          // the Circassian transition -> "the carved stone domes of the Circassian period"
  ['mamluk-syria-1260-1516::c3', 'mamluks-1250-1517::c7'],           // Timur's sack -> same event, Mamluk folio's own entry
  ['mamluk-syria-1260-1516::c4', 'mamluks-1250-1517::c11'],          // the Battle of Marj Dabiq -> same event, Mamluk folio's own entry
  ['mamluk-syria-1260-1516::c2', 'mamluks-1250-1517::c2'],           // the Ilkhanid wars -> same three battles, Mamluk folio's own entry
  ['mamluk-syria-1260-1516::b1', 'mamluks-1250-1517::b2'],           // Ibn Taymiyya's influence -> his own entry in the Mamluk backbone folio
  ['mamluk-syria-1260-1516::l1', 'mamluks-1250-1517::b2'],           // Ibn Taymiyya's imprisonment -> same entry
  ['mamluk-syria-1260-1516::ec1', 'mamluks-1250-1517::ec3'],         // the Black Death -> same event, Mamluk folio's own entry
  ['mamluk-syria-1260-1516::ec1', 'mamluks-1250-1517::w4'],          // the Black Death -> its place on the pandemic's western arm
  ['mamluk-syria-1260-1516::p4', 'mamluks-1250-1517::w6'],           // the Ottoman conquest -> "the Ottoman conquest and the end of medieval Egypt"
  ['mamluk-syria-1260-1516::p4', 'mamluks-1250-1517::k14'],          // the Ottoman conquest -> "Al-Ghawri, Tuman Bay and the Ottoman conquest"
  ['mamluk-syria-1260-1516::c3', 'iran-1335-1501::p2'],              // Timur's sack -> "Timur — the Conqueror," his own biography entry
  ['mamluk-syria-1260-1516::p4', 'egypt-1517-1798::k1'],             // the Ottoman conquest -> "Selim I conquers Egypt," the same campaign's next stage
  ['mamluk-syria-1260-1516::p4', 'egypt-1517-1798::c1'],             // the Ottoman conquest -> "Marj Dabiq and al-Raydaniyya"
  ['mamluk-syria-1260-1516::c4', 'egypt-1517-1798::c1'],             // the Battle of Marj Dabiq -> same combined entry
  // ── ottoman-syria-1516-1800 (Levant program, Phase 7) — rejected generic "Ottoman" dynasty-name
  // fan-out to other regions' own, unrelated Ottoman-era conquest narratives (Hejaz, Iraq, Najd,
  // the Portuguese Gulf, Yemen), and a 3000-year-off "Dynasty" collision.
  ['ottoman-syria-1516-1800::p1', 'egypt-1517-1798::k1'],           // the Ottoman conquest completes -> "Selim I conquers Egypt," same campaign continuum
  ['ottoman-syria-1516-1800::p1', 'mamluk-syria-1260-1516::p4'],    // the Ottoman conquest completes -> Baibars/Marj Dabiq entry, same campaign
  ['ottoman-syria-1516-1800::p1', 'mamluks-1250-1517::c11'],        // the Ottoman conquest completes -> "Marj Dabiq," Mamluk folio's own entry
  ['ottoman-syria-1516-1800::p1', 'mamluks-1250-1517::w6'],         // the Ottoman conquest completes -> "the end of medieval Egypt," same campaign
  ['ottoman-syria-1516-1800::p4', 'egypt-1517-1798::c5'],           // Zahir al-Umar's power base -> "Ali Bey's Syrian campaign," which allied with him
  ['ottoman-syria-1516-1800::p4', 'egypt-1517-1798::k9'],           // Zahir al-Umar's power base -> "Abu al-Dhahab's betrayal," which named him too
  ['ottoman-syria-1516-1800::ec1', 'nw-arabia-632-1517::k5'],       // the Damascus Hajj caravan -> "the overlords of the Hajj roads," the same roads' earlier overlords
  ['ottoman-syria-1516-1800::w1', 'iraq-1534-1831::k3'],            // empire-wide decentralisation -> "the localised garrison and the drift from Istanbul," the same pattern in Iraq
  // ── ottoman-syria-1800-1908 (Levant program, Phase 7 complete) — rejected a "Hejaz" match to a
  // later, different-era Kingdom-of-Hejaz governance entry, a "war of the railway" WWI-era conflict
  // entry outside this folio's 1908 cutoff, and a "Local" generic-word collision 2000+ years off.
  ['ottoman-syria-1800-1908::p1', 'egypt-1798-1900::k3'],           // Ibrahim Pasha's occupation -> Egypt's own entry on him
  ['ottoman-syria-1800-1908::p4', 'iraq-1831-1914::k2'],            // Midhat Pasha's governorship -> Iraq's own entry on him (he also governed Baghdad)
  ['ottoman-syria-1800-1908::tc1', 'hejaz-1517-1900::tc3'],         // the Hejaz Railway -> "the Hejaz Railway begins," the same construction start
  ['ottoman-syria-1800-1908::tc1', 'hejaz-1900-1925::tc1'],         // the Hejaz Railway -> the Hejaz folio's own dedicated railway entry
  ['ottoman-syria-1800-1908::tc1', 'hejaz-1900-1925::o1'],          // the Hejaz Railway -> "the Hejaz Railway administration"
  ['ottoman-syria-1800-1908::tc1', 'hejaz-1900-1925::ex1'],         // the Hejaz Railway -> "the Hejaz Railway as monument"
  ['ottoman-syria-1800-1908::p5', 'hejaz-1517-1900::tc3'],          // Abdul Hamid's centralisation and the railway -> the same construction start
  // ── levant-1908-1920 (Levant program, Phase 7 complete) — rejected a "Faisal" namesake collision
  // (King Faisal of Saudi Arabia, 1964-1975, an entirely different person from Sharif Hussein's son
  // Faisal I) and generic "Ottoman"/"Istanbul" word-fan-out to Yemen's own, unrelated Ottoman-era
  // reoccupation narrative.
  ['levant-1908-1920::p3', 'hejaz-1900-1925::k3'],   // the Arab Revolt begins -> "the Revolt and Hussein's sons," same figures
  ['levant-1908-1920::c1', 'hejaz-1900-1925::k3'],   // the Battle of Aqaba -> same entry, which names this campaign directly
  ['levant-1908-1920::c3', 'hejaz-1900-1925::k3'],   // the capture of Damascus -> same entry's northern campaign
  ['levant-1908-1920::o2', 'hejaz-1900-1925::t2'],   // the Sykes-Picot Agreement -> "Sykes-Picot and the Balfour Declaration," combined entry
  ['levant-1908-1920::o3', 'hejaz-1900-1925::t2'],   // the Balfour Declaration -> same combined entry
  // ── mandate-syria-lebanon-1920-1946 (Levant program, Phase 8) — rejected two "Revolt" matches to
  // hejaz-1900-1925's 1916-1918 Arab Revolt (a different, earlier revolt against the Ottomans, not
  // the 1925-1927 Great Syrian Revolt against France) and two wildly mismatched "Religious"/"Ports"
  // word collisions with modern Oman.
  ['mandate-syria-lebanon-1920-1946::p1', 'iraq-1914-1958::k1'],   // the French Mandate established -> "the conquest and the Mandate," the same 1920 San Remo Conference's parallel British outcome
  // ── mandate-palestine-transjordan-1920-1948 (Levant program, Phase 8 complete) — rejected another
  // "Revolt" collision with hejaz-1900-1925's different, earlier Arab Revolt, an "Abdullah" namesake
  // collision (Saudi Arabia's King Abdullah, 2005-2015, an entirely different person from Transjordan's
  // Abdullah I), and three generic "Britain" word-fan-out matches to unrelated Trucial Gulf topics.
  ['mandate-palestine-transjordan-1920-1948::p1', 'iraq-1914-1958::k1'],       // the Palestine Mandate established -> the same 1920 San Remo Conference's parallel Iraq outcome
  ['mandate-palestine-transjordan-1920-1948::o1', 'iraq-1914-1958::k1'],      // the Mandate's structural tension -> same San Remo Conference entry
  ['mandate-palestine-transjordan-1920-1948::p1', 'hejaz-1900-1925::t2'],     // the Mandate incorporates Balfour's language -> "Sykes-Picot and the Balfour Declaration"
  ['mandate-palestine-transjordan-1920-1948::p1', 'levant-1908-1920::o3'],    // the Mandate incorporates Balfour's language -> the Balfour Declaration's own earlier entry
  // ── lebanon-1943-today (Levant program, Phase 9) — the pipeline proposed c1 (1975 war outbreak)
  // against the same target on a weak "National Pact" keyword match, but the precise match is my
  // own p1, which explicitly discusses continuity from the same 1943 National Pact founding.
  ['lebanon-1943-today::p1', 'mandate-syria-lebanon-1920-1946::p5'],   // the National Pact's system in practice -> the same Pact's 1943 founding entry
  // ── jordan-1946-today (Levant program, Phase 9) — rejected a "Hussein" namesake collision
  // (Sharif Hussein bin Ali of the Hejaz, an earlier generation, not King Hussein of Jordan), a
  // generic "West" collision, and 9 generic "United States"/"Washington"/"Saudi Arabia" matches to
  // unrelated Gulf states' own separate US-relationship entries. The one genuine find was better
  // matched to an earlier folio than to this one directly:
  ['mandate-palestine-transjordan-1920-1948::p2', 'hejaz-1900-1925::k6'],   // Transjordan separated under Abdullah I -> "the Hashemite thrones abroad," the same 1921 founding
  // ── israel-1948-today / palestine-1948-today (Levant program, Phase 9 — the program's final pair)
  // — the core parallel-folio cross-linking at shared events, per the user's approved structure
  // decision that these two folios narrate the same conflict from each side without either
  // narrating the other's own history. Rejected generic "Washington"/"United States"/"Peace"(one
  // partial exception below)/"Religious"/"West"/"Security Council" word-fan-out matches to unrelated
  // entries in Bahrain, Iran, Iraq, Kuwait, Oman, Qatar and mandate-palestine-transjordan's own 1929
  // riots entry (19 years off from israel::c1's 1948 war).
  ['israel-1948-today::c1', 'palestine-1948-today::c1'],      // the 1948 War -> the Nakba, same war, each side's own framing
  ['israel-1948-today::c4', 'palestine-1948-today::c2'],      // the First Intifada, both sides
  ['israel-1948-today::c5', 'palestine-1948-today::c3'],      // the Second Intifada, both sides
  ['israel-1948-today::c6', 'palestine-1948-today::c5'],      // recurring Gaza conflicts 2008-2021, both sides
  ['israel-1948-today::c7', 'palestine-1948-today::c6'],      // October 7 -> the Gaza War's catastrophe
  ['israel-1948-today::c8', 'palestine-1948-today::c6'],      // the Gaza War, both sides
  ['israel-1948-today::p5', 'palestine-1948-today::p5'],      // the Oslo Accords, both sides
  ['israel-1948-today::p4', 'jordan-1946-today::p4'],         // peace with Egypt -> peace with Israel, the same diplomatic pattern Jordan's treaty followed
  ['israel-1948-today::c2', 'egypt-1952-today::c3'],          // the Six-Day War -> "the Six-Day War and the loss of Sinai," Egypt's own entry
  ['israel-1948-today::w1', 'bahrain-1971-today::x4'],        // the Abraham Accords -> Bahrain's own entry on the same agreements
  ['israel-1948-today::w1', 'uae-1971-today::x1'],            // the Abraham Accords -> the UAE's own entry on the same agreements
  ['jordan-1946-today::p3', 'palestine-1948-today::p4'],      // Jordan's 1988 West Bank disengagement -> the PLO's 1988 declaration of independence it directly enabled
  ['jordan-1946-today::l1', 'palestine-1948-today::l1'],      // a refugee family's story in Jordan -> the same multi-generational refugee experience, region-wide
  ['israel-1948-today::p1', 'mandate-palestine-transjordan-1920-1948::p6'],  // independence declared -> Britain's UN referral this directly followed
  ['israel-1948-today::c1', 'mandate-palestine-transjordan-1920-1948::c4'],  // the 1948 War -> the civil-war phase immediately preceding it
  ['palestine-1948-today::p1', 'mandate-palestine-transjordan-1920-1948::t2'], // Palestinian leadership fragments -> the earlier Mandate-era political organising it interrupted
  ['israel-1948-today::e1', 'mandate-palestine-transjordan-1920-1948::t1'], // Hebrew's cultural maturation -> its earlier Mandate-era revival as a spoken vernacular
  // ── north-syria-1200bc-717bc (Levant program addendum, new 5th Iron Age parallel thread) —
  // extends the Qarqar coalition's cross-link web (already Aram-Damascus/Israel-Judah/Assyria/Egypt)
  // to Hamath's own contribution, the third-largest after Damascus and Israel. Rejected a "Sargon"
  // namesake collision (Sargon of Akkad, 3rd millennium BC, unrelated to Sargon II of Assyria).
  ['north-syria-1200bc-717bc::c1', 'aram-damascus-1200bc-732bc::c1'],      // Hamath at Qarqar -> Aram's own Qarqar entry
  ['north-syria-1200bc-717bc::c1', 'israel-judah-1200bc-586bc::c1'],       // Hamath at Qarqar -> Israel's own Qarqar entry
  ['north-syria-1200bc-717bc::c1', 'egypt-1200bc-664bc::c5'],              // Hamath at Qarqar -> Egypt's minor "Musri" contingent
  ['north-syria-1200bc-717bc::c1', 'assyria-911bc-609bc::k3'],             // Hamath at Qarqar -> Shalmaneser III's own entry, which names Hamath directly
  ['north-syria-1200bc-717bc::p3', 'assyria-911bc-609bc::k3'],             // Irhuleni's reign -> same Shalmaneser III entry
  ['north-syria-1200bc-717bc::c2', 'assyria-911bc-609bc::k3'],             // Shalmaneser III's campaigns against Bit-Adini/Unqi -> same king's own entry
  ['north-syria-1200bc-717bc::c3', 'assyria-911bc-609bc::k6'],             // Sargon II crushes Hamath's revolt -> Sargon II's own reign entry
  ['north-syria-1200bc-717bc::p6', 'assyria-911bc-609bc::k6'],             // Yau-bidi's revolt -> same Sargon II entry
  // ── decapolis-63bc-106ce (Levant program addendum) — rejected two generic "Trajan" matches to
  // unrelated topics (Egypt's own canal/fortress works, Hispania's imperial-birthplace entry).
  ['decapolis-63bc-106ce::c1', 'hasmonean-332bc-63bc::p7'],   // Alexander Jannaeus's campaigns against the cities -> his own reign entry
  // ── gap-filling addendum (2026-10-01): levant-539bc-332bc's period.start widened from -539 to
  // -604 to add a bridging entry for Philistia's previously uncovered 604-539 BC aftermath, closing
  // a 65-year gap identified in a continuity audit (Philistia's own folio ends at the destruction
  // itself; babylon-1155bc-539bc's own campaign entry never mentions Ashkelon at all).
  ['levant-539bc-332bc::p0', 'philistia-1200bc-604bc::c3'],   // Ashkelon's king captured -> the destruction itself, this folio's own direct continuation
  // continuity-audit fix #2 (2026-10-01): jordan-1946-today had no link back to the Mandate
  // folio's own independence entry, despite jordan-1946-today::p1 being Abdullah I's reign
  // directly continuing from it (no new content added, per the user's chosen fix option).
  ['jordan-1946-today::p1', 'mandate-palestine-transjordan-1920-1948::p5'],   // Abdullah I's reign continues -> Transjordan's 1946 independence itself
  // continuity-audit fix #3 (2026-10-01): roman-byzantine-levant-135-638 was previously silent on
  // what became of the former Decapolis cities after Trajan's 106 AD annexation; added e3
  // acknowledging their continued, in several cases accelerated, building and prosperity under
  // direct provincial rule, cross-linked back to the Decapolis folio's own closing entries.
  ['roman-byzantine-levant-135-638::e3', 'decapolis-63bc-106ce::p5'],   // the building boom that followed -> the 106 AD annexation itself
  ['roman-byzantine-levant-135-638::e3', 'decapolis-63bc-106ce::e1'],   // Gerasa's provincial-period architecture -> its own earlier Decapolis-period forum and streets
  ['roman-byzantine-levant-135-638::e3', 'decapolis-63bc-106ce::e2'],   // Scythopolis's Byzantine-era growth -> its own earlier Decapolis-period theater
  // ── eastern-Iran coverage addition (2026-10-06): reviewed candidates only. Rejected the pipeline's
  // word-fan-out matches: 'Sasanian' (Gulf folios), 'Revolt' (Hejaz Arab Revolt), 'Iran'/'Iranian' (Trucial/Oman),
  // 'Alexander' (Babylon entry for a different event), and 'Shah Abbas' (Hormuz 1622 vs the Khorasan entries).
  ['caliphate-945-1258::c5', 'iran-1055-1219::c6'],                     // Qatwan from the caliphal side -> the same 1141 battle in the Seljuk-era folio
  ['ilkhanate-1219-1335::p7', 'iran-1335-1501::p1'],                    // the Karts of Herat as Mongol vassals -> the Karts among the post-Ilkhanid successors
  ['qajar-1789-1925::x3', 'pahlavi-1925-1979::x3'],                     // the Goldsmid and McMahon Sistan awards -> the 1973 Helmand treaty built on them
  ['pahlavi-1925-1979::x3', 'iran-1979-today::ec3'],                    // the 1973 treaty -> the unratified treaty behind the Hamoun and Helmand dispute
  ['achaemenid-550bc-330bc::w4', 'seleucid-iran-330bc-148bc::c7'],      // Darius murdered by Bessus in Bactria -> Alexander's pursuit and the Spitamenes revolt
  ['anatolia-10000bc-3000bc::x1', 'levant-neolithic-10000bc-2000bc::x1'],      // Cappadocian obsidian in the Levant
  ['anatolia-10000bc-3000bc::x1', 'mesopotamia-6500bc-3800bc::xc1'],      // Anatolian obsidian reaching Mesopotamia
  ['anatolia-10000bc-3000bc::x1', 'zagros-elam-8000bc-3200bc::x1'],      // Anatolian obsidian reaching Susiana
  ['anatolia-10000bc-3000bc::b5', 'levant-neolithic-10000bc-2000bc::b1'],      // plastered skulls: Çatalhöyük and Jericho
  ['anatolia-10000bc-3000bc::x5', 'uruk-3800bc-2900bc::p4'],      // Hacinebi enclave -> the Uruk expansion
  ['anatolia-10000bc-3000bc::x5', 'uruk-3800bc-2900bc::c3'],      // Hacinebi enclave beside Habuba Kabira
  ['anatolia-10000bc-3000bc::x4', 'mesopotamia-6500bc-3800bc::xc4'],      // Ubaid goods up the Euphrates to Cilicia
  ['anatolia-10000bc-3000bc::o2', 'mesopotamia-6500bc-3800bc::o2'],      // stamp seals in Anatolia and the Mesopotamian north
  ['anatolia-10000bc-3000bc::b6', 'mesopotamia-6500bc-3800bc::p3'],      // Halaf of Domuztepe -> the Halaf painted-pottery north
  ['anatolia-3000bc-2000bc::c4', 'mesopotamia-2334bc-2004bc::k1'],      // Sargon of Akkad: the legend of his march to Purushanda
  ['anatolia-3000bc-2000bc::w1', 'mesopotamia-2334bc-2004bc::w1'],      // the 4.2 ka drought and Anatolia
  ['anatolia-3000bc-2000bc::ec1', 'sumer-2900bc-2334bc::g2'],      // the question of where early bronze got its tin
  ['anatolia-3000bc-2000bc::ec1', 'elam-3200bc-1500bc::ec1'],      // tin and lapis routes
  ['anatolia-3000bc-2000bc::x3', 'sumer-2900bc-2334bc::xc2'],      // lapis roads reaching Troy
  ['anatolia-3000bc-2000bc::x3', 'uruk-3800bc-2900bc::xc3'],      // lapis road
  ['anatolia-3000bc-2000bc::e5', 'sumer-2900bc-2334bc::x4'],      // lyres of the Ur tombs and the lyres on Anatolian seals
  ['anatolia-3000bc-2000bc::p9', 'anatolia-10000bc-3000bc::c3'],      // the burnt palace and what followed on the mound
  ['anatolia-3000bc-2000bc::p10', 'anatolia-10000bc-3000bc::w4'],      // Kura-Araxes in eastern Anatolia
  ['anatolia-3000bc-2000bc::x2', 'anatolia-10000bc-3000bc::w4'],      // Kura-Araxes network
  ['kanesh-2000bc-1650bc::x1', 'babylon-2004bc-1595bc::e2'],      // the Assur–Kanesh donkey caravans
  ['kanesh-2000bc-1650bc::o2', 'babylon-2004bc-1595bc::xc1'],      // the karum as extraterritorial colony
  ['kanesh-2000bc-1650bc::x2', 'babylon-2004bc-1595bc::xc2'],      // the tin route
  ['kanesh-2000bc-1650bc::p4', 'babylon-2004bc-1595bc::k6'],      // Old Assyrian Assur as merchant city-state
  ['kanesh-2000bc-1650bc::p5', 'babylon-2004bc-1595bc::k4'],      // Shamshi-Adad and his Upper Mesopotamian kingdom
  ['kanesh-2000bc-1650bc::l1', 'babylon-2004bc-1595bc::l3'],      // merchant wives in Assur
  ['kanesh-2000bc-1650bc::x2', 'anatolia-3000bc-2000bc::ec1'],      // the tin question: Taurus workings and the tin route from the east
  ['hittite-1650bc-1180bc::c2', 'babylon-2004bc-1595bc::c6'],      // Mursili I sacks Babylon
  ['hittite-1650bc-1180bc::c2', 'babylon-2004bc-1595bc::k11'],      // Samsu-ditana and the Hittite sack
  ['hittite-1650bc-1180bc::c7', 'egypt-1550bc-1200bc::c6'],      // the battle of Kadesh from both sides
  ['hittite-1650bc-1180bc::x1', 'egypt-1550bc-1200bc::c7'],      // the Egyptian–Hittite treaty
  ['hittite-1650bc-1180bc::p10', 'egypt-1550bc-1200bc::k17'],      // Hattusili III and Ramesses II: the peace
  ['hittite-1650bc-1180bc::x2', 'egypt-1550bc-1200bc::k13'],      // the widow of Tutankhamun writes to Suppiluliuma
  ['hittite-1650bc-1180bc::x3', 'egypt-1550bc-1200bc::xc1'],      // the Amarna letters and the great kings
  ['hittite-1650bc-1180bc::x3', 'canaan-2000bc-1200bc::w1'],      // the Great Powers club
  ['hittite-1650bc-1180bc::x3', 'babylon-1595bc-1155bc::o4'],      // rules of the Great Kings club
  ['hittite-1650bc-1180bc::l1', 'egypt-1550bc-1200bc::xc2'],      // marriage diplomacy with Egypt
  ['hittite-1650bc-1180bc::x6', 'canaan-2000bc-1200bc::ec1'],      // the Uluburun ship cargo
  ['hittite-1650bc-1180bc::x6', 'egypt-1550bc-1200bc::xc5'],      // the Uluburun ship
  ['hittite-1650bc-1180bc::c8', 'assyria-1400bc-1050bc::c2'],      // Nihriya from the Hittite side
  ['hittite-1650bc-1180bc::c5', 'assyria-1400bc-1050bc::c1'],      // the fall of Mitanni
  ['hittite-1650bc-1180bc::w1', 'assyria-1400bc-1050bc::k3'],      // Assyria absorbs Mitanni
  ['hittite-1650bc-1180bc::c9', 'assyria-1400bc-1050bc::xc3'],      // the Hittite frontier and the fall of Hatti
  ['hittite-1650bc-1180bc::w4', 'egypt-1550bc-1200bc::w1'],      // the end of the Bronze Age
  ['hittite-1650bc-1180bc::w4', 'canaan-2000bc-1200bc::w2'],      // the collapse that ended an age
  ['hittite-1650bc-1180bc::w4', 'babylon-1595bc-1155bc::w4'],      // the Bronze Age crisis
  ['hittite-1650bc-1180bc::w3', 'egypt-1550bc-1200bc::w5'],      // the drying of the eastern Mediterranean
  ['hittite-1650bc-1180bc::p13', 'north-syria-1200bc-717bc::p1'],      // the Carchemish line after Hattusa
  ['hittite-1650bc-1180bc::g5', 'north-syria-1200bc-717bc::tc1'],      // iron: not a guarded Hittite secret
  ['hittite-1650bc-1180bc::p1', 'kanesh-2000bc-1650bc::p6'],      // Hattusili as heir of the Kussaran kings and the curse on Hattusa
  ['phrygia-1200bc-675bc::c1', 'assyria-1400bc-1050bc::k8'],      // Tiglath-Pileser I and the Mushki
  ['phrygia-1200bc-675bc::c1', 'assyria-1400bc-1050bc::c4'],      // the campaigns of Tiglath-Pileser I
  ['phrygia-1200bc-675bc::c3', 'assyria-911bc-609bc::k6'],      // Sargon II in Tabal and Que
  ['phrygia-1200bc-675bc::c4', 'assyria-911bc-609bc::k6'],      // the death of Sargon II
  ['phrygia-1200bc-675bc::c6', 'assyria-911bc-609bc::c2'],      // the long war with Urartu
  ['phrygia-1200bc-675bc::p7', 'north-syria-1200bc-717bc::p7'],      // Carchemish and Phrygia in Sargon II's reign
  ['phrygia-1200bc-675bc::t2', 'north-syria-1200bc-717bc::o1'],      // Two scripts, two languages: Luwian and Phoenician at court
  ['phrygia-1200bc-675bc::e3', 'north-syria-1200bc-717bc::e1'],      // Neo-Hittite orthostat reliefs
  ['phrygia-1200bc-675bc::p6', 'north-syria-1200bc-717bc::b1'],      // storm god in Neo-Hittite religion
  ['phrygia-1200bc-675bc::g2', 'hittite-1650bc-1180bc::g5'],      // iron and bronze after the Hittites
  ['ionia-1050bc-494bc::c5', 'achaemenid-550bc-330bc::c3'],      // the Ionian Revolt from both sides
  ['ionia-1050bc-494bc::c6', 'achaemenid-550bc-330bc::c3'],      // the Ionian Revolt: Lade and the fall of Miletus
  ['ionia-1050bc-494bc::c4', 'achaemenid-550bc-330bc::c1'],      // the Persian conquest of Lydia and the Ionian coast
  ['ionia-1050bc-494bc::o4', 'achaemenid-550bc-330bc::o2'],      // the fixed tribute assessment
  ['ionia-1050bc-494bc::p6', 'achaemenid-550bc-330bc::tc1'],      // Sardis and the Royal Road
  ['ionia-1050bc-494bc::x2', 'egypt-664bc-332bc::e1'],      // Naukratis and regulated Greek trade
  ['ionia-1050bc-494bc::x2', 'egypt-664bc-332bc::xc1'],      // the Greeks settle in Egypt
  ['ionia-1050bc-494bc::x4', 'egypt-664bc-332bc::k1'],      // Psamtik I and the Ionian mercenaries
  ['ionia-1050bc-494bc::x4', 'egypt-664bc-332bc::k3'],      // Psamtik II and the Abu Simbel graffiti
  ['ionia-1050bc-494bc::x4', 'egypt-664bc-332bc::l4'],      // the mercenaries and their names
  ['ionia-1050bc-494bc::t1', 'media-728bc-550bc::c4'],      // the battle of the eclipse
  ['ionia-1050bc-494bc::c4', 'babylon-1155bc-539bc::xc4'],      // the gathering of Persia and Croesus
  ['ionia-1050bc-494bc::p1', 'hittite-1650bc-1180bc::x4'],      // Millawanda and Ahhiyawa before the Ionians
  ['lydia-685bc-546bc::p5', 'ionia-1050bc-494bc::p5'],      // Croesus and the Ionian cities
  ['lydia-685bc-546bc::p4', 'ionia-1050bc-494bc::p3'],      // Alyattes and Thrasybulus of Miletus
  ['lydia-685bc-546bc::p4', 'ionia-1050bc-494bc::c3'],      // Alyattes' war on Miletus
  ['lydia-685bc-546bc::p4', 'ionia-1050bc-494bc::c2'],      // Alyattes takes Smyrna
  ['lydia-685bc-546bc::ec1', 'ionia-1050bc-494bc::ec1'],      // the first coins
  ['lydia-685bc-546bc::c4', 'ionia-1050bc-494bc::c4'],      // Sardis and the conquest of the Ionian cities
  ['lydia-685bc-546bc::c1', 'phrygia-1200bc-675bc::c5'],      // the Cimmerians at Gordion and Sardis
  ['lydia-685bc-546bc::w1', 'phrygia-1200bc-675bc::w3'],      // the Cimmerian shock
  ['lydia-685bc-546bc::c2', 'media-728bc-550bc::c4'],      // the battle of the Eclipse
  ['lydia-685bc-546bc::x2', 'media-728bc-550bc::x2'],      // the marriage alliance with Lydia
  ['lydia-685bc-546bc::c4', 'achaemenid-550bc-330bc::c1'],      // Cyrus conquers Lydia
  ['lydia-685bc-546bc::x3', 'babylon-1155bc-539bc::xc4'],      // Croesus's alliances and the gathering of Persia
  ['lydia-685bc-546bc::x3', 'egypt-664bc-332bc::k5'],      // Amasis and the Lydian alliance
  ['lydia-685bc-546bc::x1', 'assyria-911bc-609bc::k9'],      // Ashurbanipal receives the envoys of Gyges
  ['lydia-685bc-546bc::x1', 'egypt-664bc-332bc::k1'],      // Gyges's troops to Psamtik I
  ['persian-anatolia-546bc-334bc::c2', 'achaemenid-550bc-330bc::c3'],      // the Ionian Revolt in Caria
  ['persian-anatolia-546bc-334bc::c3', 'achaemenid-550bc-330bc::c4'],      // the Greco-Persian wars: Salamis and Artemisia
  ['persian-anatolia-546bc-334bc::x2', 'achaemenid-550bc-330bc::c6'],      // the subsidy of Sparta
  ['persian-anatolia-546bc-334bc::c5', 'achaemenid-550bc-330bc::c7'],      // Cunaxa and the Ten Thousand
  ['persian-anatolia-546bc-334bc::p1', 'achaemenid-550bc-330bc::o1'],      // the satrapy system
  ['persian-anatolia-546bc-334bc::o1', 'achaemenid-550bc-330bc::o2'],      // the fixed tribute assessment
  ['persian-anatolia-546bc-334bc::o2', 'achaemenid-550bc-330bc::tc1'],      // the Royal Road
  ['persian-anatolia-546bc-334bc::t1', 'achaemenid-550bc-330bc::t2'],      // Herodotus of Halicarnassus
  ['persian-anatolia-546bc-334bc::c8', 'achaemenid-550bc-330bc::c8'],      // Alexander's conquest of the empire: the Granicus
  ['persian-anatolia-546bc-334bc::c1', 'ionia-1050bc-494bc::c4'],      // Harpagus conquers the Ionian cities and Lycia
  ['persian-anatolia-546bc-334bc::o1', 'ionia-1050bc-494bc::o4'],      // the first tribute district
  ['persian-anatolia-546bc-334bc::p1', 'lydia-685bc-546bc::w3'],      // Sardis after the Mermnads
  ['persian-anatolia-546bc-334bc::t4', 'ionia-1050bc-494bc::c6'],      // Hippodamus replans Miletus after its sack
  ['persian-anatolia-546bc-334bc::l1', 'ionia-1050bc-494bc::c5'],      // Ionian and Carian forces in the Persian wars
  ['hellenistic-anatolia-334bc-133bc::p1', 'persian-anatolia-546bc-334bc::c8'],      // Alexander at the Granicus and the Persian west
  ['hellenistic-anatolia-334bc-133bc::p1', 'achaemenid-550bc-330bc::c8'],      // Alexander's conquest of the empire
  ['hellenistic-anatolia-334bc-133bc::c2', 'mesopotamia-331bc-141bc::c2'],      // Ipsus and the ownership of the east
  ['hellenistic-anatolia-334bc-133bc::p4', 'mesopotamia-331bc-141bc::k1'],      // Seleucus I
  ['hellenistic-anatolia-334bc-133bc::p4', 'seleucid-iran-330bc-148bc::p1'],      // Seleucus I
  ['hellenistic-anatolia-334bc-133bc::c8', 'seleucid-iran-330bc-148bc::c5'],      // the battle of Magnesia
  ['hellenistic-anatolia-334bc-133bc::p5', 'mesopotamia-331bc-141bc::k4'],      // Antiochus III the Great
  ['hellenistic-anatolia-334bc-133bc::p5', 'seleucid-iran-330bc-148bc::p4'],      // Antiochus III the Great
  ['hellenistic-anatolia-334bc-133bc::w1', 'seleucid-iran-330bc-148bc::w1'],      // the Wars of the Successors
  ['hellenistic-anatolia-334bc-133bc::x3', 'egypt-332bc-30bc::c4'],      // Galatian mercenaries at Raphia
  ['hellenistic-anatolia-334bc-133bc::t2', 'mesopotamia-331bc-141bc::t5'],      // Hipparchus and the Babylonian parameters
  ['roman-anatolia-133bc-330::o7', 'rome-200-300::o3'],      // Diocletian's Edict of Maximum Prices
  ['roman-anatolia-133bc-330::p11', 'rome-200-300::p17'],      // Diocletian
  ['roman-anatolia-133bc-330::b7', 'rome-200-300::r6'],      // the Great Persecution begins
  ['roman-anatolia-133bc-330::p12', 'rome-300-400::p4'],      // Constantine I
  ['roman-anatolia-133bc-330::b8', 'rome-300-400::r1'],      // the Council of Nicaea
  ['roman-anatolia-133bc-330::o5', 'egypt-30bc-300ad::k10'],      // Caracalla's citizenship edict
  ['roman-anatolia-133bc-330::c11', 'rome-200-300::c5'],      // Valerian captured at Edessa
  ['roman-anatolia-133bc-330::c11', 'mesopotamia-224-637::k2'],      // Shapur I and the captured emperors
  ['roman-anatolia-133bc-330::p10', 'palmyrene-100bc-273ce::c3'],      // Zenobia conquers Asia Minor
  ['roman-anatolia-133bc-330::w3', 'rome-200-300::s4'],      // the Antonine plague
  ['roman-anatolia-133bc-330::p3', 'herod-judea-63bc-135ce::p1'],      // Pompey's settlement of the East
  ['roman-anatolia-133bc-330::p3', 'decapolis-63bc-106ce::p2'],      // Pompey liberates the cities
  ['roman-anatolia-133bc-330::p1', 'hellenistic-anatolia-334bc-133bc::w5'],      // the king's will and the province of Asia
  ['roman-anatolia-133bc-330::p10', 'rome-200-300::p13'],      // Valerian
  ['late-roman-anatolia-330-632::p1', 'rome-300-400::p7'],      // Julian
  ['late-roman-anatolia-330-632::b5', 'rome-300-400::r4'],      // Julian's pagan restoration
  ['late-roman-anatolia-330-632::b5', 'roman-byzantine-levant-135-638::p4'],      // Julian's pagan restoration
  ['late-roman-anatolia-330-632::o6', 'rome-300-400::r2'],      // the Council of Constantinople
  ['late-roman-anatolia-330-632::b3', 'rome-400-500::r1'],      // the Council of Ephesus
  ['late-roman-anatolia-330-632::b4', 'rome-400-500::r3'],      // the Council of Chalcedon
  ['late-roman-anatolia-330-632::b4', 'egypt-300-641::b3'],      // Chalcedon and the Coptic split
  ['late-roman-anatolia-330-632::p3', 'rome-300-400::p12'],      // Theodosius I
  ['late-roman-anatolia-330-632::w1', 'rome-300-400::o3'],      // the foundation of Constantinople
  ['late-roman-anatolia-330-632::g3', 'rome-300-400::te1'],      // Constantinople's water infrastructure
  ['late-roman-anatolia-330-632::g1', 'rome-400-500::s2'],      // earthquakes at Constantinople
  ['late-roman-anatolia-330-632::l5', 'rome-400-500::lv1'],      // Justinian's Novel 77
  ['late-roman-anatolia-330-632::x2', 'sassanid-484-651::o3'],      // the Perpetual Peace of 532
  ['late-roman-anatolia-330-632::c5', 'sassanid-484-651::c1'],      // Chosroes I's wars in the Roman East
  ['late-roman-anatolia-330-632::c8', 'sassanid-484-651::c4'],      // the Persian siege of Constantinople
  ['late-roman-anatolia-330-632::c7', 'sassanid-484-651::c5'],      // Heraclius reverses the war
  ['late-roman-anatolia-330-632::c6', 'mesopotamia-224-637::k7'],      // Khosrow II and the last great war
  ['late-roman-anatolia-330-632::p6', 'roman-byzantine-levant-135-638::p5'],      // Justinian's building and legal legacy
  ['late-roman-anatolia-330-632::t5', 'ghassanid-420-638::t2'],      // John of Ephesus
  ['late-roman-anatolia-330-632::x1', 'sassanid-484-651::k5'],      // Khosrow I and the silk trade
  ['byzantine-anatolia-632-867::c2', 'caliphate-632-750::c8'],      // the first siege of Constantinople
  ['byzantine-anatolia-632-867::c2', 'levant-634-750::c3'],      // the sieges of Constantinople
  ['byzantine-anatolia-632-867::c4', 'caliphate-632-750::c9'],      // the second siege of Constantinople
  ['byzantine-anatolia-632-867::c4', 'levant-634-750::c3'],      // the sieges of Constantinople
  ['byzantine-anatolia-632-867::c4', 'caliphate-632-750::w3'],      // the limits fixed at Constantinople
  ['byzantine-anatolia-632-867::c8', 'caliphate-750-945::c4'],      // Harun's raids and the sack of Amorion
  ['byzantine-anatolia-632-867::c8', 'caliphate-750-945::k6'],      // al-Mu'tasim
  ['byzantine-anatolia-632-867::c7', 'caliphate-750-945::k3'],      // Harun al-Rashid
  ['byzantine-anatolia-632-867::x2', 'caliphate-750-945::t1'],      // the Translation Movement
  ['byzantine-anatolia-632-867::x2', 'caliphate-750-945::k5'],      // al-Ma'mun
  ['byzantine-anatolia-632-867::x4', 'caliphate-750-945::ec5'],      // the Rus trade
  ['byzantine-anatolia-632-867::p6', 'iraq-632-945::k7'],      // al-Mu'tasim, the Turks and Samarra
  ['byzantine-anatolia-632-867::g1', 'sassanid-484-651::c4'],      // the siege of Constantinople and the defences of the city
  ['byzantine-anatolia-632-867::x5', 'late-roman-anatolia-330-632::b7'],      // holy men and monasteries of Bithynia
  ['byzantine-anatolia-867-1071::c9', 'caliphate-945-1258::c3'],      // Manzikert
  ['byzantine-anatolia-867-1071::c9', 'iran-1055-1219::c2'],      // the battle of Manzikert
  ['byzantine-anatolia-867-1071::c9', 'iran-1055-1219::p2'],      // Alp Arslan at Manzikert
  ['byzantine-anatolia-867-1071::c7', 'caliphate-945-1258::k10'],      // Alp Arslan and the Seljuk expansion westward
  ['byzantine-anatolia-867-1071::c3', 'levant-750-1099::c1'],      // the Byzantine reconquest of Antioch
  ['byzantine-anatolia-867-1071::x2', 'fatimids-909-1171::w3'],      // the Fatimid–Byzantine truce and the Seljuk squeeze
  ['byzantine-anatolia-867-1071::x1', 'caliphate-750-945::ec5'],      // the Rus trade and the Rus in Constantinople
  ['byzantine-anatolia-867-1071::c2', 'byzantine-anatolia-632-867::c11'],      // the war with Melitene and the frontier emirs
  ['byzantine-anatolia-867-1071::b4', 'byzantine-anatolia-632-867::b4'],      // the Paulicians
  ['byzantine-anatolia-867-1071::c1', 'byzantine-anatolia-632-867::c10'],      // Tephrike and the Paulicians
  ['byzantine-anatolia-867-1071::p1', 'byzantine-anatolia-632-867::p6'],      // Basil I took power from Michael III and Bardas
  ['seljuks-of-rum-1071-1308::x3', 'ilkhanate-1219-1335::x3'],      // Rumi's family leaves Balkh
  ['seljuks-of-rum-1071-1308::c10', 'mamluks-1250-1517::k3'],      // Baybars
  ['seljuks-of-rum-1071-1308::c10', 'mamluks-1250-1517::c2'],      // the Ilkhanid invasions and Baybars in Anatolia
  ['seljuks-of-rum-1071-1308::c10', 'mamluk-syria-1260-1516::c2'],      // the long war with the Mongol Ilkhanate
  ['seljuks-of-rum-1071-1308::c2', 'caliphate-945-1258::c4'],      // the First Crusade
  ['seljuks-of-rum-1071-1308::c6', 'caliphate-945-1258::c7'],      // the Third Crusade
  ['seljuks-of-rum-1071-1308::g1', 'iran-1055-1219::tc1'],      // the caravanserai network
  ['seljuks-of-rum-1071-1308::w1', 'iran-1055-1219::x1'],      // Turkic settlement in Anatolia
  ['seljuks-of-rum-1071-1308::c1', 'iran-1055-1219::x1'],      // the Turkmen conquest and settlement
  ['seljuks-of-rum-1071-1308::b3', 'al-andalus-1031-1492::r1'],      // Ibn Arabi
  ['seljuks-of-rum-1071-1308::b3', 'ayyubids-1171-1250::b3'],      // Sufism becomes institutional
  ['seljuks-of-rum-1071-1308::x3', 'ayyubids-1171-1250::x4'],      // scholars fleeing the Mongols
  ['seljuks-of-rum-1071-1308::c8', 'ilkhanate-1219-1335::p3'],      // Mongol power in Anatolia: Hulagu and the Ilkhanate
  ['seljuks-of-rum-1071-1308::w3', 'caliphate-945-1258::w5'],      // the Mongol cataclysm
  ['seljuks-of-rum-1071-1308::ec1', 'ilkhanate-1219-1335::ec1'],      // the Pax Mongolica's revived trade
  ['seljuks-of-rum-1071-1308::c9', 'byzantine-anatolia-867-1071::p9'],      // the Anatolian frontier society
  ['cilician-armenia-1080-1375::c8', 'mamluks-1250-1517::c5'],      // the Mamluk conquest of Cilician Armenia
  ['cilician-armenia-1080-1375::c6', 'mamluks-1250-1517::c5'],      // Baybars in Cilicia
  ['cilician-armenia-1080-1375::x1', 'mamluks-1250-1517::ec6'],      // the Venetian and Genoese factories
  ['cilician-armenia-1080-1375::w1', 'fatimids-909-1171::x2'],      // the Armenians come to Egypt
  ['cilician-armenia-1080-1375::w1', 'byzantine-anatolia-867-1071::x3'],      // Senekerim and the cession of Vaspurakan
  ['cilician-armenia-1080-1375::c5', 'ilkhanate-1219-1335::c5'],      // Ain Jalut and the Mongol alliance
  ['cilician-armenia-1080-1375::x2', 'ilkhanate-1219-1335::p3'],      // Hulagu and the Ilkhanate
  ['cilician-armenia-1080-1375::w2', 'crusader-states-1099-1291::p8'],      // the fall of Acre
  ['cilician-armenia-1080-1375::ec1', 'seljuks-of-rum-1071-1308::ec1'],      // ports and the caravan trade
  ['cilician-armenia-1080-1375::c2', 'seljuks-of-rum-1071-1308::p3'],      // Manuel I and Kilij Arslan II
  ['trebizond-1204-1461::c1', 'seljuks-of-rum-1071-1308::x4'],      // the treaty with Trebizond after Sinop
  ['trebizond-1204-1461::c1', 'seljuks-of-rum-1071-1308::c7'],      // the ports taken on both seas
  ['trebizond-1204-1461::c2', 'seljuks-of-rum-1071-1308::c8'],      // Köse Dağ and the Mongol overlordship
  ['trebizond-1204-1461::c5', 'iran-1335-1501::p6'],      // the Qara Qoyunlu and Aq Qoyunlu
  ['trebizond-1204-1461::x1', 'iran-1335-1501::p6'],      // the Aq Qoyunlu and marriages
  ['trebizond-1204-1461::l2', 'iran-1335-1501::c4'],      // Uzun Hasan
  ['trebizond-1204-1461::x2', 'iran-1335-1501::p2'],      // Timur
  ['trebizond-1204-1461::t2', 'ilkhanate-1219-1335::t1'],      // the Maragheh observatory and Persian astronomy
  ['trebizond-1204-1461::x3', 'mamluks-1250-1517::ec5'],      // the slave trade: the Black Sea, the Caucasus and Cairo
  ['trebizond-1204-1461::c3', 'mamluks-1250-1517::ec6'],      // the Venetian and Genoese factories
  ['trebizond-1204-1461::ec1', 'ilkhanate-1219-1335::ec1'],      // the Pax Mongolica's revived trade
  ['trebizond-1204-1461::ec1', 'cilician-armenia-1080-1375::ec1'],      // Ayas and Trebizond as termini of the eastern trade
  ['anatolian-beyliks-1308-1500::c4', 'iran-1335-1501::p2'],      // Timur
  ['anatolian-beyliks-1308-1500::c4', 'iran-1335-1501::c1'],      // Timur subdues the regional successors
  ['anatolian-beyliks-1308-1500::c6', 'iran-1335-1501::p6'],      // the Aq Qoyunlu
  ['anatolian-beyliks-1308-1500::c7', 'mamluks-1250-1517::c9'],      // the Taurus frontier war with the Ottomans
  ['anatolian-beyliks-1308-1500::p8', 'mamluks-1250-1517::c9'],      // the Dulkadirids between Mamluks and Ottomans
  ['anatolian-beyliks-1308-1500::w1', 'seljuks-of-rum-1071-1308::p8'],      // the end of the Seljuk line
  ['anatolian-beyliks-1308-1500::p11', 'trebizond-1204-1461::c6'],      // the fall of Trebizond
  ['anatolian-beyliks-1308-1500::o3', 'seljuks-of-rum-1071-1308::o3'],      // the akhi brotherhoods
  ['anatolian-beyliks-1308-1500::ec3', 'iran-1335-1501::ec1'],      // the silk trade under Timurid stability
  ['anatolian-beyliks-1308-1500::p7', 'trebizond-1204-1461::c5'],      // Turkmen raids and the Black Sea beyliks
  ['anatolian-beyliks-1308-1500::c2', 'crusader-states-1099-1291::p8'],      // the last crusading enterprises
  ['anatolian-beyliks-1308-1500::x2', 'mamluks-1250-1517::ec6'],      // the Venetian and Genoese factories
  ['ottoman-anatolia-1500-1800::c2', 'safavid-1501-1722::c1'],      // the battle of Chaldiran
  ['ottoman-anatolia-1500-1800::p1', 'safavid-1501-1722::p1'],      // Ismail I and Selim I
  ['ottoman-anatolia-1500-1800::p1', 'egypt-1517-1798::k1'],      // Selim I conquers Egypt
  ['ottoman-anatolia-1500-1800::c5', 'safavid-1501-1722::c3'],      // Shah Abbas's reconquest and the later wars
  ['ottoman-anatolia-1500-1800::c5', 'iraq-1534-1831::c1'],      // four changes of hands and the Treaty of Zuhab
  ['ottoman-anatolia-1500-1800::x3', 'iraq-1534-1831::xc1'],      // the Ottoman–Persian border, fixed and disputed
  ['ottoman-anatolia-1500-1800::x3', 'iraq-1258-1534::xc4'],      // the making of the Ottoman–Safavid frontier
  ['ottoman-anatolia-1500-1800::b1', 'safavid-1501-1722::p1'],      // the Safavid order and the Kizilbash of Anatolia
  ['ottoman-anatolia-1500-1800::c1', 'iran-1335-1501::b1'],      // the Safavid order's beginnings and its Anatolian following
  ['ottoman-anatolia-1500-1800::x1', 'ottoman-syria-1516-1800::x1'],      // French capitulations and consular trade
  ['ottoman-anatolia-1500-1800::x1', 'egypt-1517-1798::xc4'],      // the European merchants and the capitulations
  ['ottoman-anatolia-1500-1800::x1', 'france-1610-1715::ex3'],      // Compagnie du Levant and the Ottoman trade
  ['ottoman-anatolia-1500-1800::x2', 'portuguese-gulf-1507-1650::x3'],      // the Armenians of New Julfa
  ['ottoman-anatolia-1500-1800::ec1', 'portuguese-gulf-1507-1650::ec1'],      // the battle over the Persian silk route
  ['ottoman-anatolia-1500-1800::p5', 'ottoman-syria-1516-1800::p1'],      // the Ottoman provincial notables
  ['ottoman-anatolia-1500-1800::p5', 'iraq-1534-1831::k5'],      // the Mamluk pashas of Baghdad and the ayans
  ['ottoman-anatolia-1500-1800::l3', 'iraq-1534-1831::b6'],      // Jews of the Ottoman cities
  ['ottoman-anatolia-1800-1908::p1', 'ottoman-anatolia-1500-1800::p5'],      // the ayan houses Mahmud II destroyed
  ['ottoman-anatolia-1800-1908::c1', 'ottoman-syria-1800-1908::p1'],      // Ibrahim Pasha's Egyptian armies in Syria and Anatolia
  ['ottoman-anatolia-1800-1908::c1', 'egypt-1798-1900::c6'],      // the Syrian wars: Konya and the convention of Kütahya
  ['ottoman-anatolia-1800-1908::p4', 'iraq-1831-1914::o6'],      // the end of the Kurdish emirates
  ['ottoman-anatolia-1800-1908::p5', 'ottoman-syria-1800-1908::p5'],      // Abdülhamid II's centralisation
  ['ottoman-anatolia-1800-1908::p2', 'ottoman-syria-1800-1908::p2'],      // the Tanzimat reaching the provinces
  ['ottoman-anatolia-1800-1908::o1', 'ottoman-syria-1800-1908::o2'],      // equality of subjects on paper
  ['ottoman-anatolia-1800-1908::o2', 'iraq-1831-1914::o2'],      // the Land Code of 1858
  ['ottoman-anatolia-1800-1908::o3', 'iraq-1831-1914::o1'],      // the vilayet system in the provinces
  ['ottoman-anatolia-1800-1908::ec1', 'iraq-1831-1914::g2'],      // the Anatolian Railway and its extension to Baghdad
  ['ottoman-anatolia-1800-1908::x3', 'iraq-1831-1914::xc1'],      // German capital and the contest for the road to the Gulf
  ['ottoman-anatolia-1800-1908::b1', 'ottoman-syria-1800-1908::b1'],      // American Protestant missions and their colleges
  ['ottoman-anatolia-1800-1908::b1', 'iraq-1831-1914::b5'],      // missions, schools and churches
  ['ottoman-anatolia-1800-1908::g1', 'iraq-1831-1914::g1'],      // the telegraph and the steamer
  ['ottoman-anatolia-1800-1908::l4', 'egypt-1798-1900::xc6'],      // slavery and the suppression of the slave trade
  ['ottoman-anatolia-1800-1908::o5', 'egypt-1798-1900::o5'],      // European debt commissions over Ottoman and Egyptian finances
  ['anatolia-1908-1923::c1', 'levant-1908-1920::p1'],      // the Young Turk Revolution of 1908
  ['anatolia-1908-1923::x1', 'levant-1908-1920::p2'],      // the Ottoman entry into the First World War
  ['anatolia-1908-1923::w1', 'levant-1908-1920::o2'],      // the Sykes–Picot agreement
  ['anatolia-1908-1923::w1', 'hejaz-1900-1925::t2'],      // Sykes–Picot and the wartime partition of Ottoman lands
  ['anatolia-1908-1923::ec3', 'levant-1908-1920::ec1'],      // the wartime famine, in Anatolia and on Mount Lebanon
  ['anatolia-1908-1923::p4', 'hejaz-1900-1925::b2'],      // the caliphate question after the sultanate
  ['anatolia-1908-1923::x4', 'hejaz-1900-1925::b4'],      // the Khilafat movement and the global reaction
  ['anatolia-1908-1923::o6', 'iraq-1914-1958::xc5'],      // the Kurdish provisions of Sèvres and the Kurdish question across the borders
  ['anatolia-1908-1923::c10', 'iraq-1914-1958::c3'],      // the Assyrians of Hakkâri and the later Assyrian refugees in Iraq
  ['anatolia-1908-1923::c1', 'qajar-1789-1925::o2'],      // the constitutional revolutions of Iran and the Ottoman Empire
  ['anatolia-1908-1923::p1', 'ottoman-anatolia-1800-1908::p5'],      // Abdülhamid II
  ['anatolia-1908-1923::o1', 'ottoman-anatolia-1800-1908::o4'],      // the constitution of 1876 and its restoration
  ['anatolia-1908-1923::o2', 'ottoman-anatolia-1800-1908::w1'],      // Article 61 of Berlin and the 1914 reform agreement
  ['anatolia-1908-1923::c2', 'ottoman-anatolia-1800-1908::c3'],      // the massacres of the 1890s and of 1909
  ['anatolia-1908-1923::c7', 'ottoman-anatolia-1800-1908::c3'],      // the massacres of 1894–1896 as the background of 1915
  ['anatolia-1908-1923::e2', 'ottoman-anatolia-1800-1908::e4'],      // Komitas and the Armenian musical and literary world
  ['anatolia-1908-1923::x2', 'ottoman-anatolia-1800-1908::x1'],      // the Muslim refugees settled in Anatolia
  ['anatolia-1908-1923::g2', 'ottoman-anatolia-1800-1908::x3'],      // the Anatolian and Baghdad railways
  ['anatolia-1908-1923::l3', 'ottoman-anatolia-1800-1908::l3'],      // American missionary and relief work among the Armenians
  ['turkey-1923-1980::p1', 'anatolia-1908-1923::p5'],      // Mustafa Kemal elected first president of the Republic
  ['turkey-1923-1980::o1', 'anatolia-1908-1923::o9'],      // the abolition of the sultanate and then the caliphate
  ['turkey-1923-1980::o1', 'hejaz-1900-1925::b2'],      // the caliphate question after its abolition
  ['turkey-1923-1980::o2', 'anatolia-1908-1923::o8'],      // from the law of 1921 to the constitution of 1924
  ['turkey-1923-1980::x1', 'anatolia-1908-1923::o10'],      // the Straits regime of Lausanne revised at Montreux
  ['turkey-1923-1980::t1', 'anatolia-1908-1923::t1'],      // Turkism from Gökalp to the History Thesis
  ['turkey-1923-1980::c1', 'anatolia-1908-1923::c18'],      // Kurdish risings against the Ankara government
  ['turkey-1923-1980::c1', 'iraq-1914-1958::xc5'],      // the Kurdish question across the borders
  ['turkey-1923-1980::l2', 'iraq-1914-1958::xc5'],      // the Kurdish question across the borders
  ['turkey-1923-1980::x4', 'iraq-1914-1958::xc3'],      // Turkey's Western alignment: NATO and the Baghdad Pact
  ['turkey-1923-1980::w3', 'anatolia-1908-1923::w3'],      // the exchange of 1923 and the later decline of the minorities
  ['turkey-1923-1980::b5', 'anatolia-1908-1923::b3'],      // the Alevi and Bektashi communities
  ['turkey-1980-today::c1', 'turkey-1923-1980::c15'],      // the violence of 1976–1980 and the coup that ended it
  ['turkey-1980-today::ec1', 'turkey-1923-1980::ec7'],      // the decisions of 24 January 1980 and the export model
  ['turkey-1980-today::o1', 'turkey-1923-1980::o11'],      // the constitutions of 1961 and 1982
  ['turkey-1980-today::c14', 'turkey-1923-1980::c9'],      // the army's memoranda of 1971 and 1997
  ['turkey-1980-today::c2', 'turkey-1923-1980::l2'],      // the Kurdish villagers and the state from the 1920s to the war of the 1980s
  ['turkey-1980-today::c6', 'turkey-1923-1980::c14'],      // the violence against Alevis at Maraş, Çorum and Sivas
  ['turkey-1980-today::b4', 'turkey-1923-1980::b5'],      // the Alevi communities
  ['turkey-1980-today::b3', 'turkey-1923-1980::b4'],      // Erbakan and political Islam
  ['turkey-1980-today::b5', 'turkey-1923-1980::e1'],      // Hagia Sophia as museum and as mosque
  ['turkey-1980-today::x2', 'turkey-1923-1980::c12'],      // the Cyprus operation of 1974 and the later division
  ['turkey-1980-today::x1', 'turkey-1923-1980::x6'],      // the Ankara Agreement and the customs union
  ['turkey-1980-today::w3', 'turkey-1923-1980::w2'],      // the growth of the population and the cities
  ['turkey-1980-today::l4', 'turkey-1923-1980::ec6'],      // the migrants in Germany
  ['turkey-1980-today::t2', 'anatolia-1908-1923::c7'],      // the Armenian Genocide and its place in Turkish public debate
  ['turkey-1980-today::l3', 'anatolia-1908-1923::c7'],      // the Armenian community and the memory of 1915
  ['turkey-1980-today::c2', 'iraq-1979-2003::xc4'],      // the Kurdish region and its patrons
  ['turkey-1980-today::x4', 'syria-1946-today::x1'],      // the Syrian refugee crisis
  ['turkey-1980-today::x4', 'syria-1946-today::c2'],      // the Syrian civil war
  ['turkey-1980-today::c13', 'syria-1946-today::c2'],      // the Turkish operations in northern Syria
  ['caucasus-1850000bc-3500bc::x1', 'arabia-paleolithic-500000bc-8000bc::x2'],      // the dispersal of early humans out of Africa along the northern route
  ['caucasus-1850000bc-3500bc::ec3', 'anatolia-10000bc-3000bc::x1'],      // obsidian circulation among the early farming villages
  ['caucasus-1850000bc-3500bc::x3', 'mesopotamia-6500bc-3800bc::p6'],      // the Ubaid horizon and its northern reach
  ['caucasus-1850000bc-3500bc::b3', 'mesopotamia-6500bc-3800bc::b5'],      // burial of infants beneath house floors
  ['caucasus-3500bc-1200bc::p8', 'hittite-1650bc-1180bc::p6'],      // Suppiluliuma I and the treaty with Hayasa
  ['caucasus-3500bc-1200bc::c3', 'hittite-1650bc-1180bc::p7'],      // the Hittite campaigns against Hayasa and Azzi
  ['caucasus-3500bc-1200bc::o3', 'hittite-1650bc-1180bc::o3'],      // the Hittite treaty form
  ['caucasus-3500bc-1200bc::p9', 'assyria-1400bc-1050bc::k3'],      // Shalmaneser I and the land of Uruatri
  ['caucasus-3500bc-1200bc::p1', 'anatolia-3000bc-2000bc::p10'],      // the Kura–Araxes in Anatolia
  ['caucasus-3500bc-1200bc::x1', 'anatolia-3000bc-2000bc::x2'],      // the Caucasus road to the Euphrates
  ['caucasus-3500bc-1200bc::x1', 'anatolia-10000bc-3000bc::w4'],      // the Kura–Araxes reach the Upper Euphrates
  ['caucasus-3500bc-1200bc::ec2', 'anatolia-3000bc-2000bc::ec3'],      // mobile herding and the Kura–Araxes
  ['urartu-colchis-1200bc-585bc::c1', 'assyria-911bc-609bc::c2'],      // the long war between Assyria and Urartu
  ['urartu-colchis-1200bc-585bc::c3', 'assyria-911bc-609bc::c2'],      // Sargon II's campaign of 714 BC
  ['urartu-colchis-1200bc-585bc::p5', 'assyria-911bc-609bc::k6'],      // Sargon II and Rusa I
  ['urartu-colchis-1200bc-585bc::x2', 'phrygia-1200bc-675bc::x1'],      // Mita of Mushki and Sargon
  ['urartu-colchis-1200bc-585bc::x2', 'phrygia-1200bc-675bc::p3'],      // Midas of Phrygia
  ['urartu-colchis-1200bc-585bc::e1', 'phrygia-1200bc-675bc::x4'],      // Urartian bronzes at Gordion
  ['urartu-colchis-1200bc-585bc::c4', 'phrygia-1200bc-675bc::c5'],      // the Cimmerians and the sack of Gordion
  ['urartu-colchis-1200bc-585bc::w2', 'phrygia-1200bc-675bc::w3'],      // the Cimmerians cross the Caucasus
  ['urartu-colchis-1200bc-585bc::c4', 'lydia-685bc-546bc::c1'],      // the Cimmerians in Anatolia
  ['urartu-colchis-1200bc-585bc::c5', 'media-728bc-550bc::c2'],      // Scythian domination in the Median lands
  ['urartu-colchis-1200bc-585bc::w1', 'media-728bc-550bc::p3'],      // Cyaxares and the fall of Nineveh
  ['urartu-colchis-1200bc-585bc::w1', 'assyria-911bc-609bc::xc5'],      // the Median alliance and the fall of Assyria
  ['urartu-colchis-1200bc-585bc::p4', 'phrygia-1200bc-675bc::c6'],      // Urartu against Melid and Kummuh
  ['achaemenid-caucasus-585bc-330bc::p3', 'achaemenid-550bc-330bc::p4'],      // Darius I and the satrapies
  ['achaemenid-caucasus-585bc-330bc::o2', 'achaemenid-550bc-330bc::e4'],      // the Behistun relief and inscription
  ['achaemenid-caucasus-585bc-330bc::o2', 'achaemenid-550bc-330bc::t1'],      // the ideology of Behistun
  ['achaemenid-caucasus-585bc-330bc::p4', 'achaemenid-550bc-330bc::o1'],      // the satrapy system
  ['achaemenid-caucasus-585bc-330bc::o1', 'achaemenid-550bc-330bc::o2'],      // the fixed tribute assessment
  ['achaemenid-caucasus-585bc-330bc::c2', 'achaemenid-550bc-330bc::c7'],      // Cunaxa and the march of the Ten Thousand
  ['achaemenid-caucasus-585bc-330bc::c2', 'persian-anatolia-546bc-334bc::t5'],      // Xenophon's Anabasis
  ['achaemenid-caucasus-585bc-330bc::c2', 'persian-anatolia-546bc-334bc::c5'],      // Cyrus the Younger and Cunaxa
  ['achaemenid-caucasus-585bc-330bc::c5', 'achaemenid-550bc-330bc::c8'],      // Alexander's conquest of the empire
  ['achaemenid-caucasus-585bc-330bc::c5', 'achaemenid-550bc-330bc::p13'],      // Darius III
  ['achaemenid-caucasus-585bc-330bc::x1', 'achaemenid-550bc-330bc::tc1'],      // the Royal Road and its stations
  ['achaemenid-caucasus-585bc-330bc::x1', 'achaemenid-550bc-330bc::x3'],      // the Royal Road as trade corridor
  ['achaemenid-caucasus-585bc-330bc::e1', 'achaemenid-550bc-330bc::e1'],      // the Apadana reliefs
  ['achaemenid-caucasus-585bc-330bc::g1', 'achaemenid-550bc-330bc::o3'],      // the daric and imperial coinage
  ['achaemenid-caucasus-585bc-330bc::w1', 'achaemenid-550bc-330bc::w4'],      // the fall of the Achaemenid empire
  ['achaemenid-caucasus-585bc-330bc::p1', 'media-728bc-550bc::p3'],      // Cyaxares and the Median reach to the Halys
  ['achaemenid-caucasus-585bc-330bc::p1', 'media-728bc-550bc::w2'],      // Median territory at its height
  ['hellenistic-caucasus-330bc-1bc::c1', 'seleucid-iran-330bc-148bc::p4'],      // Antiochus III and the reconquest of the East
  ['hellenistic-caucasus-330bc-1bc::c2', 'seleucid-iran-330bc-148bc::c5'],      // the defeat of Antiochus III at Magnesia
  ['hellenistic-caucasus-330bc-1bc::c2', 'hellenistic-anatolia-334bc-133bc::c8'],      // Magnesia
  ['hellenistic-caucasus-330bc-1bc::p11', 'hellenistic-anatolia-334bc-133bc::p11'],      // the kingdom of Pontus
  ['hellenistic-caucasus-330bc-1bc::p11', 'roman-anatolia-133bc-330::p2'],      // Mithridates VI Eupator
  ['hellenistic-caucasus-330bc-1bc::c4', 'roman-anatolia-133bc-330::c4'],      // Lucullus and Pompey against Mithridates
  ['hellenistic-caucasus-330bc-1bc::c5', 'roman-anatolia-133bc-330::p3'],      // Pompey's settlement of the East
  ['hellenistic-caucasus-330bc-1bc::c6', 'parthia-148bc-224::c2'],      // the battle of Carrhae
  ['hellenistic-caucasus-330bc-1bc::c7', 'parthia-148bc-224::c3'],      // Antony's Median campaign
  ['hellenistic-caucasus-330bc-1bc::p7', 'parthia-148bc-224::p3'],      // Orodes II and Artavasdes
  ['hellenistic-caucasus-330bc-1bc::x3', 'parthia-148bc-224::p2'],      // Mithridates II of Parthia
  ['hellenistic-caucasus-330bc-1bc::p12', 'seleucid-iran-330bc-148bc::c6'],      // Mithridates I's conquest of Media
  ['caucasus-1-428::c1', 'roman-anatolia-133bc-330::c9'],      // Corbulo and the Armenian war
  ['caucasus-1-428::c3', 'parthia-148bc-224::c4'],      // Trajan's conquest and withdrawal
  ['caucasus-1-428::c7', 'parthia-148bc-224::w2'],      // the Alan raid on the Caucasus frontier
  ['caucasus-1-428::p2', 'parthia-148bc-224::p4'],      // Vologases I and the Arsacid Armenian throne
  ['caucasus-1-428::c5', 'sassanid-224-484::k2'],      // Shapur I
  ['caucasus-1-428::x2', 'sassanid-224-484::k2'],      // Shapur I's lands in the Caucasus
  ['caucasus-1-428::c6', 'sassanid-224-484::c4'],      // Shapur II's campaigns
  ['caucasus-1-428::p5', 'sassanid-224-484::k8'],      // Shapur II and the Armenian kings
  ['caucasus-1-428::o2', 'sassanid-224-484::k6'],      // Narseh's war and the peace of Nisibis
  ['caucasus-1-428::o3', 'rome-300-400::c4'],      // the peace of 363 and its cession
  ['caucasus-1-428::p6', 'sassanid-224-484::c8'],      // the partition of Armenia between Rome and Persia
  ['caucasus-1-428::p6', 'late-roman-anatolia-330-632::x3'],      // the partition of 387
  ['caucasus-1-428::b1', 'sassanid-224-484::r3'],      // Shapur II's persecution of Christians
  ['caucasus-1-428::x1', 'sassanid-224-484::ex4'],      // Armenian cultural transmission between Rome and Persia
  ['caucasus-428-645::c1', 'sassanid-224-484::c6'],      // the battle of Avarayr
  ['caucasus-428-645::o4', 'sassanid-484-651::o1'],      // Khosrow I's tax reform
  ['caucasus-428-645::p1', 'sassanid-484-651::k5'],      // Khosrow I and the marzbanate
  ['caucasus-428-645::p3', 'sassanid-484-651::k8'],      // Khosrow II and the Bagratuni general
  ['caucasus-428-645::c6', 'sassanid-484-651::c5'],      // Heraclius's campaign and the battle of Nineveh
  ['caucasus-428-645::c6', 'late-roman-anatolia-330-632::p7'],      // Heraclius
  ['caucasus-428-645::o3', 'late-roman-anatolia-330-632::x2'],      // the Fifty Years' Peace
  ['caucasus-428-645::b1', 'late-roman-anatolia-330-632::b4'],      // the council of Chalcedon and its rejection
  ['caucasus-428-645::t5', 'sassanid-484-651::t4'],      // Sebeos and the Armenian histories
  ['caucasus-428-645::w1', 'sassanid-484-651::s3'],      // the Justinianic plague reaches Persia
  ['caucasus-428-645::x1', 'sassanid-484-651::ex4'],      // Khosrow II and Maurice
  ['caucasus-428-645::p5', 'sassanid-484-651::ex4'],      // Maurice's aid to Khosrow II and the peace of 591
  ['caucasus-428-645::x2', 'byzantine-anatolia-632-867::x3'],      // the Khazar alliance and marriage
  ['caucasus-645-884::c5', 'caliphate-750-945::c3'],      // Babak and the Khurramiyya
  ['caucasus-645-884::c3', 'caliphate-750-945::e1'],      // Samarra, where the Armenian princes were taken
  ['caucasus-645-884::l2', 'caliphate-750-945::e1'],      // the nobles at Samarra
  ['caucasus-645-884::x1', 'byzantine-anatolia-632-867::x3'],      // the Khazar marriage of 732
  ['caucasus-645-884::x2', 'byzantine-anatolia-632-867::w4'],      // Armenians in Byzantium
  ['caucasus-645-884::w1', 'caliphate-750-945::k6'],      // the Abbasid caliphs of the Samarra period
  ['caucasus-645-884::p2', 'caliphate-750-945::k6'],      // al-Mu'tasim and the commander Afshin
  ['caucasus-884-1064::c3', 'byzantine-anatolia-867-1071::c5'],      // Basil II's wars in Georgia
  ['caucasus-884-1064::p7', 'byzantine-anatolia-867-1071::p6'],      // Basil II and David of Tao
  ['caucasus-884-1064::c5', 'byzantine-anatolia-867-1071::c6'],      // the annexation of Ani
  ['caucasus-884-1064::c4', 'byzantine-anatolia-867-1071::p6'],      // Basil II and Vaspurakan
  ['caucasus-884-1064::o4', 'byzantine-anatolia-867-1071::p6'],      // the Byzantine eastern themes
  ['caucasus-884-1064::c6', 'iran-1055-1219::p2'],      // Alp Arslan and the fall of Ani
  ['caucasus-884-1064::c6', 'caliphate-945-1258::k10'],      // Alp Arslan and Malik-Shah
  ['caucasus-884-1064::w2', 'caliphate-945-1258::k9'],      // the Seljuks take Baghdad and the highlands
  ['caucasus-884-1064::c7', 'caliphate-945-1258::c1'],      // the Seljuk takeover and the Turkmen raids
  ['caucasus-884-1064::x1', 'seljuks-of-rum-1071-1308::p9'],      // Turkmen dynasties and Armenian settlements in the west
  ['caucasus-884-1064::p2', 'byzantine-anatolia-867-1071::p4'],      // Byzantine power in the east under the Phokas emperors
  ['caucasus-1064-1243::c1', 'caliphate-945-1258::k10'],      // Malik-Shah and the Great Turkish Invasion
  ['caucasus-1064-1243::c2', 'caliphate-945-1258::c4'],      // crusaders and the Muslim states in the same years
  ['caucasus-1064-1243::c4', 'seljuks-of-rum-1071-1308::c8'],      // Basiani and the Seljuks of Rum
  ['caucasus-1064-1243::c7', 'seljuks-of-rum-1071-1308::c8'],      // Köse Dağ and the Mongol conquest
  ['caucasus-1064-1243::c7', 'seljuks-of-rum-1071-1308::w3'],      // the Mongol conquest of Anatolia
  ['caucasus-1064-1243::c6', 'caliphate-945-1258::c9'],      // the Khwarazmians driven west by the Mongols
  ['caucasus-1064-1243::c5', 'ilkhanate-1219-1335::p1'],      // the Mongol invasion of Khwarazmia and its pursuit into the Caucasus
  ['caucasus-1064-1243::c5', 'caliphate-945-1258::w5'],      // the Mongol cataclysm
  ['caucasus-1064-1243::c6', 'ilkhanate-1219-1335::p2'],      // Jalal al-Din and the interregnum
  ['caucasus-1064-1243::x2', 'trebizond-1204-1461::c2'],      // the Mongol overlordship of Trebizond
  ['caucasus-1064-1243::x2', 'seljuks-of-rum-1071-1308::x4'],      // the treaty with Trebizond
  ['caucasus-1064-1243::b3', 'caliphate-945-1258::c7'],      // Hattin and the Georgians in Jerusalem
  ['caucasus-1064-1243::p8', 'iran-1055-1219::p5'],      // Sanjar and the atabegs
  ['caucasus-1064-1243::t2', 'iran-1055-1219::t1'],      // Persian learning of the Seljuk age
  ['caucasus-1064-1243::w2', 'caliphate-945-1258::w5'],      // the Mongol cataclysm
  ['caucasus-1243-1501::p8', 'ilkhanate-1219-1335::p3'],      // Hulagu and the founding of the Ilkhanate
  ['caucasus-1243-1501::b1', 'ilkhanate-1219-1335::b1'],      // Ghazan's conversion to Islam
  ['caucasus-1243-1501::ec3', 'ilkhanate-1219-1335::o1'],      // Ghazan's fiscal and land reforms
  ['caucasus-1243-1501::p9', 'iran-1335-1501::p1'],      // the Jalayirids
  ['caucasus-1243-1501::p10', 'iran-1335-1501::p6'],      // the Qara Qoyunlu and Aq Qoyunlu
  ['caucasus-1243-1501::c2', 'iran-1335-1501::c1'],      // Timur subdues the regional successors
  ['caucasus-1243-1501::c2', 'iran-1335-1501::p2'],      // Timur the conqueror
  ['caucasus-1243-1501::c5', 'iran-1335-1501::c5'],      // the battle of Otlukbeli
  ['caucasus-1243-1501::c5', 'anatolian-beyliks-1308-1500::c6'],      // Otlukbeli
  ['caucasus-1243-1501::c6', 'safavid-1501-1722::p1'],      // Ismail I and the founding of the Safavid state
  ['caucasus-1243-1501::b5', 'iran-1335-1501::b1'],      // the Safavid order and the Hurufi and Sufi movements
  ['caucasus-1243-1501::x2', 'trebizond-1204-1461::x2'],      // Clavijo in Trebizond
  ['caucasus-1243-1501::w1', 'trebizond-1204-1461::w2'],      // the Black Death at Trebizond
  ['caucasus-1243-1501::w1', 'anatolian-beyliks-1308-1500::w2'],      // the Black Death in Anatolia
  ['caucasus-1243-1501::w2', 'trebizond-1204-1461::c6'],      // the fall of Trebizond
  ['caucasus-1243-1501::l3', 'iran-1335-1501::l2'],      // the demographic toll of Timur's campaigns
  ['caucasus-1243-1501::x1', 'cilician-armenia-1080-1375::c5'],      // Armenians with the Mongol armies
  ['caucasus-1243-1501::x3', 'safavid-1501-1722::l1'],      // the later forced relocation of the Armenians
  ['caucasus-1501-1747::p1', 'safavid-1501-1722::p1'],      // Ismail I and the founding of the Safavid state
  ['caucasus-1501-1747::p3', 'safavid-1501-1722::p4'],      // Shah Abbas I
  ['caucasus-1501-1747::c1', 'safavid-1501-1722::c1'],      // the battle of Chaldiran
  ['caucasus-1501-1747::c3', 'safavid-1501-1722::c3'],      // Shah Abbas's reconquest from the Ottomans
  ['caucasus-1501-1747::c6', 'safavid-1501-1722::l1'],      // the forced relocation of the Armenians
  ['caucasus-1501-1747::c6', 'ottoman-anatolia-1500-1800::x2'],      // the Armenian caravans and merchants
  ['caucasus-1501-1747::ec1', 'safavid-1501-1722::ec2'],      // the Armenian merchants of New Julfa
  ['caucasus-1501-1747::b1', 'safavid-1501-1722::b1'],      // the conversion to Shiism
  ['caucasus-1501-1747::o1', 'ottoman-anatolia-1500-1800::c5'],      // the treaty of Amasya and the later wars
  ['caucasus-1501-1747::o2', 'iraq-1534-1831::c1'],      // four changes of hands and the treaty of Zuhab
  ['caucasus-1501-1747::o2', 'iraq-1534-1831::xc1'],      // the Ottoman–Persian border
  ['caucasus-1501-1747::c9', 'iran-1722-1789::p2'],      // Nader Shah
  ['caucasus-1501-1747::c9', 'iran-1722-1789::c2'],      // the Ottoman wars of Nader
  ['caucasus-1501-1747::x2', 'iran-1722-1789::x1'],      // Nader's diplomacy with Russia
  ['caucasus-1501-1747::t2', 'safavid-1501-1722::t2'],      // Iskandar Beg Munshi and the historians of Abbas
  ['caucasus-1747-1828::c2', 'qajar-1789-1925::p1'],      // Agha Mohammad Khan and the sack of Tbilisi
  ['caucasus-1747-1828::c3', 'qajar-1789-1925::p1'],      // Agha Mohammad Khan at Shusha
  ['caucasus-1747-1828::c4', 'qajar-1789-1925::c2'],      // the Russo-Persian wars
  ['caucasus-1747-1828::c5', 'qajar-1789-1925::c2'],      // the Russo-Persian wars
  ['caucasus-1747-1828::o3', 'qajar-1789-1925::p2'],      // Fath-Ali Shah and the loss of the Caucasus
  ['caucasus-1747-1828::o4', 'qajar-1789-1925::p2'],      // the treaty of Turkmenchay
  ['caucasus-1747-1828::p1', 'iran-1722-1789::p2'],      // Nader Shah and the Georgian kings
  ['caucasus-1747-1828::ec2', 'ottoman-anatolia-1800-1908::x4'],      // Armenian migration and emigration in the nineteenth century
  ['caucasus-1828-1878::c4', 'ottoman-anatolia-1800-1908::c2'],      // Kars and the war of 1877–1878
  ['caucasus-1828-1878::c3', 'ottoman-anatolia-1800-1908::c2'],      // Kars in the Crimean and Russo-Turkish wars
  ['caucasus-1828-1878::x2', 'ottoman-anatolia-1800-1908::w1'],      // the treaty of Berlin and Article 61
  ['caucasus-1828-1878::x1', 'ottoman-anatolia-1800-1908::x1'],      // the Muslim refugees (muhajir) settled in Anatolia
  ['caucasus-1828-1878::b2', 'caucasus-1747-1828::b2'],      // the Armenian Church under Russia
  ['caucasus-1828-1878::o2', 'caucasus-1747-1828::o5'],      // the administration of the Armenian lands
  ['caucasus-1828-1878::b1', 'caucasus-1747-1828::b1'],      // the abolition of Georgian autocephaly
  ['caucasus-1828-1878::p1', 'caucasus-1747-1828::p8'],      // the Russian governors of the conquest
  ['caucasus-1878-1917::c4', 'anatolia-1908-1923::c6'],      // the Russian occupation of eastern Anatolia
  ['caucasus-1878-1917::c4', 'anatolia-1908-1923::c4'],      // Sarıkamış
  ['caucasus-1878-1917::x2', 'anatolia-1908-1923::c7'],      // the Armenian Genocide and the flight of refugees to the Caucasus
  ['caucasus-1878-1917::t1', 'ottoman-anatolia-1800-1908::c4'],      // the Armenian revolutionary movement
  ['caucasus-1878-1917::o1', 'ottoman-anatolia-1800-1908::w1'],      // the Armenian question after Berlin
  ['caucasus-1878-1917::ec1', 'qajar-1789-1925::ec2'],      // the oil of the Caucasus and Persia
  ['caucasus-1878-1917::o2', 'caucasus-1828-1878::o2'],      // the administration of Transcaucasia
  ['caucasus-1878-1917::p1', 'caucasus-1828-1878::p3'],      // the viceroys of the Caucasus
  ['caucasus-1917-1921::c8', 'anatolia-1908-1923::p9'],      // Mustafa Kemal and the national movement against Armenia
  ['caucasus-1917-1921::c8', 'anatolia-1908-1923::o6'],      // the Treaty of Sèvres and its revision at Alexandropol
  ['caucasus-1917-1921::x2', 'anatolia-1908-1923::o6'],      // the Wilsonian arbitration under Sèvres
  ['caucasus-1917-1921::o4', 'anatolia-1908-1923::x3'],      // the treaties of Moscow and Kars
  ['caucasus-1917-1921::w1', 'anatolia-1908-1923::c7'],      // the Armenian refugees from the genocide
  ['caucasus-1917-1921::ec2', 'anatolia-1908-1923::c7'],      // the famine and relief for survivors
  ['caucasus-1917-1921::l2', 'anatolia-1908-1923::c7'],      // orphans of the Armenian Genocide
  ['caucasus-1917-1921::c1', 'anatolia-1908-1923::c6'],      // the Ottoman advance of 1918 and the Russian occupation of eastern Anatolia
  ['caucasus-1917-1921::p1', 'caucasus-1878-1917::p3'],      // the end of the viceroyalty and the Special Transcaucasian Committee
  ['caucasus-1917-1921::b1', 'caucasus-1878-1917::b1'],      // the restoration of Georgian autocephaly
  ['caucasus-1917-1921::ec1', 'caucasus-1878-1917::ec1'],      // Baku oil in the years of war
  ['caucasus-1917-1921::t1', 'caucasus-1878-1917::t2'],      // the Mensheviks and Mesame Dasi
  ['caucasus-1917-1921::t1', 'caucasus-1878-1917::t1'],      // the Dashnaks
  ['caucasus-1917-1921::t1', 'caucasus-1878-1917::t3'],      // Musavat and Hummet
  ['caucasus-1921-1953::x2', 'pahlavi-1925-1979::c1'],      // the Anglo-Soviet invasion of Iran and the supply route
  ['caucasus-1921-1953::c6', 'pahlavi-1925-1979::c1'],      // the Soviet occupation of northern Iran
  ['caucasus-1921-1953::c6', 'turkey-1923-1980::x4'],      // Soviet demands on Turkey and the Truman Doctrine
  ['caucasus-1921-1953::o2', 'caucasus-1917-1921::o5'],      // the Karabakh decision and the autonomous oblast
  ['caucasus-1921-1953::p1', 'caucasus-1917-1921::p6'],      // Sovietisation and the Transcaucasian Federation
  ['caucasus-1921-1953::o3', 'caucasus-1917-1921::o3'],      // the constitutions of Georgia in 1921 and the USSR in 1936
  ['caucasus-1953-1991::e2', 'anatolia-1908-1923::c7'],      // the memory of the Armenian Genocide and the Yerevan memorial
  ['caucasus-1953-1991::c3', 'caucasus-1917-1921::o5'],      // the Karabakh decision of 1921 and the movement of 1988
  ['caucasus-1953-1991::o1', 'caucasus-1921-1953::o2'],      // the autonomous oblast of 1923 and the resolutions of 1988–1989
  ['caucasus-1953-1991::w1', 'turkey-1980-today::w2'],      // the earthquakes of 1988 and 2023 compared
  ['caucasus-1953-1991::x1', 'turkey-1980-today::l3'],      // Turkish aid and the Armenian question
  ['caucasus-1953-1991::p1', 'caucasus-1921-1953::p2'],      // Beria and his successors in Georgia
  ['caucasus-1953-1991::p2', 'caucasus-1921-1953::p3'],      // Baghirov and Aliyev
  ['caucasus-1953-1991::ec1', 'caucasus-1921-1953::ec1'],      // Baku oil from the war to the offshore fields
  ['armenia-1991-today::o1', 'caucasus-1953-1991::o3'],      // the independence acts of 1991 and the referendum
  ['armenia-1991-today::o1', 'caucasus-1917-1921::p3'],      // the first republic of 1918 and the independence of 1991
  ['armenia-1991-today::p1', 'caucasus-1953-1991::p5'],      // the presidents elected in 1991
  ['armenia-1991-today::c1', 'caucasus-1953-1991::o4'],      // the Karabakh republic of 1991 and the war that followed
  ['armenia-1991-today::c1', 'caucasus-1917-1921::c7'],      // the conflict over Karabakh and Zangezur in 1918–1920 and the war of the 1990s
  ['armenia-1991-today::w3', 'caucasus-1953-1991::w2'],      // the refugees of 1988–1991 and the later displacement
  ['armenia-1991-today::te1', 'caucasus-1953-1991::ec3'],      // the Metsamor plant closed in 1989 and restarted in 1995
  ['armenia-1991-today::w1', 'caucasus-1953-1991::g1'],      // the Arpa–Sevan tunnel and the lake restoration
  ['armenia-1991-today::ec1', 'caucasus-1953-1991::w1'],      // the destruction of the earthquake and the blockade years
  ['armenia-1991-today::ec2', 'caucasus-1953-1991::ec2'],      // the second economy of the Soviet years and the privatisation
  ['armenia-1991-today::b1', 'caucasus-1953-1991::b1'],      // the church of Vazgen I and the anniversary of 2001
  ['armenia-1991-today::x6', 'caucasus-1953-1991::x1'],      // the diaspora’s aid of 1988 and the later fund and citizenship
  ['armenia-1991-today::x4', 'caucasus-1917-1921::o4'],      // the border drawn at Kars in 1921 and closed in 1993
  ['armenia-1991-today::x4', 'turkey-1980-today::l3'],      // the Armenian community in Turkey and the closed border
  ['armenia-1991-today::x4', 'turkey-1980-today::w2'],      // the earthquake aid across the border in 2023
  ['armenia-1991-today::t1', 'anatolia-1908-1923::c7'],      // the killings of 1915 and the campaign for recognition
  ['armenia-1991-today::t1', 'turkey-1980-today::t2'],      // the debate on the Armenian question in Turkey and in Armenia
  ['armenia-1991-today::b2', 'anatolia-1908-1923::c8'],      // the arrests of 24 April 1915 and the canonisation of 2015
  ['armenia-1991-today::c8', 'turkey-1980-today::g2'],      // Turkish drones in the war of 2020
  ['armenia-1991-today::x7', 'caucasus-1917-1921::c7'],      // Zangezur in 1920 and the transit route through Syunik
  ['georgia-1991-today::o1', 'caucasus-1953-1991::o3'],      // the independence acts of 1991 and the restoration
  ['georgia-1991-today::o1', 'caucasus-1917-1921::p2'],      // the republic of 1918–1921 and its restoration in 1991
  ['georgia-1991-today::o1', 'armenia-1991-today::o1'],      // the independence referendums of the two republics
  ['georgia-1991-today::o2', 'caucasus-1917-1921::o3'],      // the constitution of 1921 and that of 1995
  ['georgia-1991-today::p1', 'caucasus-1953-1991::p5'],      // the presidents elected in 1990–1991
  ['georgia-1991-today::p1', 'caucasus-1953-1991::t1'],      // the dissident who became president
  ['georgia-1991-today::p2', 'caucasus-1953-1991::p1'],      // Shevardnadze as party secretary and as president
  ['georgia-1991-today::c3', 'caucasus-1953-1991::c9'],      // the abolition of the oblast and the war that followed
  ['georgia-1991-today::c2', 'caucasus-1953-1991::c8'],      // Sukhumi in 1989 and the war of 1992–1993
  ['georgia-1991-today::w1', 'caucasus-1953-1991::w2'],      // the refugees of 1988–1991 and the displaced of the wars
  ['georgia-1991-today::b1', 'caucasus-1953-1991::b1'],      // Ilia II as patriarch in the Soviet and independent years
  ['georgia-1991-today::c12', 'caucasus-1953-1991::c6'],      // Rustaveli Avenue in 1989 and in 2024
  ['georgia-1991-today::l1', 'caucasus-1917-1921::l1'],      // women’s suffrage of 1918 and women in politics
  ['georgia-1991-today::l3', 'caucasus-1921-1953::l2'],      // the Meskhetian deportation of 1944 and the repatriation law of 2007
  ['georgia-1991-today::t3', 'caucasus-1953-1991::c1'],      // the Stalin demonstrations of 1956 and the memory of Stalin
  ['georgia-1991-today::t3', 'caucasus-1917-1921::c9'],      // the Red Army’s entry of 1921 and the museum of occupation
  ['georgia-1991-today::x2', 'armenia-1991-today::x3'],      // the EU paths of Georgia and Armenia
  ['georgia-1991-today::x3', 'armenia-1991-today::x2'],      // the relations of Georgia and Armenia with Russia
  ['azerbaijan-1991-today::p3', 'caucasus-1953-1991::p2'],      // Heydar Aliyev as Soviet leader and as president
  ['azerbaijan-1991-today::p1', 'caucasus-1953-1991::p5'],      // the presidents of 1990–1991
  ['azerbaijan-1991-today::p1', 'caucasus-1953-1991::c7'],      // Mutalibov and Black January
  ['azerbaijan-1991-today::o1', 'caucasus-1953-1991::o3'],      // the independence acts of 1991
  ['azerbaijan-1991-today::o1', 'caucasus-1917-1921::p4'],      // the republic of 1918–1920 and the restoration of 1991
  ['azerbaijan-1991-today::c1', 'armenia-1991-today::c2'],      // Khojaly and Maragha as remembered on the two sides
  ['azerbaijan-1991-today::c2', 'armenia-1991-today::c1'],      // the first Karabakh war from both sides
  ['azerbaijan-1991-today::c6', 'armenia-1991-today::c7'],      // the April war of 2016 from both sides
  ['azerbaijan-1991-today::c7', 'armenia-1991-today::c8'],      // the war of 2020 from both sides
  ['azerbaijan-1991-today::c8', 'armenia-1991-today::c8'],      // the strikes on Gyanja and Barda in the war of 2020
  ['azerbaijan-1991-today::c9', 'armenia-1991-today::c11'],      // the operation of September 2023 and the exodus
  ['azerbaijan-1991-today::c7', 'turkey-1980-today::g2'],      // Turkish drones in the war of 2020
  ['azerbaijan-1991-today::o7', 'armenia-1991-today::o7'],      // the treaty and the constitution from both sides
  ['azerbaijan-1991-today::l1', 'armenia-1991-today::l3'],      // the missing and the prisoners on both sides
  ['azerbaijan-1991-today::x2', 'armenia-1991-today::x2'],      // Russia’s relations with Azerbaijan and with Armenia
  ['azerbaijan-1991-today::ec1', 'caucasus-1953-1991::ec1'],      // the oil rocks of the Soviet years and the Contract of the Century
  ['azerbaijan-1991-today::ec1', 'caucasus-1917-1921::ec1'],      // the oil of 1918–1920 and the contract of 1994
  ['azerbaijan-1991-today::te1', 'georgia-1991-today::te1'],      // the Baku–Tbilisi–Ceyhan pipeline in Georgia
  ['azerbaijan-1991-today::x1', 'georgia-1991-today::x4'],      // the strategic triangle with Turkey and Georgia
  ['azerbaijan-1991-today::w1', 'caucasus-1953-1991::w2'],      // the refugees of 1988–1991 and the displaced of the wars
  ['azerbaijan-1991-today::b1', 'caucasus-1953-1991::b2'],      // the Spiritual Board of the Soviet years and the Caucasus Muslims Office
  ['azerbaijan-1991-today::e1', 'caucasus-1953-1991::e3'],      // mugham in the Soviet years and after
  ['hellenistic-age-323bc-30bc::p2', 'egypt-332bc-30bc::k3'],      // Ptolemy I, founder of the Egyptian kingdom
  ['hellenistic-age-323bc-30bc::p3', 'egypt-332bc-30bc::k4'],      // Ptolemy II and the golden age of Egypt
  ['hellenistic-age-323bc-30bc::p12', 'egypt-332bc-30bc::k12'],      // Cleopatra VII and the end of the dynasty
  ['hellenistic-age-323bc-30bc::c4', 'egypt-332bc-30bc::c3'],      // the Syrian wars from the Egyptian side
  ['hellenistic-age-323bc-30bc::c5', 'egypt-332bc-30bc::c4'],      // the battle of Raphia
  ['hellenistic-age-323bc-30bc::c10', 'egypt-332bc-30bc::c5'],      // the great revolt of the Thebaid
  ['hellenistic-age-323bc-30bc::c7', 'egypt-332bc-30bc::c7'],      // the Day of Eleusis
  ['hellenistic-age-323bc-30bc::c11', 'egypt-332bc-30bc::c9'],      // Actium and the annexation of Egypt
  ['hellenistic-age-323bc-30bc::c11', 'egypt-30bc-300ad::k1'],      // Augustus annexes Egypt
  ['hellenistic-age-323bc-30bc::o2', 'egypt-332bc-30bc::o2'],      // the Ptolemaic fiscal machine
  ['hellenistic-age-323bc-30bc::o4', 'egypt-332bc-30bc::o5'],      // the priestly synods and the Rosetta decree
  ['hellenistic-age-323bc-30bc::l4', 'egypt-332bc-30bc::o3'],      // the cleruchy and the military settlers
  ['hellenistic-age-323bc-30bc::l3', 'egypt-332bc-30bc::xc6'],      // Greeks and Egyptians in the chora
  ['hellenistic-age-323bc-30bc::l1', 'egypt-332bc-30bc::l2'],      // Arsinoe II the deified queen
  ['hellenistic-age-323bc-30bc::l5', 'egypt-332bc-30bc::b5'],      // the Jews of Egypt and the temple of Onias
  ['hellenistic-age-323bc-30bc::b4', 'egypt-332bc-30bc::xc3'],      // the Septuagint and Jewish-Greek culture
  ['hellenistic-age-323bc-30bc::b2', 'egypt-332bc-30bc::b1'],      // Serapis and the cult of the living king
  ['hellenistic-age-323bc-30bc::e1', 'egypt-332bc-30bc::t1'],      // the Museum and the Library
  ['hellenistic-age-323bc-30bc::e2', 'egypt-332bc-30bc::x1'],      // Alexandrian poetry
  ['hellenistic-age-323bc-30bc::te1', 'egypt-332bc-30bc::g1'],      // the Pharos of Alexandria
  ['hellenistic-age-323bc-30bc::ec1', 'egypt-332bc-30bc::e1'],      // the royal monopoly economy
  ['hellenistic-age-323bc-30bc::ec4', 'egypt-332bc-30bc::xc1'],      // the opening of the Indian Ocean route
  ['hellenistic-age-323bc-30bc::x2', 'egypt-332bc-30bc::xc5'],      // Egypt drawn into Rome’s orbit
  ['hellenistic-age-323bc-30bc::t4', 'egypt-332bc-30bc::t7'],      // Manetho and Egyptian temple learning
  ['hellenistic-age-323bc-30bc::t2', 'egypt-332bc-30bc::t3'],      // Eratosthenes measures the earth
  ['hellenistic-age-323bc-30bc::p4', 'seleucid-iran-330bc-148bc::p1'],      // Seleucus I and the eastern satrapies
  ['hellenistic-age-323bc-30bc::p7', 'seleucid-iran-330bc-148bc::p4'],      // the anabasis of Antiochus III
  ['hellenistic-age-323bc-30bc::p9', 'seleucid-iran-330bc-148bc::c2'],      // the secession of Bactria
  ['hellenistic-age-323bc-30bc::p10', 'seleucid-iran-330bc-148bc::c3'],      // Arsaces and the Parthian conquest of Parthia
  ['hellenistic-age-323bc-30bc::p10', 'parthia-148bc-224::p1'],      // Mithridates I and the Parthian empire
  ['hellenistic-age-323bc-30bc::e4', 'seleucid-iran-330bc-148bc::e5'],      // Ai Khanoum, a Greek city on the Oxus
  ['hellenistic-age-323bc-30bc::x1', 'seleucid-iran-330bc-148bc::x1'],      // the treaty of Seleucus and Chandragupta
  ['hellenistic-age-323bc-30bc::w2', 'seleucid-iran-330bc-148bc::w2'],      // the piecemeal loss of the upper satrapies
  ['hellenistic-age-323bc-30bc::b1', 'seleucid-iran-330bc-148bc::b1'],      // the cult of Queen Laodice and the Seleucid ruler cult
  ['hellenistic-age-323bc-30bc::o3', 'mesopotamia-331bc-141bc::o1'],      // the Seleucid era and the Seleucid cities
  ['hellenistic-age-323bc-30bc::o3', 'seleucid-iran-330bc-148bc::o1'],      // the refoundation policy of Seleucus
  ['hellenistic-age-323bc-30bc::b3', 'mesopotamia-331bc-141bc::x1'],      // the Cylinder of Antiochus I
  ['hellenistic-age-323bc-30bc::t4', 'mesopotamia-331bc-141bc::b6'],      // Berossus explains Babylon to the Greeks
  ['hellenistic-age-323bc-30bc::t3', 'mesopotamia-331bc-141bc::t5'],      // the Babylonian parameters pass to Hipparchus
  ['hellenistic-age-323bc-30bc::te4', 'mesopotamia-331bc-141bc::g1'],      // the grid plan of Seleucia
  ['hellenistic-age-323bc-30bc::c8', 'hasmonean-332bc-63bc::p4'],      // Antiochus IV’s persecution
  ['hellenistic-age-323bc-30bc::c8', 'hasmonean-332bc-63bc::c2'],      // the campaigns of Judah Maccabee
  ['hellenistic-age-323bc-30bc::p8', 'hellenistic-anatolia-334bc-133bc::p7'],      // Attalus I and the first Attalid kingdom
  ['hellenistic-age-323bc-30bc::e3', 'hellenistic-anatolia-334bc-133bc::e1'],      // the Great Altar of Pergamon
  ['hellenistic-age-323bc-30bc::c2', 'hellenistic-anatolia-334bc-133bc::c2'],      // Ipsus
  ['hellenistic-age-323bc-30bc::c3', 'hellenistic-anatolia-334bc-133bc::c4'],      // the Elephant Victory over the Gauls
  ['hellenistic-age-323bc-30bc::w1', 'hellenistic-anatolia-334bc-133bc::w2'],      // the Celtic settlement
  ['hellenistic-age-323bc-30bc::c6', 'hellenistic-anatolia-334bc-133bc::c8'],      // the battle of Magnesia
  ['hellenistic-age-323bc-30bc::w3', 'hellenistic-anatolia-334bc-133bc::w5'],      // the king’s will and the province of Asia
  ['hellenistic-age-323bc-30bc::x5', 'hellenistic-anatolia-334bc-133bc::x1'],      // Attalus and Rome
  ['hellenistic-age-323bc-30bc::ec2', 'hellenistic-anatolia-334bc-133bc::x4'],      // Rhodes as arbiter of the sea
  ['hellenistic-age-323bc-30bc::c1', 'hellenistic-anatolia-334bc-133bc::w1'],      // the carve-up of Alexander’s empire
  ['hellenistic-age-323bc-30bc::t3', 'hellenistic-anatolia-334bc-133bc::t2'],      // Hipparchus of Nicaea
  ['hellenistic-age-323bc-30bc::p11', 'roman-anatolia-133bc-330::p2'],      // Mithridates VI Eupator
  ['hellenistic-age-323bc-30bc::c9', 'roman-anatolia-133bc-330::c4'],      // Lucullus and Pompey against Mithridates
  ['hellenistic-age-323bc-30bc::p7', 'hellenistic-caucasus-330bc-1bc::c1'],      // Antiochus III in Armenia
  ['hellenistic-age-323bc-30bc::c9', 'hellenistic-caucasus-330bc-1bc::c4'],      // Lucullus at Tigranocerta
  ['ottoman-empire-1299-1517::p1', 'anatolian-beyliks-1308-1500::p9'],      // Osman and Orhan in the age of the beyliks
  ['ottoman-empire-1299-1517::p3', 'anatolian-beyliks-1308-1500::p10'],      // Murad I and Bayezid I and the absorption of the emirates
  ['ottoman-empire-1299-1517::p5', 'anatolian-beyliks-1308-1500::p11'],      // the interregnum and Murad II
  ['ottoman-empire-1299-1517::c3', 'anatolian-beyliks-1308-1500::c4'],      // the battle of Ankara
  ['ottoman-empire-1299-1517::c3', 'iran-1335-1501::c3'],      // Timur at Ankara and Delhi
  ['ottoman-empire-1299-1517::b2', 'anatolian-beyliks-1308-1500::c8'],      // the revolt of Sheikh Bedreddin
  ['ottoman-empire-1299-1517::b2', 'anatolian-beyliks-1308-1500::b2'],      // Bedreddin’s Varidat
  ['ottoman-empire-1299-1517::e1', 'anatolian-beyliks-1308-1500::e1'],      // the mosques of Bursa
  ['ottoman-empire-1299-1517::e5', 'anatolian-beyliks-1308-1500::e4'],      // Ahmedi’s Iskendername
  ['ottoman-empire-1299-1517::ec1', 'anatolian-beyliks-1308-1500::ec3'],      // Bursa and the silk road
  ['ottoman-empire-1299-1517::w1', 'anatolian-beyliks-1308-1500::w2'],      // the Black Death in Anatolia
  ['ottoman-empire-1299-1517::w3', 'anatolian-beyliks-1308-1500::w1'],      // the fragments of the Seljuk and Ilkhanid state
  ['ottoman-empire-1299-1517::l2', 'anatolian-beyliks-1308-1500::l3'],      // Mara Branković
  ['ottoman-empire-1299-1517::t3', 'anatolian-beyliks-1308-1500::t1'],      // the Ottoman origin legend
  ['ottoman-empire-1299-1517::o5', 'anatolian-beyliks-1308-1500::c5'],      // the wars with Karaman
  ['ottoman-empire-1299-1517::x4', 'iran-1335-1501::c5'],      // Otluk Beli
  ['ottoman-empire-1299-1517::x4', 'iran-1335-1501::p6'],      // Uzun Hasan and the Aq Qoyunlu
  ['ottoman-empire-1299-1517::c9', 'safavid-1501-1722::c1'],      // the battle of Chaldiran
  ['ottoman-empire-1299-1517::c9', 'ottoman-anatolia-1500-1800::c2'],      // Çaldıran and the eastern frontier
  ['ottoman-empire-1299-1517::b5', 'ottoman-anatolia-1500-1800::c1'],      // Şahkulu’s rebellion
  ['ottoman-empire-1299-1517::b5', 'ottoman-anatolia-1500-1800::c3'],      // Selim’s suppression of the Kızılbaş
  ['ottoman-empire-1299-1517::p9', 'ottoman-anatolia-1500-1800::p1'],      // Selim I and the conquest of the East
  ['ottoman-empire-1299-1517::c10', 'mamluks-1250-1517::c11'],      // Marj Dabiq
  ['ottoman-empire-1299-1517::c10', 'mamluks-1250-1517::c12'],      // al-Raydaniyya and the fall of Cairo
  ['ottoman-empire-1299-1517::c10', 'mamluks-1250-1517::k14'],      // al-Ghawri, Tuman Bay and the Ottoman conquest
  ['ottoman-empire-1299-1517::c11', 'mamluks-1250-1517::c9'],      // the Taurus frontier war
  ['ottoman-empire-1299-1517::c11', 'anatolian-beyliks-1308-1500::c7'],      // the Ottoman–Mamluk war over Cilicia
  ['ottoman-empire-1299-1517::c11', 'cilician-armenia-1080-1375::c8'],      // the Mamluk conquest of Cilicia
  ['ottoman-empire-1299-1517::te4', 'mamluks-1250-1517::tc1'],      // gunpowder and the Mamluk resistance to firearms
  ['ottoman-empire-1299-1517::c5', 'trebizond-1204-1461::w4'],      // the last Greek state after 1453
  ['ottoman-empire-1299-1517::p7', 'trebizond-1204-1461::c6'],      // the fall of Trebizond
  ['ottoman-empire-1299-1517::c10', 'mamluks-1250-1517::w6'],      // the end of medieval Egypt
  ['ottoman-empire-1517-1683::p1', 'ottoman-empire-1299-1517::p9'],      // Selim I and the inheritance of Süleyman
  ['ottoman-empire-1517-1683::b1', 'ottoman-empire-1299-1517::c10'],      // Marj Dabiq and Ridaniya and the claim to the caliphate
  ['ottoman-empire-1517-1683::b1', 'hejaz-1517-1900::k1'],      // the Ottoman guardianship of the holy cities begins
  ['ottoman-empire-1517-1683::b1', 'egypt-1517-1798::k1'],      // Selim I conquers Egypt
  ['ottoman-empire-1517-1683::c6', 'ottoman-empire-1299-1517::c9'],      // Chaldiran and the later Safavid wars
  ['ottoman-empire-1517-1683::c6', 'safavid-1501-1722::p2'],      // Tahmasp I and the war with Süleyman
  ['ottoman-empire-1517-1683::c6', 'ottoman-anatolia-1500-1800::c5'],      // the Treaty of Amasya and the later wars
  ['ottoman-empire-1517-1683::c9', 'safavid-1501-1722::c3'],      // Shah Abbas’s reconquest from the Ottomans
  ['ottoman-empire-1517-1683::c9', 'iraq-1534-1831::k2'],      // the Persian interlude and Murad IV’s reconquest
  ['ottoman-empire-1517-1683::c9', 'iraq-1534-1831::c1'],      // four changes of hands and the Treaty of Zuhab
  ['ottoman-empire-1517-1683::c8', 'ottoman-anatolia-1500-1800::c4'],      // the Celali rebellions
  ['ottoman-empire-1517-1683::w1', 'ottoman-anatolia-1500-1800::w1'],      // the Little Ice Age and the famine
  ['ottoman-empire-1517-1683::w2', 'ottoman-anatolia-1500-1800::w2'],      // population pressure and the suhte
  ['ottoman-empire-1517-1683::o3', 'ottoman-anatolia-1500-1800::o1'],      // the cadastral surveys
  ['ottoman-empire-1517-1683::o4', 'ottoman-anatolia-1500-1800::o3'],      // the malikâne and tax farming
  ['ottoman-empire-1517-1683::o3', 'ottoman-empire-1299-1517::o2'],      // the timar system and its registers
  ['ottoman-empire-1517-1683::o1', 'ottoman-empire-1299-1517::o3'],      // Mehmed II’s kanunname and Süleyman’s
  ['ottoman-empire-1517-1683::o2', 'ottoman-empire-1299-1517::o3'],      // the fratricide clause and the cage
  ['ottoman-empire-1517-1683::o5', 'egypt-1517-1798::o1'],      // the eyalet of Egypt and its offices
  ['ottoman-empire-1517-1683::o5', 'ottoman-syria-1516-1800::o1'],      // provinces governed from Istanbul
  ['ottoman-empire-1517-1683::b3', 'ottoman-anatolia-1500-1800::b5'],      // Sabbatai Zevi at Smyrna
  ['ottoman-empire-1517-1683::b5', 'ottoman-empire-1299-1517::o4'],      // the patriarchate and the millet
  ['ottoman-empire-1517-1683::e1', 'ottoman-empire-1299-1517::e2'],      // the Üç Şerefeli and the Selimiye
  ['ottoman-empire-1517-1683::e2', 'ottoman-anatolia-1500-1800::e1'],      // the tiles of Iznik
  ['ottoman-empire-1517-1683::e4', 'ottoman-anatolia-1500-1800::t1'],      // Evliya Çelebi’s travel book
  ['ottoman-empire-1517-1683::t4', 'ottoman-anatolia-1500-1800::t2'],      // Katib Çelebi’s Cihannüma
  ['ottoman-empire-1517-1683::te2', 'ottoman-empire-1299-1517::te2'],      // Orban’s cannon and the imperial foundry
  ['ottoman-empire-1517-1683::ec1', 'ottoman-empire-1299-1517::ec4'],      // the akçe and its debasement
  ['ottoman-empire-1517-1683::ec3', 'ottoman-empire-1299-1517::ec1'],      // the silk of Bursa
  ['ottoman-empire-1517-1683::ec3', 'egypt-1517-1798::e1'],      // the Yemeni coffee boom
  ['ottoman-empire-1517-1683::ec3', 'yemen-1517-1900::o1'],      // the coffee monopoly and the Mocha customs
  ['ottoman-empire-1517-1683::x2', 'yemen-1517-1900::k1'],      // the Ottoman conquest of Yemen
  ['ottoman-empire-1517-1683::x3', 'ottoman-anatolia-1500-1800::x1'],      // the Levant Company and the consuls
  ['ottoman-empire-1517-1683::x1', 'ottoman-syria-1516-1800::x1'],      // French capitulations and consular trade
  ['ottoman-empire-1517-1683::p2', 'ottoman-empire-1299-1517::l2'],      // the sultans’ mothers and wives
  ['ottoman-empire-1517-1683::l1', 'ottoman-anatolia-1500-1800::l1'],      // women in the kadi’s court
  ['ottoman-empire-1517-1683::l4', 'ottoman-empire-1299-1517::o1'],      // the Janissaries and the devshirme
  ['ottoman-empire-1517-1683::p8', 'egypt-1517-1798::k5'],      // the Mamluk households return
  ['ottoman-empire-1683-1839::c1', 'ottoman-empire-1517-1683::c12'],      // the second siege of Vienna and the league war
  ['ottoman-empire-1683-1839::p1', 'ottoman-empire-1517-1683::p9'],      // the deposition of Mehmed IV
  ['ottoman-empire-1683-1839::o3', 'ottoman-empire-1517-1683::o4'],      // tax farming and the avarız
  ['ottoman-empire-1683-1839::o3', 'ottoman-anatolia-1500-1800::o3'],      // the malikâne and tax farming
  ['ottoman-empire-1683-1839::p6', 'ottoman-anatolia-1500-1800::p5'],      // the ayan houses
  ['ottoman-empire-1683-1839::p6', 'ottoman-anatolia-1500-1800::w3'],      // the age of the notables
  ['ottoman-empire-1683-1839::p5', 'ottoman-anatolia-1800-1908::p1'],      // Mahmud II and the end of the ayans
  ['ottoman-empire-1683-1839::c11', 'ottoman-anatolia-1800-1908::c1'],      // Ibrahim Pasha in Anatolia
  ['ottoman-empire-1683-1839::p7', 'egypt-1798-1900::k2'],      // Muhammad Ali, the founder
  ['ottoman-empire-1683-1839::p7', 'egypt-1798-1900::c2'],      // the massacre of the Mamluks
  ['ottoman-empire-1683-1839::c11', 'egypt-1798-1900::c6'],      // the Syrian wars and the crisis of 1840
  ['ottoman-empire-1683-1839::c8', 'egypt-1798-1900::c5'],      // the Greek war and Navarino
  ['ottoman-empire-1683-1839::c9', 'egypt-1798-1900::c5'],      // Navarino from the Egyptian side
  ['ottoman-empire-1683-1839::b1', 'hejaz-1517-1900::k4'],      // the First Saudi State takes the Hejaz
  ['ottoman-empire-1683-1839::b1', 'hejaz-1517-1900::k5'],      // the Egyptian reconquest and administration
  ['ottoman-empire-1683-1839::b1', 'egypt-1798-1900::c3'],      // the war against the Saudis in Arabia
  ['ottoman-empire-1683-1839::c6', 'egypt-1517-1798::c8'],      // the Pyramids, Aboukir and the Cairo revolt
  ['ottoman-empire-1683-1839::c6', 'egypt-1517-1798::xc6'],      // 1798 and the Eastern Question
  ['ottoman-empire-1683-1839::c6', 'ottoman-syria-1516-1800::c2'],      // Napoleon’s siege of Acre
  ['ottoman-empire-1683-1839::p7', 'egypt-1517-1798::k10'],      // Ibrahim Bey and Murad Bey before Muhammad Ali
  ['ottoman-empire-1683-1839::x2', 'iraq-1534-1831::c2'],      // Nadir Shah’s invasions
  ['ottoman-empire-1683-1839::x2', 'iraq-1534-1831::xc1'],      // the Ottoman–Persian border, fixed and disputed
  ['ottoman-empire-1683-1839::c5', 'iraq-1534-1831::k7'],      // the reform of the provinces and the end of the Mamluk regime in Baghdad
  ['ottoman-empire-1683-1839::t1', 'egypt-1798-1900::x1'],      // the Bulaq press and the coming of print
  ['ottoman-empire-1683-1839::te1', 'egypt-1798-1900::t2'],      // the new schools
  ['ottoman-empire-1683-1839::l3', 'ottoman-anatolia-1800-1908::p4'],      // the provincial elites of the nineteenth century
  ['ottoman-empire-1683-1839::ec4', 'egypt-1798-1900::o2'],      // the monopoly state and free trade
  ['ottoman-empire-1683-1839::w2', 'ottoman-anatolia-1800-1908::w2'],      // the census and the population
  ['ottoman-empire-1683-1839::b3', 'ottoman-empire-1517-1683::b5'],      // the Orthodox patriarchate and the Christians
  ['ottoman-empire-1683-1839::o6', 'ottoman-empire-1517-1683::l4'],      // the Janissary and the villager
  ['ottoman-empire-1683-1839::o1', 'ottoman-empire-1517-1683::c10'],      // the Cretan war and the Treaties of the later century
  ['ottoman-empire-1683-1839::e3', 'ottoman-empire-1517-1683::e1'],      // Sinan’s classical mosques and the Baroque
  ['ottoman-empire-1683-1839::o7', 'ottoman-empire-1517-1683::l3'],      // the Greek, Armenian and Jewish subjects
  ['ottoman-empire-1839-1908::p1', 'ottoman-empire-1683-1839::p5'],      // Mahmud II and the origins of the Tanzimat
  ['ottoman-empire-1839-1908::p2', 'ottoman-anatolia-1800-1908::p2'],      // Reşid, Âli and Fuad Pasha
  ['ottoman-empire-1839-1908::p5', 'ottoman-anatolia-1800-1908::p5'],      // Abdülhamid II
  ['ottoman-empire-1839-1908::p4', 'iraq-1831-1914::k2'],      // Midhat Pasha and the Tanzimat in full
  ['ottoman-empire-1839-1908::p4', 'iraq-1831-1914::l1'],      // Midhat Pasha
  ['ottoman-empire-1839-1908::o1', 'ottoman-anatolia-1800-1908::o1'],      // the Gülhane edict
  ['ottoman-empire-1839-1908::o3', 'ottoman-anatolia-1800-1908::o2'],      // the Land Code of 1858
  ['ottoman-empire-1839-1908::o3', 'ottoman-anatolia-1800-1908::o3'],      // the vilayet law of 1864
  ['ottoman-empire-1839-1908::o4', 'ottoman-anatolia-1800-1908::t1'],      // the Mecelle
  ['ottoman-empire-1839-1908::o5', 'ottoman-anatolia-1800-1908::o4'],      // the constitution of 1876
  ['ottoman-empire-1839-1908::o6', 'ottoman-anatolia-1800-1908::o5'],      // the Public Debt and the tobacco Régie
  ['ottoman-empire-1839-1908::b2', 'ottoman-anatolia-1800-1908::o6'],      // the Armenian National Constitution
  ['ottoman-empire-1839-1908::b5', 'ottoman-anatolia-1800-1908::b1'],      // the American colleges in Anatolia
  ['ottoman-empire-1839-1908::b5', 'ottoman-syria-1800-1908::b1'],      // the Syrian Protestant College opens
  ['ottoman-empire-1839-1908::c2', 'ottoman-syria-1800-1908::c2'],      // Mount Lebanon’s civil war and the Damascus massacre
  ['ottoman-empire-1839-1908::c6', 'ottoman-anatolia-1800-1908::c3'],      // the massacres of 1894–1896
  ['ottoman-empire-1839-1908::c5', 'ottoman-anatolia-1800-1908::c2'],      // Kars and the war of 1877–1878
  ['ottoman-empire-1839-1908::w1', 'ottoman-anatolia-1800-1908::x1'],      // the muhacir
  ['ottoman-empire-1839-1908::c3', 'ottoman-anatolia-1800-1908::x1'],      // the Circassian refugees
  ['ottoman-empire-1839-1908::w2', 'ottoman-anatolia-1800-1908::ec4'],      // the famine of 1873–1875
  ['ottoman-empire-1839-1908::w3', 'ottoman-anatolia-1800-1908::w2'],      // the census of 1881–1893
  ['ottoman-empire-1839-1908::t2', 'ottoman-anatolia-1800-1908::t2'],      // the Young Ottomans
  ['ottoman-empire-1839-1908::t3', 'egypt-1798-1900::b2'],      // al-Afghani, Abduh and Islamic modernism
  ['ottoman-empire-1839-1908::t4', 'levant-1908-1920::p1'],      // the Young Turk revolution of 1908
  ['ottoman-empire-1839-1908::ec4', 'ottoman-anatolia-1800-1908::ec1'],      // the Aydın and Anatolian railways
  ['ottoman-empire-1839-1908::x3', 'ottoman-anatolia-1800-1908::x3'],      // German capital and the Anatolian Railway
  ['ottoman-empire-1839-1908::x3', 'iraq-1831-1914::g2'],      // the Baghdad Railway
  ['ottoman-empire-1839-1908::x3', 'iraq-1831-1914::xc1'],      // the Anglo-Ottoman-German contest for Iraq
  ['ottoman-empire-1839-1908::te1', 'ottoman-anatolia-1800-1908::g1'],      // the telegraph and the steamer
  ['ottoman-empire-1839-1908::te2', 'ottoman-syria-1800-1908::tc1'],      // a pan-Islamic railway toward Medina
  ['ottoman-empire-1839-1908::e5', 'ottoman-anatolia-1800-1908::e2'],      // the sultan’s photograph albums
  ['ottoman-empire-1839-1908::l2', 'ottoman-anatolia-1800-1908::l4'],      // the Circassian slave trade and its abolition
  ['ottoman-empire-1839-1908::l1', 'ottoman-anatolia-1800-1908::l1'],      // the first schools for girls
  ['ottoman-empire-1839-1908::x2', 'egypt-1798-1900::c7'],      // Alexandria and Tel el-Kebir
  ['ottoman-empire-1839-1908::x2', 'egypt-1798-1900::k10'],      // the occupation and Lord Cromer
  ['ottoman-empire-1839-1908::ec1', 'egypt-1798-1900::o5'],      // the debt and the Caisse de la Dette
  ['ottoman-empire-1839-1908::x1', 'ottoman-empire-1683-1839::x4'],      // the Eastern Question
  ['ottoman-empire-1908-1922::p1', 'anatolia-1908-1923::p1'],      // Abdülhamid II restored to a constitution
  ['ottoman-empire-1908-1922::p1', 'anatolia-1908-1923::p2'],      // Mehmed V Reşad
  ['ottoman-empire-1908-1922::p2', 'anatolia-1908-1923::p7'],      // the triumvirate: Talat, Enver and Cemal
  ['ottoman-empire-1908-1922::p3', 'anatolia-1908-1923::p3'],      // Mehmed VI Vahdeddin
  ['ottoman-empire-1908-1922::p5', 'anatolia-1908-1923::p9'],      // Mustafa Kemal and the Representative Committee
  ['ottoman-empire-1908-1922::p5', 'anatolia-1908-1923::p10'],      // the Grand National Assembly
  ['ottoman-empire-1908-1922::p6', 'hejaz-1900-1925::k2'],      // Sharif Hussein bin Ali
  ['ottoman-empire-1908-1922::c1', 'anatolia-1908-1923::c1'],      // the Young Turk revolution
  ['ottoman-empire-1908-1922::c3', 'anatolia-1908-1923::c3'],      // the Balkan Wars
  ['ottoman-empire-1908-1922::c6', 'anatolia-1908-1923::c4'],      // Sarıkamış
  ['ottoman-empire-1908-1922::c8', 'anatolia-1908-1923::c5'],      // Gallipoli
  ['ottoman-empire-1908-1922::c9', 'iraq-1914-1958::c1'],      // the Mesopotamian campaign and the siege of Kut
  ['ottoman-empire-1908-1922::c10', 'anatolia-1908-1923::c7'],      // the Armenian genocide in Anatolia
  ['ottoman-empire-1908-1922::c10', 'anatolia-1908-1923::c8'],      // the arrests of 24 April 1915
  ['ottoman-empire-1908-1922::c11', 'anatolia-1908-1923::c10'],      // the Sayfo
  ['ottoman-empire-1908-1922::c12', 'hejaz-1900-1925::c2'],      // the revolt in the Hejaz
  ['ottoman-empire-1908-1922::c12', 'levant-1908-1920::p3'],      // the Arab Revolt begins
  ['ottoman-empire-1908-1922::c13', 'levant-1908-1920::p4'],      // Allenby’s Sinai and Palestine campaign
  ['ottoman-empire-1908-1922::c13', 'levant-1908-1920::c2'],      // the capture of Jerusalem
  ['ottoman-empire-1908-1922::c12', 'levant-1908-1920::c1'],      // the battle of Aqaba
  ['ottoman-empire-1908-1922::c7', 'egypt-1900-1952::c2'],      // the First World War in Egypt
  ['ottoman-empire-1908-1922::c14', 'anatolia-1908-1923::o5'],      // the armistice of Mudros
  ['ottoman-empire-1908-1922::c15', 'anatolia-1908-1923::c12'],      // the Greek landing at Smyrna
  ['ottoman-empire-1908-1922::c15', 'anatolia-1908-1923::c13'],      // Sakarya
  ['ottoman-empire-1908-1922::c15', 'anatolia-1908-1923::c14'],      // the Great Offensive and Dumlupınar
  ['ottoman-empire-1908-1922::c5', 'caucasus-1917-1921::c1'],      // the Ottoman offensive and the Treaty of Batum
  ['ottoman-empire-1908-1922::o1', 'anatolia-1908-1923::o1'],      // the restored constitution and its amendment
  ['ottoman-empire-1908-1922::o2', 'levant-1908-1920::o2'],      // the Sykes–Picot Agreement
  ['ottoman-empire-1908-1922::o2', 'levant-1908-1920::o3'],      // the Balfour Declaration
  ['ottoman-empire-1908-1922::o2', 'hejaz-1900-1925::c1'],      // the McMahon–Hussein bargain
  ['ottoman-empire-1908-1922::x2', 'levant-1908-1920::o1'],      // the Hussein–McMahon correspondence
  ['ottoman-empire-1908-1922::o3', 'anatolia-1908-1923::o3'],      // the deportation law and the abandoned property laws
  ['ottoman-empire-1908-1922::o5', 'anatolia-1908-1923::o6'],      // the Treaty of Sèvres
  ['ottoman-empire-1908-1922::o6', 'anatolia-1908-1923::o9'],      // the abolition of the sultanate
  ['ottoman-empire-1908-1922::b1', 'anatolia-1908-1923::b1'],      // the jihad declaration
  ['ottoman-empire-1908-1922::b2', 'anatolia-1908-1923::b4'],      // the Christian churches of Anatolia after 1915
  ['ottoman-empire-1908-1922::b3', 'anatolia-1908-1923::p4'],      // Abdülmecid II as caliph
  ['ottoman-empire-1908-1922::e1', 'anatolia-1908-1923::e3'],      // the first Ottoman film
  ['ottoman-empire-1908-1922::e2', 'anatolia-1908-1923::e1'],      // the Independence March
  ['ottoman-empire-1908-1922::e4', 'anatolia-1908-1923::e2'],      // the Armenian writers of 1915
  ['ottoman-empire-1908-1922::t1', 'anatolia-1908-1923::t1'],      // Ziya Gökalp and Turkism
  ['ottoman-empire-1908-1922::t2', 'levant-1908-1920::t1'],      // Arab nationalist societies organise
  ['ottoman-empire-1908-1922::t3', 'anatolia-1908-1923::w2'],      // the American mandate question
  ['ottoman-empire-1908-1922::ec1', 'anatolia-1908-1923::ec1'],      // the national economy policy
  ['ottoman-empire-1908-1922::ec3', 'levant-1908-1920::ec1'],      // the great famine of Mount Lebanon
  ['ottoman-empire-1908-1922::ec3', 'anatolia-1908-1923::ec3'],      // the wartime famine
  ['ottoman-empire-1908-1922::te1', 'anatolia-1908-1923::g2'],      // the Taurus and Amanus tunnels
  ['ottoman-empire-1908-1922::x1', 'anatolia-1908-1923::x1'],      // the German alliance
  ['ottoman-empire-1908-1922::x4', 'anatolia-1908-1923::x3'],      // the treaties of Moscow and Kars
  ['ottoman-empire-1908-1922::w1', 'anatolia-1908-1923::x2'],      // the refugees from the Balkans
  ['ottoman-empire-1908-1922::w1', 'anatolia-1908-1923::w6'],      // the new demography of Anatolia
  ['ottoman-empire-1908-1922::w2', 'anatolia-1908-1923::w5'],      // the influenza and typhus epidemics
  ['ottoman-empire-1908-1922::l1', 'anatolia-1908-1923::l1'],      // the women’s organisations and press
  ['ottoman-empire-1908-1922::l2', 'anatolia-1908-1923::l3'],      // the orphans and the converted
  ['ottoman-empire-1908-1922::l3', 'anatolia-1908-1923::l4'],      // the conscripts and deserters
  ['ottoman-empire-1908-1922::l4', 'anatolia-1908-1923::c11'],      // the persecution of the Ottoman Greeks
  ['ottoman-empire-1908-1922::l4', 'anatolia-1908-1923::c15'],      // the burning of Smyrna
  ['ottoman-empire-1908-1922::p2', 'ottoman-empire-1839-1908::t4'],      // the Committee of Union and Progress in opposition
  ['ottoman-empire-1908-1922::o4', 'ottoman-empire-1839-1908::x4'],      // the capitulations in the age of the Tanzimat
  ['ottoman-empire-1908-1922::c1', 'ottoman-empire-1839-1908::p5'],      // Abdülhamid II and the revolution
  ['byzantine-empire-632-867::p1', 'late-roman-anatolia-330-632::p7'],      // Heraclius
  ['byzantine-empire-632-867::p1', 'roman-byzantine-levant-135-638::p6'],      // Persian conquest and Byzantine restoration
  ['byzantine-empire-632-867::p1', 'egypt-300-641::k7'],      // Heraclius — Egypt lost and lost again
  ['byzantine-empire-632-867::p2', 'byzantine-anatolia-632-867::p1'],      // Constans II and the first themes
  ['byzantine-empire-632-867::p3', 'byzantine-anatolia-632-867::p2'],      // Constantine IV and Justinian II
  ['byzantine-empire-632-867::p4', 'byzantine-anatolia-632-867::p2'],      // Justinian II
  ['byzantine-empire-632-867::p5', 'byzantine-anatolia-632-867::p3'],      // Leo III and Constantine V
  ['byzantine-empire-632-867::p6', 'byzantine-anatolia-632-867::p3'],      // Constantine V
  ['byzantine-empire-632-867::p7', 'byzantine-anatolia-632-867::l1'],      // Irene — the empress who ruled as emperor
  ['byzantine-empire-632-867::p7', 'byzantine-anatolia-632-867::p4'],      // Irene and Nikephoros I
  ['byzantine-empire-632-867::p8', 'byzantine-anatolia-632-867::c12'],      // Nikephoros at Pliska
  ['byzantine-empire-632-867::p9', 'byzantine-anatolia-632-867::p5'],      // Michael II and Theophilus
  ['byzantine-empire-632-867::c1', 'caliphate-632-750::c2'],      // Ajnadayn and Yarmuk — Byzantine Syria falls
  ['byzantine-empire-632-867::c2', 'caliphate-632-750::c4'],      // the conquest of Egypt
  ['byzantine-empire-632-867::c2', 'egypt-300-641::k15'],      // the Arab conquest of Egypt
  ['byzantine-empire-632-867::c2', 'egypt-300-641::c8'],      // Heliopolis and the siege of Babylon
  ['byzantine-empire-632-867::c2', 'levant-634-750::c1'],      // the fall of Caesarea
  ['byzantine-empire-632-867::c3', 'byzantine-anatolia-632-867::c2'],      // the first siege of Constantinople
  ['byzantine-empire-632-867::c3', 'levant-634-750::c3'],      // the sieges of Constantinople
  ['byzantine-empire-632-867::c4', 'byzantine-anatolia-632-867::c4'],      // the second siege of Constantinople
  ['byzantine-empire-632-867::c5', 'byzantine-anatolia-632-867::c5'],      // Akroinon
  ['byzantine-empire-632-867::c7', 'byzantine-anatolia-632-867::c8'],      // the sack of Amorion
  ['byzantine-empire-632-867::c9', 'byzantine-anatolia-632-867::x4'],      // the Rus attack of 860
  ['byzantine-empire-632-867::c10', 'byzantine-anatolia-632-867::c9'],      // Thomas the Slav’s revolt
  ['byzantine-empire-632-867::o1', 'byzantine-anatolia-632-867::o1'],      // the theme system
  ['byzantine-empire-632-867::o2', 'byzantine-anatolia-632-867::o3'],      // the Ecloga of Leo III
  ['byzantine-empire-632-867::o3', 'byzantine-anatolia-632-867::o2'],      // the Farmer’s Law
  ['byzantine-empire-632-867::b2', 'byzantine-anatolia-632-867::b1'],      // the ban on icons
  ['byzantine-empire-632-867::b3', 'byzantine-anatolia-632-867::b2'],      // the Second Council of Nicaea
  ['byzantine-empire-632-867::e1', 'byzantine-anatolia-632-867::e1'],      // the cross of Hagia Eirene
  ['byzantine-empire-632-867::e2', 'byzantine-anatolia-632-867::e2'],      // the Chludov Psalter
  ['byzantine-empire-632-867::te1', 'byzantine-anatolia-632-867::g1'],      // Greek fire
  ['byzantine-empire-632-867::te3', 'byzantine-anatolia-632-867::g3'],      // the beacon line
  ['byzantine-empire-632-867::x1', 'byzantine-anatolia-632-867::x3'],      // the Khazar marriage
  ['byzantine-empire-632-867::x3', 'byzantine-anatolia-632-867::x1'],      // the exchanges of prisoners on the Lamos
  ['byzantine-empire-632-867::w1', 'byzantine-anatolia-632-867::w2'],      // the plague of 747
  ['byzantine-empire-632-867::w3', 'byzantine-anatolia-632-867::l4'],      // the people moved to Thrace
  ['byzantine-empire-632-867::ec1', 'byzantine-anatolia-632-867::ec1'],      // the shrinking cities
  ['byzantine-empire-632-867::ec2', 'byzantine-anatolia-632-867::ec2'],      // peasants of the Farmer’s Law
  ['byzantine-empire-632-867::l1', 'byzantine-anatolia-632-867::l1'],      // Irene and the empresses
  ['byzantine-empire-632-867::o5', 'caliphate-632-750::k8'],      // Abd al-Malik and the two empires’ rivalry
  ['byzantine-empire-867-1204::p1', 'byzantine-anatolia-867-1071::p1'],      // Basil I
  ['byzantine-empire-867-1204::p2', 'byzantine-anatolia-867-1071::p2'],      // Leo VI the Wise
  ['byzantine-empire-867-1204::p4', 'byzantine-anatolia-867-1071::p3'],      // Romanos I Lekapenos
  ['byzantine-empire-867-1204::p5', 'byzantine-anatolia-867-1071::p4'],      // Nikephoros II Phokas
  ['byzantine-empire-867-1204::p6', 'byzantine-anatolia-867-1071::p5'],      // John I Tzimiskes
  ['byzantine-empire-867-1204::p7', 'byzantine-anatolia-867-1071::p6'],      // Basil II
  ['byzantine-empire-867-1204::p8', 'byzantine-anatolia-867-1071::p7'],      // the heirs of Basil II
  ['byzantine-empire-867-1204::p8', 'byzantine-anatolia-867-1071::l1'],      // Zoe and Theodora
  ['byzantine-empire-867-1204::p9', 'byzantine-anatolia-867-1071::p8'],      // Isaac Komnenos to Romanos Diogenes
  ['byzantine-empire-867-1204::c6', 'byzantine-anatolia-867-1071::c9'],      // Manzikert
  ['byzantine-empire-867-1204::c6', 'seljuks-of-rum-1071-1308::p1'],      // Suleyman ibn Qutalmish at Nicaea
  ['byzantine-empire-867-1204::c8', 'seljuks-of-rum-1071-1308::c2'],      // Nicaea and Dorylaeum
  ['byzantine-empire-867-1204::c9', 'seljuks-of-rum-1071-1308::c5'],      // Myriokephalon
  ['byzantine-empire-867-1204::c9', 'seljuks-of-rum-1071-1308::p3'],      // Masud I and Kilij Arslan II
  ['byzantine-empire-867-1204::p11', 'cilician-armenia-1080-1375::c1'],      // John II Komnenos’s campaign
  ['byzantine-empire-867-1204::p11', 'cilician-armenia-1080-1375::c2'],      // Manuel I and Thoros II
  ['byzantine-empire-867-1204::c13', 'seljuks-of-rum-1071-1308::w2'],      // the Fourth Crusade and the Greek exiles
  ['byzantine-empire-867-1204::c13', 'trebizond-1204-1461::p1'],      // Alexios I and David — the foundation of Trebizond
  ['byzantine-empire-867-1204::c2', 'levant-750-1099::c1'],      // the Byzantine reconquest of Antioch
  ['byzantine-empire-867-1204::b5', 'levant-750-1099::b1'],      // al-Hakim destroys the Holy Sepulchre
  ['byzantine-empire-867-1204::x5', 'levant-750-1099::p4'],      // the Fatimid conquest and a rival caliphate
  ['byzantine-empire-867-1204::c8', 'crusader-states-1099-1291::c6'],      // the crusader states and Antioch
  ['byzantine-empire-867-1204::o2', 'byzantine-anatolia-867-1071::o2'],      // the laws against the powerful
  ['byzantine-empire-867-1204::o1', 'byzantine-anatolia-867-1071::o1'],      // the Book of the Eparch
  ['byzantine-empire-867-1204::ec1', 'byzantine-anatolia-867-1071::ec1'],      // Eustathios Maleinos and the great estates
  ['byzantine-empire-867-1204::ec3', 'byzantine-anatolia-867-1071::o4'],      // the debasement of the nomisma
  ['byzantine-empire-867-1204::b1', 'byzantine-anatolia-867-1071::x1'],      // the marriage of Anna and the baptism of Vladimir
  ['byzantine-empire-867-1204::b2', 'byzantine-anatolia-867-1071::b1'],      // the schism of 1054
  ['byzantine-empire-867-1204::b3', 'byzantine-anatolia-867-1071::b2'],      // Lazaros of Galesion and the holy mountains
  ['byzantine-empire-867-1204::e1', 'byzantine-anatolia-867-1071::e2'],      // the Paris Psalter and the Joshua Roll
  ['byzantine-empire-867-1204::e3', 'byzantine-anatolia-867-1071::e3'],      // Digenes Akrites
  ['byzantine-empire-867-1204::e5', 'byzantine-anatolia-867-1071::t4'],      // Michael Psellos
  ['byzantine-empire-867-1204::t1', 'byzantine-anatolia-867-1071::t1'],      // Constantine Porphyrogennetos
  ['byzantine-empire-867-1204::w1', 'byzantine-anatolia-867-1071::w3'],      // the Turkmen arrive
  ['byzantine-empire-867-1204::w2', 'byzantine-anatolia-867-1071::w2'],      // the earthquake of 989
  ['byzantine-empire-867-1204::l3', 'byzantine-anatolia-867-1071::l3'],      // the frontier of the Akritai
  ['byzantine-empire-867-1204::b4', 'byzantine-anatolia-867-1071::b4'],      // the Paulicians moved to Thrace
  ['byzantine-empire-1204-1453::p9', 'trebizond-1204-1461::p1'],      // Alexios I and David — the foundation
  ['byzantine-empire-1204-1453::p9', 'trebizond-1204-1461::o1'],      // the court of the Grand Komnenoi
  ['byzantine-empire-1204-1453::c9', 'trebizond-1204-1461::w4'],      // the last Greek state after 1453
  ['byzantine-empire-1204-1453::c10', 'ottoman-empire-1299-1517::c4'],      // the battle of Varna
  ['byzantine-empire-1204-1453::c9', 'ottoman-empire-1299-1517::c5'],      // the conquest of Constantinople
  ['byzantine-empire-1204-1453::c7', 'ottoman-empire-1299-1517::p2'],      // Orhan and the crossing to Europe
  ['byzantine-empire-1204-1453::c7', 'anatolian-beyliks-1308-1500::x3'],      // the crossing at Çimpe
  ['byzantine-empire-1204-1453::c5', 'anatolian-beyliks-1308-1500::x1'],      // Umur Bey and John Kantakouzenos
  ['byzantine-empire-1204-1453::c8', 'ottoman-empire-1299-1517::p4'],      // Bayezid I and the siege
  ['byzantine-empire-1204-1453::c8', 'anatolian-beyliks-1308-1500::c4'],      // the battle of Ankara
  ['byzantine-empire-1204-1453::c7', 'anatolian-beyliks-1308-1500::p10'],      // Murad I and Bayezid I
  ['byzantine-empire-1204-1453::w1', 'anatolian-beyliks-1308-1500::w2'],      // the Black Death in Anatolia
  ['byzantine-empire-1204-1453::w1', 'trebizond-1204-1461::w2'],      // the Black Death at Trebizond
  ['byzantine-empire-1204-1453::w2', 'anatolian-beyliks-1308-1500::w1'],      // the fragments of the Seljuk and Ilkhanid state
  ['byzantine-empire-1204-1453::w2', 'anatolian-beyliks-1308-1500::p9'],      // Osman and Orhan
  ['byzantine-empire-1204-1453::c2', 'seljuks-of-rum-1071-1308::w2'],      // the Fourth Crusade and the Greek exiles
  ['byzantine-empire-1204-1453::p3', 'byzantine-empire-867-1204::c13'],      // the Fourth Crusade and the sack of Constantinople
  ['byzantine-empire-1204-1453::p10', 'byzantine-empire-867-1204::c13'],      // the Latin empire from the sack
  ['byzantine-empire-1204-1453::t2', 'trebizond-1204-1461::t2'],      // Chioniades and Persian astronomy
  ['byzantine-empire-1204-1453::t2', 'ilkhanate-1219-1335::tc1'],      // Maragheh’s astronomical instruments
  ['byzantine-empire-1204-1453::t4', 'trebizond-1204-1461::b2'],      // Bessarion and the Council of Florence
  ['byzantine-empire-1204-1453::x2', 'mamluks-1250-1517::k3'],      // Baybars and the empire
  ['byzantine-empire-1204-1453::x4', 'anatolian-beyliks-1308-1500::x2'],      // the treaties with Venice
  ['byzantine-empire-1204-1453::l3', 'trebizond-1204-1461::c4'],      // the anarchy of the 1340s
  ['byzantine-empire-1204-1453::e1', 'anatolian-beyliks-1308-1500::e1'],      // the mosques of Bursa and the churches of the capital
  ['byzantine-empire-1204-1453::c1', 'byzantine-empire-867-1204::c12'],      // the revolt of Asen and Peter and the second Bulgarian empire
  ['byzantine-empire-1204-1453::ec1', 'ottoman-empire-1299-1517::x1'],      // the Venetian treaty and Galata
  ['byzantine-empire-1204-1453::p6', 'ottoman-empire-1299-1517::p4'],      // Manuel II and Bayezid I
  ['great-seljuk-empire-1037-1194::p1', 'iran-1055-1219::p1'],      // Tughril Beg — founding the sultanate
  ['great-seljuk-empire-1037-1194::p2', 'iran-1055-1219::p2'],      // Alp Arslan — Manzikert
  ['great-seljuk-empire-1037-1194::p3', 'iran-1055-1219::p3'],      // Malik-Shah I and Nizam al-Mulk
  ['great-seljuk-empire-1037-1194::p4', 'iran-1055-1219::p3'],      // Nizam al-Mulk and Malik-Shah
  ['great-seljuk-empire-1037-1194::p5', 'iran-1055-1219::p4'],      // the fragmentation after Malik-Shah
  ['great-seljuk-empire-1037-1194::p5', 'iran-1055-1219::c4'],      // the Seljuk succession wars
  ['great-seljuk-empire-1037-1194::p6', 'iran-1055-1219::p5'],      // Sanjar — the last great Seljuk
  ['great-seljuk-empire-1037-1194::p7', 'iran-1055-1219::p6'],      // the Khwarazmian rise
  ['great-seljuk-empire-1037-1194::c1', 'iran-821-1055::p4'],      // Mahmud of Ghazna and the Ghaznavids
  ['great-seljuk-empire-1037-1194::c2', 'iran-1055-1219::c1'],      // Tughril Beg enters Baghdad
  ['great-seljuk-empire-1037-1194::c2', 'caliphate-945-1258::k9'],      // Tughril Beg — the Seljuks take Baghdad
  ['great-seljuk-empire-1037-1194::c2', 'iraq-945-1258::k2'],      // the Seljuk sultans take Baghdad
  ['great-seljuk-empire-1037-1194::c2', 'iran-821-1055::p5'],      // the Buyid amirate
  ['great-seljuk-empire-1037-1194::c3', 'iran-1055-1219::c2'],      // the battle of Manzikert
  ['great-seljuk-empire-1037-1194::c3', 'byzantine-anatolia-867-1071::c9'],      // Manzikert
  ['great-seljuk-empire-1037-1194::c3', 'byzantine-empire-867-1204::c6'],      // Manzikert from the Byzantine side
  ['great-seljuk-empire-1037-1194::c8', 'iran-1055-1219::c3'],      // the assassination of Nizam al-Mulk
  ['great-seljuk-empire-1037-1194::c6', 'iran-1055-1219::c6'],      // the battle of Qatwan
  ['great-seljuk-empire-1037-1194::c7', 'iran-1055-1219::c5'],      // the Ghuzz revolt and Sanjar’s captivity
  ['great-seljuk-empire-1037-1194::c5', 'iran-1055-1219::b1'],      // the Nizari Ismaili state at Alamut
  ['great-seljuk-empire-1037-1194::c9', 'crusader-states-1099-1291::c1'],      // the First Crusade and the crusader states
  ['great-seljuk-empire-1037-1194::c4', 'levant-750-1099::p6'],      // the Fatimid reconquest and then the crusaders
  ['great-seljuk-empire-1037-1194::o1', 'caliphate-945-1258::o2'],      // the sultanate and Nizam al-Mulk’s manual of rule
  ['great-seljuk-empire-1037-1194::o2', 'iran-1055-1219::ec2'],      // the iqta land-grant system
  ['great-seljuk-empire-1037-1194::o3', 'iran-1055-1219::o1'],      // the Nizamiyya madrasas
  ['great-seljuk-empire-1037-1194::o3', 'iraq-945-1258::b3'],      // al-Ghazali at the Nizamiyya
  ['great-seljuk-empire-1037-1194::o4', 'iran-1055-1219::t2'],      // Nizam al-Mulk’s Siyasatnama
  ['great-seljuk-empire-1037-1194::o5', 'iran-1055-1219::o2'],      // the atabeg system
  ['great-seljuk-empire-1037-1194::b1', 'iran-1055-1219::b2'],      // the Sunni revival under Seljuk patronage
  ['great-seljuk-empire-1037-1194::b1', 'iraq-945-1258::b2'],      // the Seljuk restoration of Sunnism
  ['great-seljuk-empire-1037-1194::b3', 'caliphate-945-1258::b2'],      // al-Ghazali — law, theology and Sufism reconciled
  ['great-seljuk-empire-1037-1194::b3', 'caliphate-945-1258::t3'],      // al-Ghazali against the philosophers
  ['great-seljuk-empire-1037-1194::b4', 'iran-1055-1219::b3'],      // Abdullah Ansari of Herat
  ['great-seljuk-empire-1037-1194::e1', 'iran-1055-1219::e1'],      // the Great Mosque of Isfahan’s dome chambers
  ['great-seljuk-empire-1037-1194::e1', 'caliphate-945-1258::e1'],      // the four-iwan plan and the Seljuk dome
  ['great-seljuk-empire-1037-1194::e2', 'iran-1055-1219::e3'],      // Sanjar’s mausoleum at Merv
  ['great-seljuk-empire-1037-1194::e3', 'iran-1055-1219::e5'],      // Sana’i and Attar: Persian Sufi poetry
  ['great-seljuk-empire-1037-1194::t1', 'iran-1055-1219::t1'],      // Omar Khayyam and the Jalali calendar
  ['great-seljuk-empire-1037-1194::te1', 'iran-1055-1219::tc1'],      // the caravanserai network
  ['great-seljuk-empire-1037-1194::ec2', 'iran-1055-1219::ec1'],      // a unified plateau’s commercial peak
  ['great-seljuk-empire-1037-1194::x1', 'seljuks-of-rum-1071-1308::p1'],      // Suleyman ibn Qutalmish at Nicaea
  ['great-seljuk-empire-1037-1194::w1', 'iran-1055-1219::x1'],      // Turkic settlement pours into Anatolia
  ['great-seljuk-empire-1037-1194::x3', 'caucasus-1064-1243::c2'],      // Georgia and the battle of Didgori
  ['great-seljuk-empire-1037-1194::l1', 'iran-821-1055::l1'],      // royal women at the Samanid and Buyid courts
  ['late-bronze-age-system-1550bc-1200bc::p1', 'egypt-1550bc-1200bc::k6'],      // Thutmose III — the empire at its greatest extent
  ['late-bronze-age-system-1550bc-1200bc::c1', 'egypt-1550bc-1200bc::c3'],      // the Battle of Megiddo
  ['late-bronze-age-system-1550bc-1200bc::c1', 'canaan-2000bc-1200bc::c1'],      // the Battle of Megiddo and Canaan
  ['late-bronze-age-system-1550bc-1200bc::p2', 'egypt-1550bc-1200bc::k9'],      // Amenhotep III — the reign of magnificence
  ['late-bronze-age-system-1550bc-1200bc::p3', 'egypt-1550bc-1200bc::k10'],      // Akhenaten — the Aten and the abandoned capital
  ['late-bronze-age-system-1550bc-1200bc::b1', 'egypt-1550bc-1200bc::b2'],      // Akhenaten’s one god
  ['late-bronze-age-system-1550bc-1200bc::e1', 'egypt-1550bc-1200bc::x3'],      // the Amarna style
  ['late-bronze-age-system-1550bc-1200bc::p4', 'egypt-1550bc-1200bc::k17'],      // Ramesses II — sixty-six years and the Hittite peace
  ['late-bronze-age-system-1550bc-1200bc::c3', 'egypt-1550bc-1200bc::c6'],      // the Battle of Kadesh
  ['late-bronze-age-system-1550bc-1200bc::c3', 'hittite-1650bc-1180bc::c7'],      // the battle of Kadesh from the Hittite side
  ['late-bronze-age-system-1550bc-1200bc::o1', 'egypt-1550bc-1200bc::c7'],      // the Egyptian–Hittite peace treaty
  ['late-bronze-age-system-1550bc-1200bc::o1', 'hittite-1650bc-1180bc::x1'],      // the silver treaty with Egypt
  ['late-bronze-age-system-1550bc-1200bc::p6', 'hittite-1650bc-1180bc::p6'],      // Suppiluliuma I — the founder of the empire
  ['late-bronze-age-system-1550bc-1200bc::c2', 'hittite-1650bc-1180bc::c5'],      // the fall of Mitanni
  ['late-bronze-age-system-1550bc-1200bc::w1', 'hittite-1650bc-1180bc::w2'],      // the plague that came with the prisoners
  ['late-bronze-age-system-1550bc-1200bc::p7', 'hittite-1650bc-1180bc::p8'],      // Muwatalli II — Kadesh and the move south
  ['late-bronze-age-system-1550bc-1200bc::p7', 'hittite-1650bc-1180bc::p10'],      // Hattusili III and Puduhepa — the joint reign
  ['late-bronze-age-system-1550bc-1200bc::l1', 'hittite-1650bc-1180bc::l1'],      // Puduhepa — queen and priestess
  ['late-bronze-age-system-1550bc-1200bc::t3', 'hittite-1650bc-1180bc::t4'],      // the tablet houses of Hattusa
  ['late-bronze-age-system-1550bc-1200bc::te1', 'hittite-1650bc-1180bc::t3'],      // Kikkuli’s horse-training manual
  ['late-bronze-age-system-1550bc-1200bc::te1', 'hittite-1650bc-1180bc::g2'],      // the three-man chariot
  ['late-bronze-age-system-1550bc-1200bc::e2', 'hittite-1650bc-1180bc::e1'],      // the walls and gates of Hattusa
  ['late-bronze-age-system-1550bc-1200bc::b2', 'hittite-1650bc-1180bc::b1'],      // the thousand gods of Hatti
  ['late-bronze-age-system-1550bc-1200bc::o3', 'hittite-1650bc-1180bc::o2'],      // the Hittite Laws
  ['late-bronze-age-system-1550bc-1200bc::c4', 'hittite-1650bc-1180bc::c8'],      // Nihriya and the Assyrian threat
  ['late-bronze-age-system-1550bc-1200bc::c4', 'assyria-1400bc-1050bc::c2'],      // the battle of Nihriya against the Hittites
  ['late-bronze-age-system-1550bc-1200bc::c5', 'babylon-1595bc-1155bc::c3'],      // Tukulti-Ninurta takes Babylon
  ['late-bronze-age-system-1550bc-1200bc::c5', 'assyria-1400bc-1050bc::c3'],      // the conquest of Babylon
  ['late-bronze-age-system-1550bc-1200bc::p8', 'babylon-1595bc-1155bc::k4'],      // Kurigalzu I, the builder-king
  ['late-bronze-age-system-1550bc-1200bc::p8', 'babylon-1595bc-1155bc::k5'],      // Burna-Buriash II and the brotherhood of kings
  ['late-bronze-age-system-1550bc-1200bc::p9', 'assyria-1400bc-1050bc::k1'],      // Ashur-uballit I founds the Assyrian state
  ['late-bronze-age-system-1550bc-1200bc::o5', 'babylon-1595bc-1155bc::o1'],      // the kudurru — the boundary stone
  ['late-bronze-age-system-1550bc-1200bc::o2', 'egypt-1550bc-1200bc::xc1'],      // the Amarna letters and the great kings
  ['late-bronze-age-system-1550bc-1200bc::o2', 'babylon-1595bc-1155bc::xc2'],      // the Amarna letters of the Babylonian kings
  ['late-bronze-age-system-1550bc-1200bc::x1', 'egypt-1550bc-1200bc::xc2'],      // marrying into Egypt
  ['late-bronze-age-system-1550bc-1200bc::ec2', 'egypt-1550bc-1200bc::xc5'],      // the Uluburun ship
  ['late-bronze-age-system-1550bc-1200bc::ec2', 'hittite-1650bc-1180bc::x6'],      // the Uluburun ship from the Hittite side
  ['late-bronze-age-system-1550bc-1200bc::x2', 'hittite-1650bc-1180bc::x4'],      // Ahhiyawa, Millawanda and Piyamaradu
  ['late-bronze-age-system-1550bc-1200bc::w2', 'hittite-1650bc-1180bc::w3'],      // drought at the end
  ['late-bronze-age-system-1550bc-1200bc::w2', 'egypt-1550bc-1200bc::w5'],      // the drying of the eastern Mediterranean
  ['late-bronze-age-system-1550bc-1200bc::l2', 'egypt-1550bc-1200bc::l2'],      // Nefertiti and the family as icon
  ['late-bronze-age-system-1550bc-1200bc::l2', 'egypt-1550bc-1200bc::l3'],      // Queen Tiye
  ['late-bronze-age-system-1550bc-1200bc::p10', 'canaan-2000bc-1200bc::p2'],      // Late Bronze Canaan under Egyptian rule
  ['late-bronze-age-system-1550bc-1200bc::p10', 'canaan-2000bc-1200bc::c2'],      // vassal rivalries in the Amarna letters
  ['late-bronze-age-system-1550bc-1200bc::o4', 'canaan-2000bc-1200bc::o1'],      // Egyptian garrison administration
  ['late-bronze-age-system-1550bc-1200bc::l3', 'canaan-2000bc-1200bc::l1'],      // the Habiru — a stateless class
  ['late-bronze-age-system-1550bc-1200bc::p11', 'canaan-2000bc-1200bc::p3'],      // Ugarit’s golden age
  ['late-bronze-age-system-1550bc-1200bc::b3', 'canaan-2000bc-1200bc::b1'],      // the Baal Cycle and Ugaritic religion
  ['late-bronze-age-system-1550bc-1200bc::t2', 'canaan-2000bc-1200bc::t2'],      // the Ugaritic alphabetic cuneiform
  ['late-bronze-age-system-1550bc-1200bc::ec3', 'canaan-2000bc-1200bc::l2'],      // women’s property rights at Ugarit
  ['late-bronze-age-system-1550bc-1200bc::p11', 'egypt-1200bc-664bc::c1'],      // the end of Ugarit and the Sea Peoples
  ['late-bronze-age-system-1550bc-1200bc::w2', 'philistia-1200bc-604bc::p1'],      // the Peleset settle the coastal plain
  ['roman-parthian-world-63bc-224ad::p1', 'herod-judea-63bc-135ce::p1'],      // Pompey’s settlement
  ['roman-parthian-world-63bc-224ad::p1', 'decapolis-63bc-106ce::p2'],      // Pompey’s liberation of the cities
  ['roman-parthian-world-63bc-224ad::p1', 'roman-anatolia-133bc-330::p3'],      // Pompey’s settlement of the East
  ['roman-parthian-world-63bc-224ad::p1', 'hellenistic-age-323bc-30bc::c9'],      // Pompey and the end of the Seleucid state
  ['roman-parthian-world-63bc-224ad::p2', 'parthia-148bc-224::p3'],      // Orodes II — Carrhae and the wars with Rome begin
  ['roman-parthian-world-63bc-224ad::p2', 'mesopotamia-141bc-224::k3'],      // Orodes II
  ['roman-parthian-world-63bc-224ad::p3', 'parthia-148bc-224::x1'],      // the return of the Roman standards
  ['roman-parthian-world-63bc-224ad::p4', 'parthia-148bc-224::p4'],      // Phraates IV to Vologases I — the long stand-off
  ['roman-parthian-world-63bc-224ad::p4', 'parthia-148bc-224::b1'],      // Vologases I and the gathering of the Avesta
  ['roman-parthian-world-63bc-224ad::p5', 'parthia-148bc-224::p5'],      // Osroes I and the Trajanic war
  ['roman-parthian-world-63bc-224ad::p5', 'roman-anatolia-133bc-330::p8'],      // Trajan, Hadrian and the Antonines
  ['roman-parthian-world-63bc-224ad::p6', 'parthia-148bc-224::p6'],      // Vologases IV to Artabanus IV — the sacks and the fall
  ['roman-parthian-world-63bc-224ad::c1', 'parthia-148bc-224::c2'],      // the battle of Carrhae
  ['roman-parthian-world-63bc-224ad::c1', 'mesopotamia-141bc-224::c1'],      // Carrhae — the destruction of Crassus
  ['roman-parthian-world-63bc-224ad::c2', 'parthia-148bc-224::c3'],      // Mark Antony’s Median campaign
  ['roman-parthian-world-63bc-224ad::c2', 'mesopotamia-141bc-224::c2'],      // the Parthian thrust into Syria and the recoil
  ['roman-parthian-world-63bc-224ad::c2', 'roman-anatolia-133bc-330::c7'],      // the Parthian invasion of Anatolia
  ['roman-parthian-world-63bc-224ad::c2', 'herod-judea-63bc-135ce::p3'],      // the Parthian invasion and Herod’s flight
  ['roman-parthian-world-63bc-224ad::c3', 'roman-anatolia-133bc-330::c9'],      // Corbulo and the Armenian war
  ['roman-parthian-world-63bc-224ad::c4', 'herod-judea-63bc-135ce::p7'],      // the Great Revolt’s outbreak
  ['roman-parthian-world-63bc-224ad::c4', 'herod-judea-63bc-135ce::p8'],      // Vespasian and Titus’s reconquest
  ['roman-parthian-world-63bc-224ad::c4', 'herod-judea-63bc-135ce::c4'],      // Masada’s fall
  ['roman-parthian-world-63bc-224ad::c5', 'parthia-148bc-224::c4'],      // Trajan’s conquest and withdrawal
  ['roman-parthian-world-63bc-224ad::c5', 'mesopotamia-141bc-224::c4'],      // Trajan takes Ctesiphon
  ['roman-parthian-world-63bc-224ad::c6', 'herod-judea-63bc-135ce::p9'],      // Bar Kokhba’s brief kingdom
  ['roman-parthian-world-63bc-224ad::c6', 'herod-judea-63bc-135ce::c5'],      // the Bar Kokhba revolt crushed
  ['roman-parthian-world-63bc-224ad::c7', 'mesopotamia-141bc-224::c5'],      // the burning of Seleucia in the war of Verus
  ['roman-parthian-world-63bc-224ad::c8', 'mesopotamia-141bc-224::c6'],      // the Severan sacks and the Sasanian revolt
  ['roman-parthian-world-63bc-224ad::c10', 'parthia-148bc-224::c6'],      // Ardashir’s rebellion and the battle of Hormozdgan
  ['roman-parthian-world-63bc-224ad::o2', 'parthia-148bc-224::o1'],      // the satrapal-feudal system
  ['roman-parthian-world-63bc-224ad::b1', 'parthia-148bc-224::b4'],      // fire-altar continuity in Persis
  ['roman-parthian-world-63bc-224ad::b2', 'parthia-148bc-224::b3'],      // the emergence of the exilarchate
  ['roman-parthian-world-63bc-224ad::b2', 'mesopotamia-141bc-224::b2'],      // the exilarch and the first Babylonian rabbis
  ['roman-parthian-world-63bc-224ad::b3', 'mesopotamia-141bc-224::b3'],      // the first churches at Edessa and Adiabene
  ['roman-parthian-world-63bc-224ad::e1', 'parthia-148bc-224::e1'],      // the ivory rhytons of Nisa
  ['roman-parthian-world-63bc-224ad::e2', 'palmyrene-100bc-273ce::a1'],      // Palmyrene tower tombs
  ['roman-parthian-world-63bc-224ad::e2', 'palmyrene-100bc-273ce::a2'],      // Palmyrene funerary busts
  ['roman-parthian-world-63bc-224ad::ec1', 'parthia-148bc-224::ec1'],      // the middleman profits of the overland silk trade
  ['roman-parthian-world-63bc-224ad::ec1', 'mesopotamia-141bc-224::e2'],      // Parthia the Silk Road middleman
  ['roman-parthian-world-63bc-224ad::ec2', 'palmyrene-100bc-273ce::o1'],      // the Palmyrene Tariff inscription
  ['roman-parthian-world-63bc-224ad::ec2', 'palmyrene-100bc-273ce::s1'],      // Palmyra as the key node of the Silk Road
  ['roman-parthian-world-63bc-224ad::p9', 'palmyrene-100bc-273ce::k1'],      // Palmyra as autonomous caravan city
  ['roman-parthian-world-63bc-224ad::p10', 'mesopotamia-141bc-224::k8'],      // Hatra, Edessa and Adiabene — the buffer principalities
  ['roman-parthian-world-63bc-224ad::p11', 'mesopotamia-141bc-224::k7'],      // Characene at the head of the Gulf
  ['roman-parthian-world-63bc-224ad::l1', 'parthia-148bc-224::l1'],      // Queen Musa — from slave to co-ruler
  ['roman-parthian-world-63bc-224ad::te1', 'parthia-148bc-224::tc1'],      // the Parthian shot
  ['roman-parthian-world-63bc-224ad::x1', 'parthia-148bc-224::x2'],      // Gan Ying’s aborted mission to Rome
  ['roman-parthian-world-63bc-224ad::t1', 'parthia-148bc-224::t1'],      // Isidore of Charax’s Parthian stations
  ['roman-parthian-world-63bc-224ad::t2', 'herod-judea-63bc-135ce::t1'],      // Josephus, soldier turned historian
  ['roman-parthian-world-63bc-224ad::t2', 'parthia-148bc-224::t3'],      // Josephus on the Parthian Jewish community
  ['roman-parthian-world-63bc-224ad::p8', 'herod-judea-63bc-135ce::p4'],      // Herod, King of the Jews
  ['roman-parthian-world-63bc-224ad::w1', 'mesopotamia-141bc-224::xc1'],      // the land between Rome and Parthia
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
