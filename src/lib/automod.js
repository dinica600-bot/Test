/**
 * Automod — filtre de baza pentru chat. Fiecare filtru se poate opri din
 * /config automod. Staff-ul e mereu exceptat.
 */
import { PermissionFlagsBits } from 'discord.js';
import { settings } from './db.js';
import { embeds } from './embeds.js';
import { log } from './logger.js';
import { isStaff } from './permissions.js';
import { COLORS } from '../config/config.js';

const DEFAULT_WORDS = ['nigg', 'retard', 'pizda', 'muie', 'kys', 'faggot'];
const INVITE_RE = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/\S+/i;
const LINK_RE = /https?:\/\/\S+/i;

const spamTracker = new Map();   // userId -> [timestamps]
const strikeTracker = new Map(); // userId -> { count, until }

function opt(guildId, key, fallback) {
  return settings.get(guildId, `automod.${key}`, fallback);
}

async function punish(message, reason) {
  await message.delete().catch(() => {});

  const warning = await message.channel
    .send({ content: `${message.author}`, embeds: [embeds.warn(reason)] })
    .catch(() => null);
  setTimeout(() => warning?.delete().catch(() => {}), 7000);

  await log(message.guild, 'mod', embeds.custom(COLORS.warning)
    .setTitle('🤖 Automod')
    .setDescription(`${message.author} in ${message.channel}\n**Motiv:** ${reason}`)
    .addFields({ name: 'Mesaj', value: `\`\`\`${message.content.slice(0, 500) || '—'}\`\`\`` }));

  // 3 abateri in 10 minute => timeout 10 minute
  const now = Date.now();
  const strike = strikeTracker.get(message.author.id) ?? { count: 0, until: now + 600_000 };
  if (now > strike.until) { strike.count = 0; strike.until = now + 600_000; }
  strike.count += 1;
  strikeTracker.set(message.author.id, strike);

  if (strike.count >= 3 && message.member.moderatable) {
    await message.member.timeout(10 * 60_000, 'Automod: 3 abateri consecutive').catch(() => {});
    strike.count = 0;
    await message.channel.send({
      embeds: [embeds.error(`${message.author} a primit **timeout 10 minute** (automod).`)],
    }).catch(() => {});
  }
}

/** Returneaza true daca mesajul a fost sters. */
export async function runAutomod(message) {
  if (!message.guild || message.author.bot) return false;
  if (!message.member) return false;
  if (isStaff(message.member)) return false;
  if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return false;
  if (opt(message.guild.id, 'enabled', true) === false) return false;

  const content = message.content ?? '';
  const gid = message.guild.id;

  if (opt(gid, 'invites', true) && INVITE_RE.test(content)) {
    await punish(message, 'Nu dai invite-uri catre alte servere. Cere voie staff-ului.');
    return true;
  }

  if (opt(gid, 'links', false) && LINK_RE.test(content)) {
    await punish(message, 'Link-urile sunt permise doar in canalele dedicate.');
    return true;
  }

  const words = opt(gid, 'words', DEFAULT_WORDS);
  const lower = content.toLowerCase();
  if (opt(gid, 'profanity', true) && words.some((w) => lower.includes(w))) {
    await punish(message, 'Limbaj interzis. Regula 1: respect.');
    return true;
  }

  const mentions = message.mentions.users.size + message.mentions.roles.size;
  if (opt(gid, 'mentions', true) && mentions >= Number(opt(gid, 'maxMentions', 5))) {
    await punish(message, 'Prea multe mentiuni intr-un mesaj.');
    return true;
  }

  if (opt(gid, 'caps', true) && content.length > 15) {
    const letters = content.replace(/[^a-zA-Z]/g, '');
    const caps = content.replace(/[^A-Z]/g, '');
    if (letters.length > 10 && caps.length / letters.length > 0.75) {
      await punish(message, 'Nu scrie totul cu majuscule.');
      return true;
    }
  }

  if (opt(gid, 'spam', true)) {
    const now = Date.now();
    const stamps = (spamTracker.get(message.author.id) ?? []).filter((t) => now - t < 5000);
    stamps.push(now);
    spamTracker.set(message.author.id, stamps);
    if (stamps.length >= 6) {
      spamTracker.set(message.author.id, []);
      await punish(message, 'Incetineste — dai spam.');
      return true;
    }
  }

  return false;
}
