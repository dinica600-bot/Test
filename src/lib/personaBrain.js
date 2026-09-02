/**
 * "Mintea" personajelor — cum decid ce sa raspunda la un mesaj real.
 *
 * Nu foloseste AI si nu costa nimic: recunoaste eroi din baza de date si
 * cuvinte-cheie, apoi alege personajul potrivit si un raspuns care chiar
 * are sens. Cand mesajul mentioneaza un erou, raspunsul e construit din
 * datele reale (counter-e, itemi, lane), nu inventat.
 */
import { HEROES, findHero, counteredBy, BUILD_TEMPLATES } from '../data/heroes.js';

/** Cine raspunde, in functie de rolul eroului discutat. */
const EXPERT = {
  Tank: 'bogdan', Support: 'bogdan', Fighter: 'razvan',
  Assassin: 'razvan', Mage: 'ale', Marksman: 'denisa',
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const QUESTION_WORDS = /\b(ce|cine|cum|care|cand|când|unde|de ce|cat|cât|oare)\b/i;

export function isQuestion(text) {
  return text.includes('?') || QUESTION_WORDS.test(text);
}

/**
 * Gaseste un erou mentionat in mesaj.
 * Numele trebuie sa fie cuvant intreg — altfel "sunt" se potrivea cu eroul
 * "Sun". Numele lung castiga: "yi sun-shin" bate "sun".
 */
const HERO_PATTERNS = HEROES.map((hero) => {
  const escaped = hero.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const edges = ['(^|[^a-zăâîșț0-9])', '([^a-zăâîșț0-9]|$)'];
  return {
    hero,
    re: new RegExp(`${edges[0]}${escaped}${edges[1]}`, 'i'),
    exact: new RegExp(`${edges[0]}${escaped}${edges[1]}`), // cu majuscula, exact
  };
}).sort((a, b) => b.hero.name.length - a.hero.name.length);

/** Eroi al caror nume e si cuvant obisnuit in romana. */
const AMBIGUOUS = new Set(['Vale', 'Sun', 'Chip', 'Nana', 'Cici', 'Bane', 'Alice']);
const GAME_CONTEXT = /erou|hero|pick|ban\b|build|counter|lane|rank|meci|jucat|main|itemi|emblem|joc|contra|roam|jungl|tank|mage|marksman|assassin|fighter|support|mid\b|exp\b|gold/i;

function heroInText(text) {
  for (const { hero, re, exact } of HERO_PATTERNS) {
    if (!re.test(text)) continue;
    // pentru numele ambigue cerem fie majuscula, fie context de joc
    if (AMBIGUOUS.has(hero.name) && !exact.test(text) && !GAME_CONTEXT.test(text)) continue;
    return hero;
  }
  return null;
}

/** Raspuns despre un erou, construit din datele reale. */
function heroAnswer(hero, text) {
  const who = EXPERT[hero.role] ?? 'bogdan';
  const lower = text.toLowerCase();
  const build = BUILD_TEMPLATES[hero.role];

  // "ce iau contra X" / "cum bat X"
  if (/contra|impotriva|împotriva|counter|cum (il|îl|o) bat|cum bat/.test(lower)) {
    const counters = hero.counters?.slice(0, 3).join(', ');
    return {
      who,
      text: counters
        ? pick([
          `contra lui ${hero.name} merg bine ${counters}. si nu te lasa prins singur pe lane`,
          `${counters} il incurca cel mai tare. plus vision, ca jumatate din problema e ca nu vezi de unde vine`,
          `ia ${counters}. si daca tot moare cineva de la el, schimbati rotatiile, nu doar eroul`,
        ])
        : `pe ${hero.name} nu-l bati cu un erou anume, ci cu rotatii. nu-l lasa sa prinda 1v1-uri`,
    };
  }

  // "ce build la X" / "ce iau pe X"
  if (/build|itemi|iteme|ce (iau|construiesc|pun) pe|emblem/.test(lower)) {
    return {
      who,
      text: `pe ${hero.name} incepe cu ${build.items.slice(0, 3).join(' → ')}. emblema: ${build.emblem.split('—')[0].trim()}`,
    };
  }

  // "cum se joaca X"
  if (/cum se (joaca|joacă)|cum (il|îl|o) joc|cum joci/.test(lower)) {
    return { who, text: `${hero.name}: ${build.tip}` };
  }

  // "e bun X?" / "merita X"
  if (/e bun|merita|merită|cum e|bagi/.test(lower)) {
    return {
      who,
      text: pick([
        `${hero.name} e ${hero.diff.toLowerCase()} de jucat. bun pe ${hero.lanes.join('/')}, dar ai grija la ${hero.counters?.[0] ?? 'CC'}`,
        `da, ${hero.name} merge in patch-ul asta. doar nu da pick cand au ${hero.counters?.[0] ?? 'tank cu CC'} in echipa`,
      ]),
    };
  }

  // mentiune generala
  return {
    who,
    text: pick([
      `${hero.name} e ${hero.role.toLowerCase()}, se joaca pe ${hero.lanes.join('/')}. dificultate ${hero.diff.toLowerCase()}`,
      `${hero.name} da bine, dar are probleme cu ${hero.counters?.[0] ?? 'CC-ul'}`,
      `apropo de ${hero.name}, /hero ${hero.name} iti da tot ce trebuie`,
    ]),
  };
}


/**
 * Dictionar de termeni — cel mai mare blocaj pentru cine e nou in MLBB
 * nu sunt eroii, ci jargonul. "ce inseamna gank?" primeste raspuns real.
 */
export const GLOSSARY = {
  gank: 'un atac surpriza pe un lane, de obicei al jungler-ului. vine din tufe si te prinde cand ai viata putina',
  'split push': 'sa impingi singur un lane departe de echipa, ca sa-i tragi pe ei acolo si sa-ti lasi coechipierii sa ia obiective',
  rotatie: 'mutarea de pe un lane pe altul ca sa ajuti. rotatiile bune castiga meciuri mai mult decat mecanica',
  farm: 'omorarea minionilor si a monstrilor din jungla ca sa faci aur si experienta',
  feed: 'cand mori des si ii faci pe adversari mai puternici. "nu da feed" = nu muri degeaba',
  tilt: 'cand te enervezi si incepi sa joci prost din nervi. cel mai bun lucru: pauza 10 minute',
  meta: 'eroii si strategiile care merg cel mai bine in patch-ul curent',
  buff: 'cand un erou primeste imbunatatiri la update. si monstrii albastri/rosii din jungla se numesc tot buff',
  nerf: 'cand un erou e slabit la update',
  cc: 'crowd control — abilitati care te opresc: stun, knock-up, suppress, slow. cine are CC incepe fight-ul',
  burst: 'damage foarte mare intr-o secunda. assassinii si unii mage au burst',
  poke: 'lovituri de la distanta care rod viata inamicului inainte de fight',
  kite: 'sa lovesti si sa te retragi in acelasi timp, ca sa nu te prinda. esential pentru marksman',
  carry: 'eroul care duce meciul in spate, de obicei marksman-ul sau jungler-ul',
  minion: 'soldatii care ies automat pe lane-uri',
  turela: 'turnul care apara baza. sub ea esti in siguranta, dar nu la infinit',
  lord: 'monstrul mare de jos, de la minutul 8. cine il ia primeste un minion urias care impinge lane-ul',
  turtle: 'monstrul de sus, apare de la minutul 2. da aur si experienta la toata echipa',
  emblema: 'setul de bonusuri pe care il alegi inainte de meci. da statistici in plus si un talent special',
  'battle spell': 'abilitatea suplimentara aleasa inainte de meci: flicker, retribution, purify etc.',
  retribution: 'spell-ul obligatoriu pentru jungler — loveste monstrii mai tare si iti da aur',
  flicker: 'teleportare scurta. cel mai folosit spell din joc, si pentru scapat si pentru prins',
  savage: 'cand omori toti cei 5 adversari singur, la rand',
  maniac: 'cand omori 4 adversari la rand',
  mvp: 'cel mai bun jucator al meciului, dupa scorul jocului',
  winrate: 'procentul de meciuri castigate. "wr" pe scurt',
  draft: 'faza de ban si pick de la inceputul meciului, in ranked de la epic in sus',
  'gold lane': 'lane-ul de jos, unde sta marksman-ul. e "gold" pentru ca primeste cel mai mult aur',
  'exp lane': 'lane-ul de sus, unde sta un fighter care rezista singur',
  roam: 'rolul care nu sta pe un lane, ci se plimba si ajuta. de obicei tank sau support',
  jungle: 'zona dintre lane-uri, cu monstri. jungler-ul face farm acolo si da gank',
};

const GLOSSARY_KEYS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

/** Cauta un termen de dictionar in mesaj. */
function glossaryInText(text) {
  const lower = text.toLowerCase();
  return GLOSSARY_KEYS.find((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-zăâîșț])${escaped}([^a-zăâîșț]|$)`, 'i').test(lower);
  }) ?? null;
}

/** Reguli pe cuvinte-cheie, pentru ce nu tine de un erou anume. */
const RULES = [
  {
    test: /\b(salut|buna|bună|hey|hello|sal|servus|noroc)\b/i,
    who: ['cristi', 'ionut', 'ale'],
    replies: ['salut 👋', 'hey', 'salut, ce faci?', 'sal, esti de rank?'],
  },
  {
    test: /anti[- ]?heal|sea halberd|necklace|regenerare/i,
    who: ['bogdan'],
    replies: [
      'sea halberd pentru fizic, necklace of durance pentru magic. si cumpara-l devreme, nu ultimul item',
      'daca au esmeralda sau uranus, anti-heal-ul e obligatoriu de la al doilea item',
    ],
  },
  {
    test: /scrim|antrenament|meci|oficial/i,
    who: ['razvan', 'bogdan'],
    replies: [
      'daca facem scrim, dati /scrim creeaza si va inscrieti la line-up',
      'eu sunt liber diseara pentru scrim, cine mai vine?',
      'inainte de scrim stabiliti draftul, nu improvizati in room',
    ],
  },
  {
    test: /\brank(ez|ed|ul)?\b|mythic|glory|epic|legend|immortal|urcat|urc\b/i,
    who: ['denisa', 'razvan', 'ionut'],
    replies: [
      'la rank conteaza consistenta, nu winrate-ul de pe un erou. joaca 2-3 eroi si atat',
      'bafta la grind 💪',
      'eu am urcat cel mai mult cand am jucat cu party, nu solo q',
    ],
  },
  {
    test: /plictis|nu am ce|ce fac(em|eti)?\b/i,
    who: ['cristi', 'ale'],
    replies: [
      'intra in voice, poate se strange o echipa',
      'da /comp si joaca ce iti iese, e mai amuzant asa',
      'un classic? nu vreau rank acum',
    ],
  },
  {
    test: /\b(jungl|jungler|retribution)\w*/i,
    who: ['razvan'],
    replies: [
      'jungler-ul bun nu e cel cu cele mai multe kill-uri, ci cel care ia obiectivele',
      'invata unde sunt buff-urile lor, nu doar ale tale',
    ],
  },
  {
    test: /\bnoob|sunt slab|nu stiu sa joc|incepator|începător\b/i,
    who: ['bogdan', 'ionut'],
    replies: [
      'toti am fost acolo. alege un erou si joaca-l 50 de meciuri, o sa vezi diferenta',
      'si eu am inceput acum ceva timp, intreaba fara grija aici',
    ],
  },
  {
    test: /\bmulțumesc|multumesc|mersi|thanks|ms\b/i,
    who: ['bogdan', 'ale', 'razvan'],
    replies: ['cu placere', 'n-ai pentru ce 👍', 'oricand'],
  },
];

/** Intrebari pe care le pun ele, cand vor sa porneasca o discutie. */
export const CURIOSITY = [
  { who: 'ionut', text: 'voi ce main aveti? incerc sa ma decid si nu pot' },
  { who: 'ale', text: 'care e cel mai enervant erou din patch-ul asta, dupa voi?' },
  { who: 'razvan', text: 'cine e liber diseara? facem o echipa' },
  { who: 'denisa', text: 'ce rank aveti acum? sa stiu cu cine pot juca' },
  { who: 'cristi', text: 'daca ar fi sa banati un singur erou pe viata, care ar fi?' },
  { who: 'bogdan', text: 'ce lane vi se pare cel mai greu de jucat si de ce?' },
  { who: 'ale', text: 'preferati draft cu 2 tank sau cu 2 damage in plus?' },
  { who: 'ionut', text: 'cat jucati pe zi? eu cred ca exagerez putin 😅' },
];

/**
 * Ce raspunde cineva la mesajul primit. Returneaza null daca personajele
 * n-au ce sa spuna — mai bine tac decat sa raspunda aiurea.
 */
export function answerFor(content, { always = false } = {}) {
  const text = content.replace(/<@!?\d+>/g, '').trim();
  if (text.length < 3) {
    return always ? { who: 'bogdan', text: 'zi, ce vrei sa stii? scrie numele unui erou sau un termen din joc' } : null;
  }

  const hero = heroInText(text);
  if (hero) return heroAnswer(hero, text);

  const term = glossaryInText(text);
  if (term) {
    return {
      who: pick(['bogdan', 'ale', 'razvan']),
      text: `**${term}** = ${GLOSSARY[term]}`,
    };
  }

  for (const rule of RULES) {
    if (rule.test.test(text)) return { who: pick(rule.who), text: pick(rule.replies) };
  }

  // intrebare generala, fara subiect recunoscut
  if (isQuestion(text) || always) {
    return {
      who: pick(['bogdan', 'razvan', 'ale']),
      text: pick([
        'nu sunt sigur ca am inteles. incearca asa: "ce iau contra fanny?", "ce build la lancelot?", "ce inseamna gank?"',
        'da-mi un nume de erou sau un termen din joc si iti zic tot ce stiu',
        'depinde mult de draft si de ce joaca ei. da mai multe detalii',
        'pentru detalii complete despre un erou ai si comanda `/hero <nume>`',
      ]),
    };
  }

  return null;
}

/** Dupa un raspuns, uneori mai pun si ele o intrebare. */
export function maybeFollowUp(who) {
  if (Math.random() > 0.22) return null;
  const options = CURIOSITY.filter((q) => q.who !== who);
  return pick(options);
}

export { counteredBy };
