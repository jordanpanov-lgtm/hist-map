// ── ATLAS BRANDING ────────────────────────────────────────────────────────────
const ATLAS_NAME = "Area Studies Atlas";

// ── MODULE REGISTRY ───────────────────────────────────────────────────────────
const MODULES = [
  // ── EUROPE ─────────────────────────────────────────────────────────────────
  { id:"hispania-300bc-27bc",    file:"modules/hispania-300bc-27bc.json",    label:"Hispania 300–27 BC",           sub:"Punic Wars, Conquest & Resistance",              region:"Iberia",  period:"Late Antique"  },
  { id:"hispania-27bc-409ad",   file:"modules/hispania-27bc-409ad.json",   label:"Roman Hispania 27 BC–409 AD",  sub:"Emperors, Philosophers & Christianisation",      region:"Iberia",  period:"Late Antique"  },
  { id:"visigoths-589-711",     file:"modules/visigoths-589-711.json",     label:"Visigothic Spain 589–711",     sub:"The Kingdom of Toledo",                          region:"Iberia",  period:"Medieval"      },
  { id:"al-andalus-711-1031",   file:"modules/al-andalus-711-1031.json",   label:"Al-Andalus 711–1031",          sub:"Emirate to Caliphate of Córdoba",                region:"Iberia",  period:"Medieval"      },
  { id:"spain-718-1230",        file:"modules/spain-718-1230.json",        label:"Christian Kingdoms 718–1230",  sub:"Asturias to Las Navas de Tolosa",                region:"Iberia",  period:"Medieval"      },
  { id:"al-andalus-1031-1492",  file:"modules/al-andalus-1031-1492.json",  label:"Al-Andalus 1031–1492",         sub:"Taifas, Berber Dynasties and Granada",           region:"Iberia",  period:"Medieval"      },
  { id:"spain-1230-1492",       file:"modules/spain-1230-1492.json",       label:"Castile & Aragon 1230–1492",   sub:"Union, Reconquest and the Catholic Monarchs",    region:"Iberia",  period:"Medieval"      },
  { id:"rome-200-300",          file:"modules/rome-200-300.json",          label:"Roman Empire 200–300",        sub:"Third Century Crisis",                        region:"Europe",  period:"Late Antique"  },
  { id:"rome-300-400",          file:"modules/rome-300-400.json",          label:"Roman Empire 300–400",        sub:"Constantine to Theodosius",                   region:"Europe",  period:"Late Antique"  },
  { id:"rome-400-500",          file:"modules/rome-400-500.json",          label:"Roman Empire 400–500",        sub:"Fall of the West",                            region:"Europe",  period:"Late Antique"  },
  { id:"france-1494-1610",      file:"modules/france-1494-1610.json",      label:"Kingdom of France 1494–1610", sub:"Renaissance, Reformation & Wars of Religion",   region:"France",  period:"Early Modern"  },
  { id:"france-1610-1715",      file:"modules/france-1610-1715.json",      label:"Bourbon France 1610–1715",    sub:"Richelieu, Louis XIV & Versailles",              region:"France",  period:"Early Modern"  },
  { id:"france-1715-1789",      file:"modules/france-1715-1789.json",      label:"France 1715–1789",            sub:"Enlightenment & Ancien Régime",                  region:"France",  period:"Early Modern"  },
  { id:"france-1789-1815",      file:"modules/france-1789-1815.json",      label:"France 1789–1815",            sub:"Revolution & Empire",                            region:"France",  period:"Early Modern"  },
  { id:"france-1815-1900",      file:"modules/france-1815-1900.json",      label:"France 1815–1900",            sub:"Restoration to the Third Republic",              region:"France",  period:"Early Modern"  },
  { id:"spain-1516-1700",       file:"modules/spain-1516-1700.json",       label:"Habsburg Spain 1516–1700",    sub:"The First Global Empire",                     region:"Iberia",  period:"Early Modern"  },
  { id:"spain-1700-1808",       file:"modules/spain-1700-1808.json",       label:"Bourbon Spain 1700–1808",     sub:"Enlightenment & Reform",                      region:"Iberia",  period:"Early Modern"  },
  { id:"spain-1808-1900",       file:"modules/spain-1808-1900.json",       label:"Spain 1808–1900",             sub:"Peninsular War & the Long Crisis",             region:"Iberia",  period:"Early Modern"  },
  { id:"spain-1900-1975",       file:"modules/spain-1900-1975.json",       label:"Spain 1900–1975",             sub:"Republic, Civil War & Dictatorship",           region:"Iberia",  period:"Modern"        },
  { id:"spain-1975-today",      file:"modules/spain-1975-today.json",      label:"Spain 1975–today",            sub:"Transition & Democracy",                      region:"Iberia",  period:"Modern"        },
  // ── NEAR EAST ──────────────────────────────────────────────────────────────
  { id:"egypt-6000bc-3000bc",   file:"modules/egypt-6000bc-3000bc.json",   label:"Predynastic Egypt 6000–3000 BC", sub:"Neolithic Nile, Naqada Cultures and the Rise of Kingship", region:"Egypt", period:"Prehistoric" },
  { id:"egypt-3000bc-2100bc",   file:"modules/egypt-3000bc-2100bc.json",   label:"Ancient Egypt 3000–2100 BC",  sub:"Unification, Pyramids and the First Collapse",region:"Egypt",   period:"Prehistoric"   },
  { id:"egypt-2100bc-1550bc",   file:"modules/egypt-2100bc-1550bc.json",   label:"Middle Kingdom and the Hyksos 2100–1550 BC", sub:"Reunification, the Classic State, and the Foreign Kings of the Delta", region:"Egypt", period:"Prehistoric" },
  { id:"egypt-1550bc-1200bc",   file:"modules/egypt-1550bc-1200bc.json",   label:"The New Kingdom 1550–1200 BC", sub:"Empire, the Amarna Rupture and the Ramesside Recovery", region:"Egypt", period:"Prehistoric" },
  { id:"nabataean-312bc-106ce", file:"modules/nabataean-312bc-106ce.json", label:"Nabataean Kingdom 312BC–106", sub:"The Incense Kingdom of Petra",                region:"NW Arabia",  period:"Late Antique"  },
  // placed here — after Nabataea — because it is the Roman-province aftermath of it;
  //   its Medieval sibling nw-arabia-632-1517 sits in the Northwest-oases block below.
  { id:"nw-arabia-106-632", file:"modules/nw-arabia-106-632.json", label:"Rome and the Oases 106–632", sub:"The Roman Frontier, the Tribal and Jewish Oases, and the Conquest of the North", region:"NW Arabia", period:"Late Antique" },
  { id:"palmyrene-100bc-273ce", file:"modules/palmyrene-100bc-273ce.json", label:"Palmyrene Empire 100BC–273",  sub:"Caravan City to Queen of the East",           region:"Levant",  period:"Late Antique"  },
  { id:"ghassanid-420-638",     file:"modules/ghassanid-420-638.json",     label:"Ghassanid Kingdom 420–638",   sub:"The Jafnid Kings of the Syrian Steppe",       region:"Levant",  period:"Late Antique"  },
  { id:"lakhmid-268-602",       file:"modules/lakhmid-268-602.json",       label:"Lakhmid Kingdom 268–638",     sub:"The Nasrid Kings of al-Hira",                 region:"Iraq",    period:"Late Antique"  },
  { id:"sassanid-224-484",      file:"modules/sassanid-224-484.json",      label:"Sassanid Empire 224–484",     sub:"Foundation to Hephthalite Crisis",            region:"Iran",    period:"Late Antique"  },
  { id:"sassanid-484-651",      file:"modules/sassanid-484-651.json",      label:"Sassanid Empire 484–651",     sub:"Renewal, Apogee & Collapse",                  region:"Iran",    period:"Late Antique"  },
  // ── THE CALIPHATE (imperial backbone — Near East, cross-regional) ───────────
  { id:"caliphate-632-750",     file:"modules/caliphate-632-750.json",     label:"The Caliphate 632–750",       sub:"Conquest, the Fitnas and the Umayyad State",  region:"Near East", period:"Medieval" },
  { id:"caliphate-750-945",     file:"modules/caliphate-750-945.json",     label:"The Abbasid Caliphate 750–945", sub:"Baghdad, the Translation Movement and the House of Islam", region:"Near East", period:"Medieval" },
  { id:"caliphate-945-1258",    file:"modules/caliphate-945-1258.json",    label:"The Abbasid Caliphate 945–1258", sub:"The Age of Sultans, the Sunni Revival and the Mongol Sack", region:"Near East", period:"Medieval" },
  { id:"fatimids-909-1171",     file:"modules/fatimids-909-1171.json",     label:"The Fatimid Caliphate 909–1171", sub:"The Ismaili Counter-Caliphate, Cairo and the Red Sea World", region:"Egypt", period:"Medieval" },
  { id:"ayyubids-1171-1250",    file:"modules/ayyubids-1171-1250.json",    label:"The Ayyubid Sultanate 1171–1250", sub:"Saladin's Confederation, the Sunnisation of Egypt and the Crusades", region:"Egypt", period:"Medieval" },
  { id:"mamluks-1250-1517",     file:"modules/mamluks-1250-1517.json",     label:"The Mamluk Sultanate 1250–1517", sub:"The Slave-Soldier Empire, the Mongol Wall and the Cairo of the Sultans", region:"Egypt", period:"Medieval" },
  // PLANNED — successor territorial empires: ottomans-* (region:"Near East"), and safavid-iran /
  //   mughals under their zones.
  // ── ARABIA is split into two zones (config/regions.js): "NW Arabia" (the Hejaz,
  //   Najd and the northwest oases — the overland caravan / Islamic-heartland
  //   bloc) and "SE Arabia" (the Gulf, Oman, Yemen and South Arabia — the
  //   maritime Indian-Ocean bloc). arabia-paleolithic (peninsula-wide) → NW.
  // ── PREHISTORIC INTERIOR ARABIA (Hejaz & Najd) ────────────────────────────────
  { id:"arabia-paleolithic-500000bc-8000bc", file:"modules/arabia-paleolithic-500000bc-8000bc.json", label:"Palaeolithic Arabia 500,000–8,000 BC", sub:"Green Corridors, Archaic Hominins and Homo Sapiens Out of Africa", region:"NW Arabia", period:"Prehistoric" },
  { id:"hejaz-prehistory-8000bc-1200bc", file:"modules/hejaz-prehistory-8000bc-1200bc.json", label:"Prehistoric Northwest Arabia 8,000–1,200 BC", sub:"Mustatils, the Funerary Avenues and the Walled Oases of Tayma and Khaybar", region:"NW Arabia", period:"Prehistoric" },
  // ── THE HEJAZ (Mecca, Medina, Ṭāʾif, the western coast — a distinct thread from
  //   the NW-Arabian oasis towns and from the central plateau) ────────────────────
  { id:"hejaz-300bc-632", file:"modules/hejaz-300bc-632.json", label:"Mecca, Yathrib and the Rise of Islam 300 BC–632 AD", sub:"Mecca, Yathrib, the Pre-Islamic Sanctuary and the Life of Muḥammad", region:"NW Arabia", period:"Late Antique" },
  { id:"hejaz-632-1517", file:"modules/hejaz-632-1517.json", label:"Medieval Hejaz 632–1517", sub:"The Caliphal Holy Cities, the Rise of the Sharifs and the Guardianship of the Ḥaramayn", region:"NW Arabia", period:"Medieval" },
  { id:"hejaz-1517-1900", file:"modules/hejaz-1517-1900.json", label:"Ottoman Hejaz 1517–1900", sub:"The Guardianship of the Ḥaramayn, the Wahhābī Interlude, the Steamship Hajj and the Northwest Oases", region:"NW Arabia", period:"Early Modern" },
  { id:"hejaz-1900-1925", file:"modules/hejaz-1900-1925.json", label:"Kingdom of the Hejaz 1900–1925", sub:"The Railway, the Arab Revolt, the Hashemite Kingdom and the Saudi Conquest", region:"NW Arabia", period:"Modern" },
  // ── THE NORTHWEST OASES (Taymāʾ, Dadān/al-ʿUlā, Khaybar, Dūmah — the western
  //   corridor; feeds into nabataean-312bc-106ce for the Nabataean period) ─────────
  { id:"dedan-tayma-1200bc-300bc", file:"modules/dedan-tayma-1200bc-300bc.json", label:"Taymāʾ, Dadān and Lihyān 1,200–300 BC", sub:"Taymāʾ, Nabonidus in Arabia, and the Kingdoms of Dadān and Lihyān", region:"NW Arabia", period:"Ancient" },
  // The north-Arabian desert kingdom (Wādī Sirḥān, Dūmat al-Jandal) — dated to its
  //   own span, not the period bucket, since the record is firm from Gindibu (853 BC).
  { id:"qedar-853bc-330bc", file:"modules/qedar-853bc-330bc.json", label:"Kingdom of Qedar 853–330 BC", sub:"Gindibu, the Five Arab Queens, Adummatu and the North Arabian Kingdom", region:"NW Arabia", period:"Ancient" },
  { id:"nw-arabia-632-1517", file:"modules/nw-arabia-632-1517.json", label:"Medieval Oasis Corridor 632–1517", sub:"A Corridor of the Hajj Roads — the Oases, the Tribes, and the Cities of Thamūd", region:"NW Arabia", period:"Medieval" },
  // ── SOUTH ARABIA (Yemen — the highland & Tihama thread; grouped with SE Arabia
  //   for its Indian-Ocean orientation) ──────────────────────────────────────────
  { id:"south-arabia-prehistory-8000bc-1200bc", file:"modules/south-arabia-prehistory-8000bc-1200bc.json", label:"Prehistoric South Arabia 8,000–1,200 BC", sub:"The Highland Neolithic, the Cattle Cult and the Roots of the Incense Kingdoms", region:"SE Arabia", period:"Prehistoric" },
  { id:"south-arabia-1200bc-300bc", file:"modules/south-arabia-1200bc-300bc.json", label:"Sabaʾ, Maʿīn and Qatabān 1,200–300 BC", sub:"The Mukarribs of Sabaʾ, Awsān and Ḥaḍramawt, and the Rise of the Incense Trade", region:"SE Arabia", period:"Ancient" },
  { id:"south-arabia-300bc-628", file:"modules/south-arabia-300bc-628.json", label:"Himyar 300 BC–628", sub:"The Unification of Yemen, the Sabaean Wars, the Turn to Monotheism, and the Coming of Aksum and Persia", region:"SE Arabia", period:"Late Antique" },
  { id:"yemen-628-1517", file:"modules/yemen-628-1517.json", label:"Medieval Yemen 628–1517", sub:"Islamisation, the Zaydi Imamate, Queen Arwa, the Rasulid Sultanate and the Coming of the Ottomans", region:"SE Arabia", period:"Medieval" },
  { id:"yemen-1517-1900", file:"modules/yemen-1517-1900.json", label:"Early Modern Yemen 1517–1900", sub:"The Ottoman Century, the Qasimid Imams, the Coffee Boom of Mocha and the British at Aden", region:"SE Arabia", period:"Early Modern" },
  { id:"yemen-1900-today", file:"modules/yemen-1900-today.json", label:"Yemen 1900–today", sub:"The Imamate, Two Republics, Unification and the War", region:"SE Arabia", period:"Modern" },
  // ── NAJD (the central plateau — the Yamama, the caravan cross-routes, the
  //   Wahhabi movement and the Saudi states). Its Ancient record is thin and belongs
  //   to the north (see qedar-853bc-330bc); the Najd thread proper begins at 300 BC.
  { id:"najd-300bc-632", file:"modules/najd-300bc-632.json", label:"Kindah, the Poets and the Ridda 300 BC–632 AD", sub:"Qaryat al-Faw, the Kindah Kingdoms, the Pre-Islamic Poets and the Ridda Wars", region:"NW Arabia", period:"Late Antique" },
  { id:"najd-632-1517", file:"modules/najd-632-1517.json", label:"Medieval Najd 632–1517", sub:"The Yamāma Province, the Ukhaydirid Emirate, the Bedouin Centuries and the Founding of the Oasis Towns", region:"NW Arabia", period:"Medieval" },
  { id:"najd-1517-1744", file:"modules/najd-1517-1744.json", label:"Najd on the Eve of the Reform 1517–1744", sub:"The Oasis-Town Emirates, Banū Khālid Overlordship and the Road to the Pact of Dirʿiyya", region:"NW Arabia", period:"Early Modern" },
  { id:"najd-1744-1900", file:"modules/najd-1744-1900.json", label:"Two Saudi Emirates 1744–1900", sub:"The First Saudi State, the Egyptian Destruction, the Second State and the Rise of the Āl Rashīd", region:"NW Arabia", period:"Early Modern" },
  { id:"saudi-1902-today", file:"modules/saudi-1902-today.json", label:"Saudi Arabia 1902–today", sub:"Ibn Saud's Conquest, the Oil State, the Turn of 1979 and the MBS Transformation", region:"NW Arabia", period:"Modern" },
  // ── THE GULF & OMAN (SE Arabia — the Gulf littoral folios + modern states) ──
  { id:"gulf-prehistory-8000bc-3000bc", file:"modules/gulf-prehistory-8000bc-3000bc.json", label:"Prehistoric Eastern Arabia 8000–3000 BC", sub:"Green Arabia, the Arabian Neolithic and the First Pearl Fishers", region:"SE Arabia", period:"Prehistoric" },
  { id:"magan-3000bc-1200bc",    file:"modules/magan-3000bc-1200bc.json",    label:"Magan 3000–1200 BC", sub:"Copper Land of the Bronze Age — Hafit, Umm an-Nar and Wadi Suq", region:"SE Arabia", period:"Prehistoric" },
  { id:"magan-1200bc-300bc",     file:"modules/magan-1200bc-300bc.json",     label:"Iron Age Magan & Maka 1200–300 BC", sub:"The Falaj Revolution, the Camel and the Persian Edge", region:"SE Arabia", period:"Ancient" },
  { id:"dilmun-3000bc-1200bc",   file:"modules/dilmun-3000bc-1200bc.json",   label:"Dilmun 3000–1200 BC",           sub:"The Bronze Age Entrepôt of the Gulf",             region:"SE Arabia", period:"Prehistoric" },
  { id:"dilmun-1200bc-600bc",    file:"modules/dilmun-1200bc-600bc.json",    label:"Late Dilmun 1200–600 BC",       sub:"The Tributary Kingdom in the Shadow of Assyria",  region:"SE Arabia", period:"Ancient" },
  { id:"tylos-mleiha-300bc-240ad", file:"modules/tylos-mleiha-300bc-240ad.json", label:"Hellenistic & Parthian Gulf 300 BC–240 AD", sub:"Tylos, Mleiha and Gerrha — Greek Coins and the India Route", region:"SE Arabia", period:"Late Antique" },
  { id:"beth-qatraye-240-632",   file:"modules/beth-qatraye-240-632.json",   label:"Sasanian Gulf 240–632", sub:"Sasanian Mazun and the Rise of the Church of Beth Qatraye", region:"SE Arabia", period:"Late Antique" },
  { id:"beth-qatraye-632-750",   file:"modules/beth-qatraye-632-750.json",   label:"Beth Qatraye and Islam 632–750", sub:"The Ridda, the Synod of Dayrin, the Syriac Writers and the Coming of Islam", region:"SE Arabia", period:"Medieval" },
  { id:"eastern-arabia-750-1200", file:"modules/eastern-arabia-750-1200.json", label:"Qarmatians 750–1200", sub:"The Ibadi Imamate, the Qarmatian State and the China Trade", region:"SE Arabia", period:"Medieval" },
  { id:"hormuz-1200-1507",       file:"modules/hormuz-1200-1507.json",       label:"Hormuz and the Jabrids 1200–1507", sub:"The Jewel of the Gulf, the Jabrid State and the Horse Trade", region:"SE Arabia", period:"Medieval" },
  { id:"portuguese-gulf-1507-1650", file:"modules/portuguese-gulf-1507-1650.json", label:"Portuguese Gulf 1507–1650", sub:"Albuquerque's Choke-Point, the Ottoman Challenge and the Ya'ruba Liberation", region:"SE Arabia", period:"Early Modern" },
  { id:"oman-gulf-1650-1820",    file:"modules/oman-gulf-1650-1820.json",    label:"Oman & the Gulf 1650–1820", sub:"The Omani Sea Empire and the Founding of the Gulf Dynasties", region:"SE Arabia", period:"Early Modern" },
  { id:"trucial-gulf-1820-1900", file:"modules/trucial-gulf-1820-1900.json", label:"Trucial States 1820–1900", sub:"The General Treaty, the Maritime Truce, the Making of the Shaykhdoms and the Age of Pearl", region:"SE Arabia", period:"Early Modern" },
  { id:"trucial-gulf-1900-1971", file:"modules/trucial-gulf-1900-1971.json", label:"Trucial States 1900–1971", sub:"The Pearl Crash, the Coming of Oil and the Retreat from East of Suez", region:"SE Arabia", period:"Modern" },
  { id:"uae-1971-today",         file:"modules/uae-1971-today.json",         label:"United Arab Emirates 1971–today", sub:"Federation, Oil Wealth and an Assertive Foreign Policy", region:"SE Arabia", period:"Modern" },
  { id:"oman-1970-today",        file:"modules/oman-1970-today.json",        label:"Oman 1970–today",              sub:"The Qaboos Renaissance, the Dhofar War and Armed Neutrality", region:"SE Arabia", period:"Modern" },
  { id:"kuwait-1961-today",      file:"modules/kuwait-1961-today.json",      label:"Kuwait 1961–today", sub:"Independence, the Gulf's Parliament, the Iraqi Invasion, and the Frozen Rentier State", region:"SE Arabia", period:"Modern" },
  { id:"bahrain-1971-today",     file:"modules/bahrain-1971-today.json",     label:"Bahrain 1971–today", sub:"A Shiʿi-Majority Island under the Āl Khalīfa, the 2011 Uprising, and a Repression Stabilised", region:"SE Arabia", period:"Modern" },
  { id:"qatar-1971-today",       file:"modules/qatar-1971-today.json",       label:"Qatar 1971–today", sub:"Gas, Al Jazeera, the Blockade, the World Cup and the Mediator's Chair", region:"SE Arabia", period:"Modern" },
  // To add a folio: { id, file, label:"[Name] [years]", sub:"[short description — no years]", region:"[zone id]", period:"[period id]" }
];
