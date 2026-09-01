import { settings } from './db.js';
import { embeds } from './embeds.js';

/**
 * Trimite un embed intr-unul din canalele de log configurate.
 * type: join | message | mod | voice | ticket | bot
 */
export async function log(guild, type, embed) {
  if (!guild) return;
  const channelId = settings.get(guild.id, `logs.${type}`);
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) return;
  try {
    await channel.send({ embeds: [embed] });
  } catch {
    /* canalul poate fi sters sau fara permisiuni — ignoram */
  }
}

/** Log pentru actiuni de moderare, cu format standard. */
export async function modLog(guild, { action, target, moderator, reason, extra, color }) {
  const embed = embeds
    .custom(color ?? 0xef4444)
    .setTitle(`🔨 ${action}`)
    .addFields(
      { name: 'Membru', value: target ? `${target} \`${target.id ?? ''}\`` : 'necunoscut', inline: true },
      { name: 'Moderator', value: moderator ? `${moderator}` : 'sistem', inline: true },
      { name: 'Motiv', value: reason || 'fara motiv specificat' },
    );
  if (extra) embed.addFields({ name: 'Detalii', value: extra });
  await log(guild, 'mod', embed);
}

export const console_ = {
  info: (...a) => console.log('\x1b[36m[info]\x1b[0m', ...a),
  ok: (...a) => console.log('\x1b[32m[ok]\x1b[0m', ...a),
  warn: (...a) => console.warn('\x1b[33m[warn]\x1b[0m', ...a),
  error: (...a) => console.error('\x1b[31m[err]\x1b[0m', ...a),
};
