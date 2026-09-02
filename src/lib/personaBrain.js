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
export function answerFor(content) {
  const text = content.trim();
  if (text.length < 3) return null;

  const hero = heroInText(text);
  if (hero) return heroAnswer(hero, text);

  for (const rule of RULES) {
    if (rule.test.test(text)) return { who: pick(rule.who), replies: null, text: pick(rule.replies) };
  }

  // intrebare generala, fara subiect recunoscut
  if (isQuestion(text)) {
    return {
      who: pick(['bogdan', 'razvan', 'ale']),
      text: pick([
        'depinde mult de draft si de ce joaca ei. da mai multe detalii',
        'buna intrebare. eu as zice sa incerci si sa vezi ce iese, in mlbb multe se invata din meciuri',
        'pai... ce eroi aveau in echipa? asta schimba raspunsul',
        'incearca /hero cu numele eroului, iti zice botul mai bine ca mine 😄',
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
