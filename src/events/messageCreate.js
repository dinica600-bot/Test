import { Events } from 'discord.js';
import { runAutomod } from '../lib/automod.js';
import { addXp, addMessage, handleLevelUp } from '../lib/leveling.js';
import { db, settings } from '../lib/db.js';
import { getChannel } from '../lib/guildMap.js';
import { answerFor, maybeFollowUp, isQuestion } from '../lib/personaBrain.js';
import { sendAs } from '../lib/personas.js';
import { aiAnswer, aiEnabled } from '../lib/aiBrain.js';

/** Ultimul raspuns dat de personaje, pe canal — ca sa nu vorbeasca peste tot. */
const lastReply = new Map();

/**
 * Personajele citesc chatul si raspund uneori. Nu la orice mesaj:
 * la intrebari aproape mereu, la afirmatii rar, si niciodata mai des
 * de o data pe minut, ca sa nu sufoce discutia.
 */
async function personaReply(message) {
  const gid = message.guild.id;
  if (settings.get(gid, 'ambiance.reply', true) === false) return;

  const askChannel = getChannel(message.guild, 'ask');
  const inAskChannel = askChannel && message.channel.id === askChannel.id;
  const mentioned = message.mentions.users.has(message.client.user.id);

  // In canalul de intrebari si cand esti chemat cu tag, raspund mereu si
  // imediat — pentru asta exista. In rest, doar daca ambianta e pornita.
  const alwaysAnswer = inAskChannel || mentioned;

  if (!alwaysAnswer) {
    if (settings.get(gid, 'ambiance.enabled', false) !== true) return;
    const channelId = settings.get(gid, 'ambiance.channel');
    const allowed = channelId ?? getChannel(message.guild, 'general')?.id;
    if (message.channel.id !== allowed) return;

    const last = lastReply.get(message.channel.id) ?? 0;
    if (Date.now() - last < 60_000) return;
  }

  const answer = answerFor(message.content, { always: alwaysAnswer });
  if (!answer) return;

  // Regulile dau raspunsuri exacte pentru eroi si termeni — alea raman,
  // sunt corecte si gratuite. Doar cand nu prind subiectul intrebam AI-ul.
  if (!answer.specific && aiEnabled()) {
    const smart = await aiAnswer(message.content, answer.who);
    if (smart) answer.text = smart;
  }
  // la afirmatii raspund doar din cand in cand (nu si in canalul de ajutor)
  if (!alwaysAnswer && !isQuestion(message.content) && Math.random() > 0.35) return;

  lastReply.set(message.channel.id, Date.now());

  // in canalul de ajutor raspund repede; in chat obisnuit, mai lejer
  await new Promise((r) => setTimeout(r, alwaysAnswer ? 400 : 2000 + Math.random() * 3000));
  await message.channel.sendTyping().catch(() => {});
  await new Promise((r) => setTimeout(r, alwaysAnswer ? 900 : 1200 + answer.text.length * 35));
  await sendAs(message.channel, answer.who, answer.text);

  const followUp = alwaysAnswer ? null : maybeFollowUp(answer.who);
  if (followUp) {
    await new Promise((r) => setTimeout(r, 5000 + Math.random() * 5000));
    await message.channel.sendTyping().catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));
    await sendAs(message.channel, followUp.who, followUp.text);
  }
}

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // webhook-urile personajelor nu trebuie sa se declanseze intre ele
    if (!message.guild || message.author.bot || message.webhookId) return;

    if (await runAutomod(message)) return;

    personaReply(message).catch(() => {});

    // ---- canalul de numaratoare ----
    const counting = getChannel(message.guild, 'counting');
    if (counting && message.channel.id === counting.id) {
      const state = db.get('counting', message.guild.id, { current: 0, lastUser: null });
      const number = Number(message.content.trim());
      if (!Number.isInteger(number) || number !== state.current + 1 || state.lastUser === message.author.id) {
        await message.react('❌').catch(() => {});
        await message.reply({
          content: number === state.current + 1 && state.lastUser === message.author.id
            ? `❌ ${message.author}, nu poti numara de doua ori la rand! O luam de la **1**.`
            : `❌ ${message.author} a stricat sirul la **${state.current}**. O luam de la **1**.`,
        }).catch(() => {});
        db.set('counting', message.guild.id, { current: 0, lastUser: null });
      } else {
        db.set('counting', message.guild.id, { current: number, lastUser: message.author.id });
        await message.react(number % 100 === 0 ? '🎉' : '✅').catch(() => {});
      }
    }

    // ---- XP ----
    if (settings.get(message.guild.id, 'leveling.enabled', true) === false) return;
    const blocked = settings.get(message.guild.id, 'leveling.blockedChannels', []);
    if (blocked.includes(message.channel.id)) return;

    addMessage(message.guild.id, message.author.id);
    const gain = 15 + Math.floor(Math.random() * 11); // 15-25 XP
    const { leveledUp, level } = addXp(message.guild.id, message.author.id, gain, true);
    if (leveledUp) await handleLevelUp(message.member, level).catch(() => {});
  },
};
