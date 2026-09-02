/**
 * Ambianta din chat — personaje care poarta conversatii intre ele.
 *
 * DE STIUT: Discord marcheaza automat mesajele trimise prin webhook cu
 * eticheta APP. Nu exista nicio cale de a le face sa para membri reali —
 * scopul lor e sa dea viata canalului, nu sa insele pe cineva.
 *
 * Se porneste cu /ambianta pornit.
 */
import { settings, db } from './db.js';
import { assetPath } from './assets.js';
import { getChannel } from './guildMap.js';
import { console_ } from './logger.js';
import { embeds } from './embeds.js';
import { GLOSSARY } from './personaBrain.js';
import { CURIOSITY } from './personaBrain.js';

export const PERSONAS = {
  razvan: { name: 'Răzvan', avatar: 'personas/razvan.png' },
  ionut: { name: 'Ionuț', avatar: 'personas/ionut.png' },
  ale: { name: 'Ale', avatar: 'personas/ale.png' },
  bogdan: { name: 'Bogdan', avatar: 'personas/bogdan.png' },
  denisa: { name: 'Denisa', avatar: 'personas/denisa.png' },
  cristi: { name: 'Cristi', avatar: 'personas/cristi.png' },
};

/** Conversatii scurte, jucate cu pauze intre replici. */
export const CONVERSATIONS = [
  [
    { who: 'denisa', text: 'iar am prins jungler care fura farmul de pe gold lane 😐' },
    { who: 'razvan', text: 'daca nu dai ping la retreat si mori sub turela lor, farmul e ultima ta problema' },
    { who: 'denisa', text: 'am dat ping. de 4 ori.' },
    { who: 'cristi', text: 'ping-ul in mlbb e decorativ, ca semnalizarea la soferi' },
  ],
  [
    { who: 'ionut', text: 'baieti ce iau pe exp lane cand au 2 tanks?' },
    { who: 'bogdan', text: 'ceva cu true damage sau anti heal. terizla merge bine, sau xborg daca stii sa-l joci' },
    { who: 'ionut', text: 'xborg mi se pare greu' },
    { who: 'bogdan', text: 'atunci terizla. si ia sea halberd al doilea item, nu-l lasa ultimul' },
  ],
  [
    { who: 'ale', text: 'cine mai joaca mid in patch-ul asta? simt ca murim din nimic' },
    { who: 'razvan', text: 'pentru ca nu mai are nimeni tank in fata voastra' },
    { who: 'ale', text: 'exact asta ziceam si eu' },
  ],
  [
    { who: 'cristi', text: 'am dat maniac cu layla si echipa a zis ca am furat kill-urile' },
    { who: 'denisa', text: 'pai le-ai furat' },
    { who: 'cristi', text: 'le-am salvat de la irosire, nu e acelasi lucru' },
  ],
  [
    { who: 'razvan', text: 'cine e liber diseara de scrim? ne trebuie 5' },
    { who: 'bogdan', text: 'eu pot dupa 9' },
    { who: 'ale', text: 'si eu, dar nu mai tarziu de 11 ca maine am treaba' },
    { who: 'ionut', text: 'ma bag si eu daca ma luati 😄' },
  ],
  [
    { who: 'ionut', text: 'care e cel mai usor jungler pentru inceput?' },
    { who: 'razvan', text: 'saber sau balmond. clear rapid, nu ai ce gresi' },
    { who: 'bogdan', text: 'si invata unde sunt buff-urile lor, nu doar ale tale. jumatate din jungling e sa stii unde e adversarul' },
  ],
  [
    { who: 'denisa', text: 'de ce toata lumea banuieste fanny si nimeni nu baneaza khufra' },
    { who: 'ale', text: 'pentru ca lumea se teme de ce vede, nu de ce o omoara' },
    { who: 'cristi', text: 'asta a fost surprinzator de profund pentru ora asta' },
  ],
  [
    { who: 'bogdan', text: 'sfat de la mine: cumparati anti-heal cand vedeti esmeralda. nu la minutul 14, de la primul item' },
    { who: 'ionut', text: 'care e anti-heal?' },
    { who: 'bogdan', text: 'sea halberd pentru fizic, necklace of durance pentru magic' },
    { who: 'ionut', text: 'am notat, mersi 🙏' },
  ],
  [
    { who: 'cristi', text: 'am pierdut 4 la rand. ma retrag din joc.' },
    { who: 'razvan', text: 'ne vedem in 20 de minute' },
    { who: 'cristi', text: 'in 15, dar nu spune nimanui' },
  ],
  [
    { who: 'ale', text: 'cineva pentru classic? nu vreau rank acum' },
    { who: 'denisa', text: 'vin, dar joc tot serios' },
    { who: 'ale', text: 'de asta te si chem' },
  ],
  [
    { who: 'razvan', text: 'turtle la minutul 2 valoreaza mai mult decat orice kill de pe lane' },
    { who: 'denisa', text: 'zi-le si alora din echipa mea, nu mie' },
  ],
  [
    { who: 'ionut', text: 'am ajuns epic 🎉' },
    { who: 'bogdan', text: 'felicitari! acum incepe partea grea' },
    { who: 'cristi', text: 'bine ai venit in iad, ai grija la pasul de la epic 1' },
    { who: 'ale', text: 'bravo 👏' },
  ],
];

