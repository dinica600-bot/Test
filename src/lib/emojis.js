/**
 * Emoji-urile personalizate ale squad-ului.
 *
 * Se incarca cu /decor emoji si nu cer niciun boost — orice server are
 * 50 de sloturi gratuite. Dupa incarcare, botul le foloseste automat in
 * embed-uri, iar membrii le pot folosi in chat si ca reactii.
 */
import { settings } from './db.js';

/** cheie -> emoji unicode de rezerva, daca cel personalizat nu e incarcat */
export const FALLBACK = {
  bxd: '🩸', sange: '🩸', diamant: '💎',
  gold: '🥇', exp: '🛡️', mid: '🔮', jungle: '🌲', roam: '🧿',
  warrior: '⚔️', elite: '🔰', master: '🎖️', gm: '🏅', epic: '💜',
  legend: '🔥', mythic: '🌌', honor: '✨', glory: '👑', immortal: '💫',
  win: '🏆', loss: '❌', mvp: '⭐', scrim: '⚔️',
  owner: '🩸', coowner: '💎', admin: '⚔️', mod: '🛡️', coach: '🎯',
  creator: '🎥', roster: '🏆', sub: '🔁', academy: '🎓', tryout: '🧪',
};

/** Numele cu care se incarca pe server (prefixate ca sa nu se bata cap in cap). */
export function emojiName(key) {
  return key === 'bxd' ? 'bxd' : `bxd_${key}`;
}

/**
 * Emoji-ul de folosit intr-un mesaj: cel personalizat daca exista,
 * altfel cel unicode. Nu crapa niciodata.
 */
export function e(guild, key) {
  if (!guild) return FALLBACK[key] ?? '';
  const id = settings.get(guild.id, `emojis.${key}`);
  if (id && guild.emojis.cache.has(id)) return `<:${emojiName(key)}:${id}>`;
  return FALLBACK[key] ?? '';
}

/** ID-ul brut al emoji-ului, pentru meniuri si butoane (nu textul <:x:id>). */
export function emojiId(guild, key) {
  if (!guild) return null;
  const id = settings.get(guild.id, `emojis.${key}`);
  return id && guild.emojis.cache.has(id) ? id : null;
}

export function setEmojiId(guildId, key, id) {
  settings.set(guildId, `emojis.${key}`, id);
}
