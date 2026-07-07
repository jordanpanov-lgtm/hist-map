// ── FOLIO MATRIX — THREE-TIER TAXONOMY ───────────────────────────────────────
// Tier 1: Region        e.g. "Near East"
// Tier 2: Sub-region    e.g. "West Asia"
// Tier 3: Zone          e.g. "Turkey"
//
// Folio placement rules:
//   - Single zone entity   → zone ID       e.g. region:"Turkey"
//   - Spans a sub-region   → sub-region ID e.g. region:"West Asia"
//   - Spans a full region  → region ID     e.g. region:"Near East"
//   - Cross-regional       → core region ID (Roman Empire → "Europe")

const TAXONOMY = [
  { id:'Europe', label:'Europe', subs:[
    { id:'South Europe', label:'South Europe', zones:[
      { id:'Iberia',        label:'Iberia',        detail:'Spain · Portugal' },
      { id:'Mediterranean', label:'Mediterranean', detail:'Italy · Greece · Malta · Cyprus' },
    ]},
    { id:'West Europe', label:'West Europe', zones:[
      { id:'Britain',      label:'Britain',      detail:'England · Scotland · Wales · Ireland' },
      { id:'France',       label:'France',       detail:'France · Monaco' },
      { id:'Low Countries',label:'Low Countries',detail:'Belgium · Netherlands · Luxembourg' },
      { id:'Germany',      label:'Germany',      detail:'Germany · Austria · Switzerland' },
    ]},
    { id:'Central Europe', label:'Central Europe', zones:[
      { id:'Poland',       label:'Poland',       detail:'Poland' },
      { id:'Bohemia',      label:'Bohemia',      detail:'Czechia · Slovakia' },
      { id:'Pannonia',     label:'Pannonia',     detail:'Hungary · Slovenia · Croatia' },
    ]},
    { id:'North Europe', label:'North Europe', zones:[
      { id:'Scandinavia',  label:'Scandinavia',  detail:'Denmark · Sweden · Norway' },
      { id:'Finland',      label:'Finland',      detail:'Finland · Estonia' },
      { id:'Iceland',      label:'Iceland',      detail:'Iceland' },
      { id:'Baltic States',label:'Baltic States',detail:'Latvia · Lithuania' },
    ]},
    { id:'East Europe', label:'East Europe', zones:[
      { id:'Russia West',  label:'Russia (W)',   detail:'European Russia' },
      { id:'Ukraine',      label:'Ukraine',      detail:'Ukraine · Belarus · Moldova' },
      { id:'Romania',      label:'Romania',      detail:'Romania · Bulgaria' },
      { id:'West Balkans', label:'W. Balkans',   detail:'Serbia · Croatia · Bosnia · Albania · N. Macedonia · Montenegro' },
    ]},
  ]},
  { id:'Near East', label:'Near East', subs:[
    { id:'West Asia', label:'West Asia', zones:[
      { id:'Turkey',   label:'Turkey',   detail:'Anatolia · Thrace' },
      { id:'Caucasus', label:'Caucasus', detail:'Armenia · Georgia · Azerbaijan' },
      { id:'Levant',   label:'Levant',   detail:'Syria · Lebanon · Palestine · Jordan · Israel' },
      { id:'Egypt',    label:'Egypt',    detail:'Nile Valley · Sinai · Delta' },
      { id:'Arabia',   label:'Arabia',   detail:'Arabian Peninsula · Hejaz · Yemen · Oman · Gulf' },
      { id:'Iraq',     label:'Iraq',     detail:'Mesopotamia · Tigris-Euphrates basin' },
      { id:'Iran',     label:'Iran',     detail:'Persia · Fars · Khorasan · Zagros' },
    ]},
  ]},
  { id:'Far East', label:'Far East', subs:[
    { id:'North Asia', label:'North Asia', zones:[
      { id:'Siberia',  label:'Siberia',   detail:'Siberia · Russian Far East' },
    ]},
    { id:'Central Asia', label:'Central Asia', zones:[
      { id:'Steppe',   label:'Steppe',    detail:'Kazakhstan · Kyrgyzstan · Mongolia (steppe)' },
      { id:'Oxus',     label:'Oxus',      detail:'Uzbekistan · Tajikistan · Turkmenistan · Afghanistan' },
    ]},
    { id:'East Asia', label:'East Asia', zones:[
      { id:'China',    label:'China',     detail:'China · Tibet · Xinjiang' },
      { id:'Mongolia', label:'Mongolia',  detail:'Mongolia' },
      { id:'Korea',    label:'Korea',     detail:'Korean Peninsula' },
      { id:'Japan',    label:'Japan',     detail:'Japanese Archipelago' },
    ]},
    { id:'South Asia', label:'South Asia', zones:[
      { id:'North India', label:'N. India',  detail:'North India · Pakistan' },
      { id:'Himalaya',    label:'Himalaya',  detail:'Nepal · Bhutan · Tibet' },
      { id:'Deccan',      label:'Deccan',    detail:'Central India' },
      { id:'South India', label:'S. India',  detail:'South India · Sri Lanka' },
    ]},
    { id:'South East Asia', label:'SE Asia', zones:[
      { id:'Mainland SEA', label:'Mainland', detail:'Vietnam · Cambodia · Laos · Thailand · Myanmar' },
      { id:'Maritime SEA', label:'Maritime', detail:'Malaysia · Indonesia · Philippines' },
    ]},
  ]},
  { id:'Africa', label:'Africa', subs:[
    { id:'North Africa', label:'North Africa', zones:[
      { id:'Maghreb',    label:'Maghreb',    detail:'Morocco · Algeria · Tunisia · Libya' },
      { id:'Nile Sudan', label:'Nile/Sudan', detail:'Egypt (historical) · Sudan · Ethiopia' },
    ]},
    { id:'West Africa', label:'West Africa', zones:[
      { id:'Sahel',      label:'Sahel',      detail:'Mali · Niger · Chad · Mauritania' },
      { id:'Gulf Guinea',label:'Gulf Guinea',detail:'Nigeria · Ghana · Senegal · Ivory Coast · Benin' },
    ]},
    { id:'East Africa', label:'East Africa', zones:[
      { id:'Horn',       label:'Horn',       detail:'Ethiopia · Somalia · Eritrea · Djibouti' },
      { id:'Great Lakes',label:'Great Lakes',detail:'Kenya · Tanzania · Uganda · Rwanda · Burundi' },
    ]},
    { id:'Central Africa', label:'Central Africa', zones:[
      { id:'Congo Basin',label:'Congo Basin',detail:'DRC · Congo · Cameroon · Gabon · CAR' },
    ]},
    { id:'South Africa', label:'South Africa', zones:[
      { id:'Southern Africa',label:'S. Africa',detail:'South Africa · Zimbabwe · Mozambique · Zambia · Namibia · Botswana' },
      { id:'Madagascar',     label:'Madagascar',detail:'Madagascar · Comoros · Réunion' },
    ]},
  ]},
  { id:'Americas', label:'Americas', subs:[
    { id:'North America', label:'North America', zones:[
      { id:'Canada',         label:'Canada',         detail:'Canada' },
      { id:'United States',  label:'United States',  detail:'United States' },
      { id:'Mexico',         label:'Mexico',         detail:'Mexico' },
    ]},
    { id:'Central America', label:'Central America', zones:[
      { id:'Mesoamerica',    label:'Mesoamerica',    detail:'Guatemala · Belize · Honduras · El Salvador · Nicaragua · Costa Rica · Panama' },
      { id:'Caribbean',      label:'Caribbean',      detail:'Cuba · Haiti · Dominican Republic · Jamaica · Puerto Rico' },
    ]},
    { id:'South America', label:'South America', zones:[
      { id:'Andes',          label:'Andes',          detail:'Peru · Bolivia · Ecuador · Chile · Colombia · Venezuela' },
      { id:'Brazil',         label:'Brazil',         detail:'Brazil' },
      { id:'Southern Cone',  label:'S. Cone',        detail:'Argentina · Uruguay · Paraguay' },
    ]},
  ]},
  { id:'Oceania', label:'Oceania', subs:[
    { id:'Australia & NZ', label:'Australia & NZ', zones:[
      { id:'Australia',    label:'Australia',    detail:'Australian continent' },
      { id:'New Zealand',  label:'New Zealand',  detail:'New Zealand' },
    ]},
    { id:'Pacific', label:'Pacific Islands', zones:[
      { id:'Melanesia',    label:'Melanesia',    detail:'Papua New Guinea · Fiji · Solomon Islands · Vanuatu' },
      { id:'Polynesia',    label:'Polynesia',    detail:'Samoa · Tonga · Hawaii · Easter Island · French Polynesia' },
      { id:'Micronesia',   label:'Micronesia',   detail:'Guam · Palau · Marshall Islands · Federated States of Micronesia' },
    ]},
  ]},
];

const PERIODS = [
  { id:'Prehistoric',  label:'Prehistoric',  sub:'till 1200 BC'  },
  { id:'Ancient',      label:'Ancient',       sub:'1200–300 BC'   },
  { id:'Late Antique', label:'Late Antique',  sub:'300 BC–600 AD' },
  { id:'Medieval',     label:'Medieval',      sub:'600–1500 AD'   },
  { id:'Early Modern', label:'Early Modern',  sub:'1500–1900'     },
  { id:'Modern',       label:'Modern',        sub:'1900–today'    },
];