/** Replici scurte, trimise singure. */
export const SOLO = [
  { who: 'cristi', text: 'cine e online? ma plictisesc' },
  { who: 'razvan', text: 'daca e cineva pentru rank, sunt in voice' },
  { who: 'bogdan', text: 'tocmai am vazut un clip de la m-series, ce rotatii au aia... alt joc' },
  { who: 'denisa', text: 'wr-ul meu plange dupa seara de ieri' },
  { who: 'ale', text: 'patch-ul asta i-a distrus pe mage, sper sa revina' },
  { who: 'ionut', text: 'ma uit la ghiduri de 2 ore si tot nu stiu ce main sa-mi aleg' },
  { who: 'cristi', text: 'propun sa schimbam numele squad-ului in "Blood x Diamonds x Feed"' },
  { who: 'razvan', text: 'antrenament diseara. cine nu vine, joaca solo q si vedem cum iese' },
];

const webhookCache = new Map(); // "channelId:persona" -> Webhook

/** Ia (sau creeaza) webhook-ul unui personaj pentru canalul dat. */
async function getWebhook(channel, key) {
  const cacheKey = `${channel.id}:${key}`;
  if (webhookCache.has(cacheKey)) return webhookCache.get(cacheKey);

  const persona = PERSONAS[key];
  const hooks = await channel.fetchWebhooks().catch(() => null);
  let hook = hooks?.find((h) => h.name === persona.name && h.token);

  if (!hook) {
    const avatar = assetPath(persona.avatar);
    hook = await channel.createWebhook({
      name: persona.name,
      avatar: avatar ?? undefined,
      reason: 'Ambianta Blood×Diamonds',
    }).catch(() => null);
  }

  if (hook) webhookCache.set(cacheKey, hook);
  return hook;
}

