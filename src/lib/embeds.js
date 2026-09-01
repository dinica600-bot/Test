import { EmbedBuilder } from 'discord.js';
import { COLORS, config } from '../config/config.js';

const FOOTER = `${config.squadName} • ${config.squadTag}`;

function base(color) {
  return new EmbedBuilder().setColor(color).setFooter({ text: FOOTER }).setTimestamp();
}

export const embeds = {
  brand: (title, description) => base(COLORS.primary).setTitle(title).setDescription(description ?? null),
  success: (description, title = null) =>
    base(COLORS.success).setDescription(`✅ ${description}`).setTitle(title),
  error: (description, title = null) =>
    base(COLORS.danger).setDescription(`❌ ${description}`).setTitle(title),
  warn: (description, title = null) =>
    base(COLORS.warning).setDescription(`⚠️ ${description}`).setTitle(title),
  info: (description, title = null) =>
    base(COLORS.info).setDescription(description).setTitle(title),
  custom: (color) => base(color),
};

/** Raspuns rapid de eroare, mereu ephemeral. */
export function fail(interaction, message) {
  const payload = { embeds: [embeds.error(message)], flags: 64 };
  return interaction.replied || interaction.deferred
    ? interaction.followUp(payload)
    : interaction.reply(payload);
}

/** Raspuns rapid de succes. */
export function ok(interaction, message, ephemeral = true) {
  const payload = { embeds: [embeds.success(message)], ...(ephemeral ? { flags: 64 } : {}) };
  return interaction.replied || interaction.deferred
    ? interaction.followUp(payload)
    : interaction.reply(payload);
}

/** Bara de progres text — folosita la nivele si la voturi. */
export function progressBar(current, total, size = 12) {
  const ratio = total <= 0 ? 0 : Math.min(Math.max(current / total, 0), 1);
  const filled = Math.round(ratio * size);
  return `${'█'.repeat(filled)}${'░'.repeat(size - filled)} ${Math.round(ratio * 100)}%`;
}

/** Timestamp Discord relativ. */
export function ts(date, style = 'R') {
  return `<t:${Math.floor(new Date(date).getTime() / 1000)}:${style}>`;
}
