/**
 * Raspunsuri prin Claude API — optional.
 *
 * Fara cheie in .env, botul merge exact ca pana acum, pe reguli. Cu cheie,
 * intrebarile pe care regulile nu le prind exact ajung la model, care
 * raspunde in numele personajului, scurt si in romana.
 *
 * Datele despre erou (counter-e, itemi, lane) sunt trimise ca sursa, ca
 * raspunsul sa fie ancorat in baza noastra, nu inventat.
 *
 * Cost orientativ: ~0,5 cenți per raspuns. Limita pe ora se pune din .env.
 */
import { findHero, counteredBy, BUILD_TEMPLATES, ROLE_EMOJI } from '../data/heroes.js';
import { console_ } from './logger.js';

const MODEL = process.env.AI_MODEL || 'claude-opus-5';
const MAX_PER_HOUR = Number(process.env.AI_MAX_PER_HOUR || 40);

let client;           // undefined = neincercat, null = indisponibil
const calls = [];     // marcaje de timp, pentru limita pe ora

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function withinLimit() {
  const hourAgo = Date.now() - 3600_000;
  while (calls.length && calls[0] < hourAgo) calls.shift();
  return calls.length < MAX_PER_HOUR;
}

async function getClient() {
  if (client !== undefined) return client;
  if (!aiEnabled()) { client = null; return null; }
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    client = new Anthropic();
    console_.ok(`AI pornit (${MODEL}) — maxim ${MAX_PER_HOUR} raspunsuri pe ora.`);
  } catch (err) {
    console_.warn(`Nu am putut porni AI-ul: ${err.message}. Ruleaza: npm install @anthropic-ai/sdk`);
    client = null;
  }
  return client;
}

const PERSONA_STYLE = {
  razvan: 'Răzvan, jungler competitiv. Direct, uneori taios, dar corect.',
  ionut: 'Ionuț, jucator incepator si entuziast. Recunoaste cand nu stie.',
  ale: 'Ale, mage main. Sarcastica, raspunde scurt.',
  bogdan: 'Bogdan, tank/roam. Calm, explica pe intelesul incepatorilor.',
  denisa: 'Denisa, marksman. Practica, se plange de coechipieri.',
  cristi: 'Cristi, glumetul grupului. Raspunde corect, dar cu o gluma.',
};

/** Datele noastre despre eroul mentionat, ca sursa pentru raspuns. */
function heroContext(text) {
  const hero = findHero(text) ?? null;
  if (!hero) return '';
  const build = BUILD_TEMPLATES[hero.role];
  return [
    '',
    'Date din baza serverului despre eroul mentionat (foloseste-le, sunt corecte):',
    `- ${hero.name} (${ROLE_EMOJI[hero.role] ?? ''} ${hero.role}), lane: ${hero.lanes.join(', ')}, dificultate: ${hero.diff}`,
    `- il contreaza: ${hero.counters?.join(', ') || 'necunoscut'}`,
    `- el contreaza: ${counteredBy(hero).join(', ') || 'necunoscut'}`,
    `- itemi tipici pentru rolul lui: ${build.items.join(', ')}`,
    `- emblema: ${build.emblem}; spell: ${build.spell}`,
  ].join('\n');
}

function systemPrompt(persona) {
  return `Esti ${PERSONA_STYLE[persona] ?? PERSONA_STYLE.bogdan}
Scrii pe un server de Discord al unui squad romanesc de Mobile Legends: Bang Bang.

Reguli de raspuns:
- Raspunde in romana, ca intr-un chat: cu litere mici, fara diacritice, fara formule politicoase lungi.
- Maximum 2 propozitii. Fara liste, fara titluri, fara emoji in exces (cel mult unul).
- Raspunde doar despre Mobile Legends. Daca intrebarea e despre altceva, spune scurt ca vorbesti doar despre joc.
- Daca nu esti sigur, spune ca nu stii sigur. Nu inventa nume de eroi, itemi sau abilitati.
- Nu da sfaturi despre conturi cumparate, cheat-uri sau boosting.
- Nu te prezenta si nu spune ca esti un model de limbaj. Esti pur si simplu ${persona}.`;
}

/**
 * @returns {Promise<string|null>} raspunsul, sau null daca AI-ul nu e
 * disponibil, e peste limita sau a dat eroare — caz in care raman regulile.
 */
export async function aiAnswer(question, persona = 'bogdan') {
  const anthropic = await getClient();
  if (!anthropic) return null;

  if (!withinLimit()) {
    console_.warn(`AI: am atins limita de ${MAX_PER_HOUR} raspunsuri pe ora, folosesc regulile.`);
    return null;
  }
  calls.push(Date.now());

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      output_config: { effort: 'low' },
      cache_control: { type: 'ephemeral' },
      system: systemPrompt(persona),
      messages: [{ role: 'user', content: `${question}${heroContext(question)}` }],
    });

    if (response.stop_reason === 'refusal') return null;

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join(' ')
      .trim();

    return text ? text.slice(0, 700) : null;
  } catch (err) {
    console_.warn(`AI indisponibil (${err.status ?? ''} ${err.message}). Raman pe reguli.`);
    return null;
  }
}
