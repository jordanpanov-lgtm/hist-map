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
  { id:"nabataean-400bc-106ce", file:"modules/nabataean-400bc-106ce.json", label:"Nabataean Kingdom 400BC–106", sub:"The Incense Kingdom of Petra",                region:"Arabia",  period:"Late Antique"  },
  { id:"palmyrene-100bc-273ce", file:"modules/palmyrene-100bc-273ce.json", label:"Palmyrene Empire 100BC–273",  sub:"Caravan City to Queen of the East",           region:"Levant",  period:"Late Antique"  },
  { id:"ghassanid-420-638",     file:"modules/ghassanid-420-638.json",     label:"Ghassanid Kingdom 420–638",   sub:"The Jafnid Kings of the Syrian Steppe",       region:"Levant",  period:"Late Antique"  },
  { id:"lakhmid-268-602",       file:"modules/lakhmid-268-602.json",       label:"Lakhmid Kingdom 268–638",     sub:"The Nasrid Kings of al-Hira",                 region:"Iraq",    period:"Late Antique"  },
  { id:"sassanid-224-484",      file:"modules/sassanid-224-484.json",      label:"Sassanid Empire 224–484",     sub:"Foundation to Hephthalite Crisis",            region:"Iran",    period:"Late Antique"  },
  { id:"sassanid-484-651",      file:"modules/sassanid-484-651.json",      label:"Sassanid Empire 484–651",     sub:"Renewal, Apogee & Collapse",                  region:"Iran",    period:"Late Antique"  },
  // To add a folio: { id, file, label:"[Name] [years]", sub:"[short description — no years]", region:"[zone id]", period:"[period id]" }
];
