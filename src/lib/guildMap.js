/**
 * Traduce cheile din blueprint (ex: "roster", "log-mod") in ID-uri reale.
 * Maparea se salveaza cand rulezi /setup server; daca lipseste, cautam
 * dupa nume ca sa mearga si pe servere construite manual.
 */
import { settings } from './db.js';
import { ROLES, CATEGORIES } from '../config/blueprint.js';

export function setRoleId(guildId, key, id) {
  settings.set(guildId, `roles.${key}`, id);
}

export function setChannelId(guildId, key, id) {
  settings.set(guildId, `channels.${key}`, id);
}

export function getRole(guild, key) {
  const id = settings.get(guild.id, `roles.${key}`);
  if (id) {
    const role = guild.roles.cache.get(id);
    if (role) return role;
  }
  const def = ROLES.find((r) => r.key === key);
  if (!def) return null;
  const found = guild.roles.cache.find((r) => r.name === def.name);
  if (found) setRoleId(guild.id, key, found.id);
  return found ?? null;
}

export function getChannel(guild, key) {
  const id = settings.get(guild.id, `channels.${key}`);
  if (id) {
    const channel = guild.channels.cache.get(id);
    if (channel) return channel;
  }
  let def = null;
  for (const cat of CATEGORIES) {
    const match = cat.channels.find((c) => c.key === key);
    if (match) { def = match; break; }
    if (cat.key === key) { def = cat; break; }
  }
  if (!def) return null;
  const found = guild.channels.cache.find((c) => c.name === def.name);
  if (found) setChannelId(guild.id, key, found.id);
  return found ?? null;
}

/** Toate rolurile dintr-un grup din blueprint (ex: "level", "rank"). */
export function rolesOfGroup(guild, group) {
  return ROLES.filter((r) => r.group === group)
    .map((r) => ({ def: r, role: getRole(guild, r.key) }))
    .filter((r) => r.role);
}
