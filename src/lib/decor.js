/**
 * Decorul serverului — icon, avatar, emoji, banere.
 *
 * Logica sta aici, separat de comanda, ca sa poata fi folosita in doua feluri:
 *   • din Discord, cu /decor
 *   • din terminal, cu `npm run decor` — util cand telefonul e prea lent
 *     si interactiunile expira (Discord da doar 3 secunde la o comanda /)
 */
import { asset, assetPath } from './assets.js';
import { emojiName, setEmojiId, FALLBACK } from './emojis.js';
import { getChannel } from './guildMap.js';
import { settings } from './db.js';

/** Ce baner merge in ce canal. */
export const PLACEMENTS = [
  { file: 'welcome.png', channel: 'welcome' },
  { file: 'banner-info.png', channel: 'announcements' },
  { file: 'banner-community.png', channel: 'general' },
  { file: 'banner-mlbb.png', channel: 'tips' },
  { file: 'banner-voice.png', channel: 'lfg' },
  { file: 'banner-competitive.png', channel: 'scrim-schedule' },
  { file: 'banner-academy.png', channel: 'training' },
  { file: 'banner-support.png', channel: 'faq' },
  { file: 'banner-staff.png', channel: 'staff-chat' },
];

export async function applyIcon(guild) {
  const icon = assetPath('icon.png');
  if (!icon) throw new Error('assets/icon.png lipseste — ruleaza scripts/generate-assets.py');
  await guild.setIcon(icon, 'Icon Blood×Diamonds');
  return 'Iconul serverului';
}

export async function applyAvatar(client) {
  const icon = assetPath('icon.png');
  if (!icon) throw new Error('assets/icon.png lipseste');
  await client.user.setAvatar(icon);
  return 'Avatarul botului';
}

/**
 * Incarca emoji-urile. `onProgress(nume, stare)` e apelat pentru fiecare,
 * ca sa se poata afisa progresul in terminal.
 */
export async function uploadEmojis(guild, onProgress = () => {}) {
  const uploaded = [];
  const skipped = [];
  const failed = [];

  for (const key of Object.keys(FALLBACK)) {
    const name = emojiName(key);
    const path = assetPath(`emoji/emoji-${key}.png`);
    if (!path) { failed.push(key); onProgress(key, 'lipseste fisierul'); continue; }

    const existing = guild.emojis.cache.find((em) => em.name === name);
    if (existing) {
      setEmojiId(guild.id, key, existing.id);
      skipped.push(`<:${name}:${existing.id}>`);
      onProgress(key, 'exista deja');
      continue;
    }

    try {
      const emoji = await guild.emojis.create({ attachment: path, name, reason: 'Pachet emoji Blood×Diamonds' });
      setEmojiId(guild.id, key, emoji.id);
      uploaded.push(`<:${name}:${emoji.id}>`);
      onProgress(key, 'incarcat');
    } catch (err) {
      failed.push(`${key} (${err.message.slice(0, 50)})`);
      onProgress(key, `esuat: ${err.message.slice(0, 50)}`);
    }
  }
  return { uploaded, skipped, failed };
}

export async function postBanners(guild, onProgress = () => {}) {
  let posted = 0;
  let missing = 0;

  for (const { file, channel: key } of PLACEMENTS) {
    const channel = getChannel(guild, key);
    const attachment = asset(file);
    if (!channel?.isTextBased() || !attachment) {
      missing += 1;
      onProgress(key, channel ? 'lipseste imaginea' : 'lipseste canalul');
      continue;
    }

    const previous = settings.get(guild.id, `decor.${key}`);
    if (previous) await channel.messages.fetch(previous).then((m) => m.delete()).catch(() => {});

    try {
      const message = await channel.send({ files: [attachment] });
      settings.set(guild.id, `decor.${key}`, message.id);
      posted += 1;
      onProgress(key, 'postat');
    } catch (err) {
      missing += 1;
      onProgress(key, `esuat: ${err.message.slice(0, 50)}`);
    }
  }
  return { posted, missing };
}
