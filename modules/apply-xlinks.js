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
