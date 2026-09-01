/**
 * Sistem de nivele (XP din mesaje si din voice), cu roluri de recompensa.
 * Formula e cea clasica: pentru a trece de la nivelul n la n+1 ai nevoie de
 * 5*n^2 + 50*n + 100 XP.
 */
import { db, settings } from './db.js';
import { ROLES } from '../config/blueprint.js';
import { getRole, getChannel } from './guildMap.js';
import { embeds } from './embeds.js';

const COOLDOWN_MS = 60_000;
const cooldowns = new Map();

export function xpForNext(level) {
  return 5 * level * level + 50 * level + 100;
}

export function totalXpForLevel(level) {
  let total = 0;
  for (let i = 0; i < level; i += 1) total += xpForNext(i);
  return total;
}

export function getUser(guildId, userId) {
  return db.get('levels', `${guildId}.${userId}`, {
    xp: 0, level: 0, messages: 0, voice: 0,
  });
}

function saveUser(guildId, userId, data) {
  db.set('levels', `${guildId}.${userId}`, data);
}

/**
 * Adauga XP. Returneaza { leveledUp, level, data }.
 * `respectCooldown` = true pentru XP din mesaje (o data pe minut).
 */
export function addXp(guildId, userId, amount, respectCooldown = false) {
  if (respectCooldown) {
    const key = `${guildId}:${userId}`;
    const last = cooldowns.get(key) ?? 0;
    if (Date.now() - last < COOLDOWN_MS) return { leveledUp: false, level: null, data: null };
    cooldowns.set(key, Date.now());
  }

  const data = getUser(guildId, userId);
  data.xp += amount;
  let leveledUp = false;
  while (data.xp >= xpForNext(data.level)) {
    data.xp -= xpForNext(data.level);
    data.level += 1;
    leveledUp = true;
  }
  saveUser(guildId, userId, data);
  return { leveledUp, level: data.level, data };
}

export function addMessage(guildId, userId) {
  const data = getUser(guildId, userId);
  data.messages = (data.messages ?? 0) + 1;
  saveUser(guildId, userId, data);
}

export function leaderboard(guildId, limit = 10) {
  const all = db.get('levels', guildId, {});
  return Object.entries(all)
    .map(([id, d]) => ({ id, ...d, total: totalXpForLevel(d.level ?? 0) + (d.xp ?? 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function rankOf(guildId, userId) {
  const all = db.get('levels', guildId, {});
  const sorted = Object.entries(all)
    .map(([id, d]) => ({ id, total: totalXpForLevel(d.level ?? 0) + (d.xp ?? 0) }))
    .sort((a, b) => b.total - a.total);
  const index = sorted.findIndex((u) => u.id === userId);
  return { position: index === -1 ? sorted.length + 1 : index + 1, of: sorted.length };
}

/** Da rolurile de nivel cuvenite si anunta in #level-up. */
export async function handleLevelUp(member, level) {
  const rewards = ROLES.filter((r) => r.group === 'level' && r.level <= level)
    .sort((a, b) => a.level - b.level);
  const earned = rewards.at(-1);
  let newRole = null;

  if (earned) {
    const role = getRole(member.guild, earned.key);
    if (role && !member.roles.cache.has(role.id)) {
      // scoatem rolurile de nivel mai mici, pastram doar cel mai mare
      const older = ROLES.filter((r) => r.group === 'level' && r.key !== earned.key)
        .map((r) => getRole(member.guild, r.key))
        .filter((r) => r && member.roles.cache.has(r.id));
      try {
        if (older.length) await member.roles.remove(older, 'Level up — rol vechi de nivel');
        await member.roles.add(role, `A ajuns la nivelul ${level}`);
        newRole = role;
      } catch { /* fara permisiuni */ }
    }
  }

  if (settings.get(member.guild.id, 'leveling.announce', true) === false) return newRole;

  const channel = getChannel(member.guild, 'levelup') ?? getChannel(member.guild, 'general');
  if (channel?.isTextBased()) {
    const embed = embeds
      .custom(0xffd700)
      .setAuthor({ name: member.user.username, iconURL: member.displayAvatarURL() })
      .setTitle('⭐ Level Up!')
      .setDescription(
        `${member} a ajuns la **nivelul ${level}**!` +
        (newRole ? `\nA primit rolul ${newRole}. 🎉` : ''),
      );
    channel.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
  }
  return newRole;
}