/** Trimite un mesaj in numele unui personaj. */
export async function sendAs(channel, key, text) {
  const hook = await getWebhook(channel, key);
  if (!hook) return null;
  return hook.send({ content: text, allowedMentions: { parse: [] } }).catch(() => null);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Joaca o conversatie, cu pauze intre replici ca sa para scrisa pe loc. */
export async function playConversation(channel, conversation) {
  for (const [i, line] of conversation.entries()) {
    if (i > 0) await wait(4000 + Math.random() * 7000);
    await channel.sendTyping().catch(() => {});
    await wait(1500 + line.text.length * 40);
    await sendAs(channel, line.who, line.text);
  }
}

/**
 * Ce se joaca data viitoare: o conversatie, o replica singura sau o
 * intrebare pusa canalului (la care pot raspunde si membrii reali).
 */
export function pickScene() {
  const roll = Math.random();
  if (roll < 0.20) return [SOLO[Math.floor(Math.random() * SOLO.length)]];
  if (roll < 0.40) return [CURIOSITY[Math.floor(Math.random() * CURIOSITY.length)]];
  return CONVERSATIONS[Math.floor(Math.random() * CONVERSATIONS.length)];
}

/** Sterge webhook-urile personajelor (opreste definitiv ambianta). */
export async function removeWebhooks(channel) {
  const hooks = await channel.fetchWebhooks().catch(() => null);
  if (!hooks) return 0;
  const names = Object.values(PERSONAS).map((p) => p.name);
  let removed = 0;
  for (const hook of hooks.values()) {
    if (names.includes(hook.name)) {
      await hook.delete('Ambianta oprita').catch(() => {});
      webhookCache.delete(`${channel.id}:${hook.name}`);
      removed += 1;
    }
  }
  webhookCache.clear();
  return removed;
}

/**
 * Bucla de ambianta: din cand in cand, daca in canal e liniste,
 * personajele mai schimba cateva vorbe.
 */
export function startAmbianceLoop(client) {
  const tick = async () => {
    for (const guild of client.guilds.cache.values()) {
      if (settings.get(guild.id, 'ambiance.enabled', false) !== true) continue;

      const next = db.get('ambiance', `${guild.id}.next`, 0);
      if (Date.now() < next) continue;

      const channelId = settings.get(guild.id, 'ambiance.channel');
      const channel = channelId ? guild.channels.cache.get(channelId) : getChannel(guild, 'general');
      if (!channel?.isTextBased()) continue;

      // nu intrerupem o discutie reala
      const last = await channel.messages.fetch({ limit: 1 }).then((m) => m.first()).catch(() => null);
      const quietFor = last ? Date.now() - last.createdTimestamp : Infinity;
      if (quietFor < 15 * 60_000) continue;

      const min = Number(settings.get(guild.id, 'ambiance.minMinutes', 45));
      const max = Number(settings.get(guild.id, 'ambiance.maxMinutes', 180));
      db.set('ambiance', `${guild.id}.next`, Date.now() + (min + Math.random() * (max - min)) * 60_000);

      playConversation(channel, pickScene()).catch((err) => console_.warn('Ambianta:', err.message));
    }
  };

  setTimeout(tick, 60_000);
  setInterval(tick, 5 * 60_000).unref?.();
}

/** Mesajul de prezentare pentru canalul de intrebari. */
export function askPanel() {
  const embed = embeds
    .custom(0x38bdf8)
    .setTitle('🙋 Întreabă orice despre Mobile Legends')
    .setDescription(
      'Ești nou în joc sau nu înțelegi un termen? **Scrie aici și primești răspuns pe loc.**\n' +
      'Nicio întrebare nu e prea de începător — toți am fost acolo.\n\n' +
      '**Poți întreba lucruri ca:**\n' +
      '```\n' +
      'ce iau contra fanny?\n' +
      'ce build la lancelot?\n' +
      'cum se joaca esmeralda?\n' +
      'ce inseamna gank?\n' +
      'ce e anti heal?\n' +
      '```',
    )
    .addFields(
      {
        name: '🧠 Cine îți răspunde',
        value: Object.values(PERSONAS).map((p) => p.name).join(' • ') +
          '\n_Fiecare se pricepe la altceva: Bogdan la tank-uri și sfaturi, Ale la mage, ' +
          'Denisa la marksman, Răzvan la jungle și fighteri._',
      },
      {
        name: '📖 Ce știu',
        value: `**125 de eroi** cu counter-e, build-uri și lane-uri, plus **${Object.keys(GLOSSARY).length} termeni** din joc explicați pe românește.`,
      },
      {
        name: '⚡ Vrei răspunsul complet?',
        value: 'Comenzile `/hero <nume>`, `/counter <erou>` și `/build <erou>` îți dau toate detaliile deodată.',
      },
    )
    .setFooter({ text: 'Răspunsurile vin de la boți — Discord îi marchează cu APP. Informațiile sunt însă reale.' });
  return { embeds: [embed] };
}
