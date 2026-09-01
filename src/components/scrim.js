import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { embeds, fail, ts } from '../lib/embeds.js';
import { db } from '../lib/db.js';
import { COLORS, config } from '../config/config.js';
import { isStaff } from '../lib/permissions.js';

export function scrimKey(guildId, messageId) {
  return `${guildId}.${messageId}`;
}

export function scrimEmbed(scrim) {
  const list = (ids) => (ids.length ? ids.map((id, i) => `\`${i + 1}.\` <@${id}>`).join('\n') : '_gol_');
  const slots = scrim.players.length;

  return embeds
    .custom(slots >= 5 ? COLORS.success : COLORS.primary)
    .setTitle(`⚔️ SCRIM — ${config.squadTag} vs ${scrim.opponent}`)
    .setDescription(
      `📅 **Când:** ${ts(scrim.time, 'F')} (${ts(scrim.time, 'R')})\n` +
      `🎮 **Format:** ${scrim.format}\n` +
      (scrim.notes ? `📝 **Note:** ${scrim.notes}\n` : '') +
      `\n${slots >= 5 ? '✅ **Line-up complet!**' : `⏳ Mai avem nevoie de **${5 - slots}** jucători.`}`,
    )
    .addFields(
      { name: `🏆 Titulari (${slots}/5)`, value: list(scrim.players), inline: true },
      { name: `🔁 Rezerve (${scrim.subs.length})`, value: list(scrim.subs), inline: true },
      { name: `❌ Indisponibili (${scrim.out.length})`, value: list(scrim.out), inline: true },
    )
    .setFooter({ text: `Organizat de ${scrim.createdByTag} • ${config.squadName}` });
}

export function scrimButtons(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('scrim:in').setLabel('Joc').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId('scrim:sub').setLabel('Rezervă').setEmoji('🔁').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('scrim:out').setLabel('Nu pot').setEmoji('❌').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('scrim:cancel').setLabel('Anulează scrim').setEmoji('🗑️').setStyle(ButtonStyle.Danger).setDisabled(disabled),
  );
}

export async function handleScrim(interaction) {
  const action = interaction.customId.split(':')[1];
  const key = scrimKey(interaction.guild.id, interaction.message.id);
  const scrim = db.get('scrims', key);
  if (!scrim) return fail(interaction, 'Scrim-ul asta nu mai e in evidenta (probabil a trecut).');

  if (action === 'cancel') {
    if (interaction.user.id !== scrim.createdBy && !isStaff(interaction.member)) {
      return fail(interaction, 'Doar organizatorul sau staff-ul poate anula scrim-ul.');
    }
    db.delete('scrims', key);
    return interaction.update({
      embeds: [embeds.error(`Scrim-ul cu **${scrim.opponent}** a fost anulat de ${interaction.user}.`, '🗑️ Scrim anulat')],
      components: [scrimButtons(true)],
    });
  }

  const id = interaction.user.id;
  scrim.players = scrim.players.filter((p) => p !== id);
  scrim.subs = scrim.subs.filter((p) => p !== id);
  scrim.out = scrim.out.filter((p) => p !== id);

  if (action === 'in') {
    if (scrim.players.length >= 5) {
      scrim.subs.push(id);
      db.set('scrims', key, scrim);
      await interaction.update({ embeds: [scrimEmbed(scrim)], components: [scrimButtons()] });
      return interaction.followUp({
        embeds: [embeds.warn('Line-up-ul e plin, te-am trecut la rezerve.')], flags: 64,
      });
    }
    scrim.players.push(id);
  } else if (action === 'sub') scrim.subs.push(id);
  else if (action === 'out') scrim.out.push(id);

  db.set('scrims', key, scrim);
  return interaction.update({ embeds: [scrimEmbed(scrim)], components: [scrimButtons()] });
}

/* ------------------------------------------------------------------
 *  LFG — grupuri rapide de rank/classic (5 sloturi, fara rezerve)
 * ---------------------------------------------------------------- */
export function lfgEmbed(lfg) {
  const players = lfg.players.map((id, i) => `\`${i + 1}.\` <@${id}>`).join('\n') || '_gol_';
  const free = Math.max(0, lfg.slots - lfg.players.length);
  return embeds
    .custom(free === 0 ? COLORS.success : COLORS.diamond)
    .setTitle(`🎮 LFG — ${lfg.mode}`)
    .setDescription(
      `**Rank minim:** ${lfg.rank}\n` +
      (lfg.notes ? `**Detalii:** ${lfg.notes}\n` : '') +
      `\n${free === 0 ? '✅ **Party complet — dati start!**' : `⏳ Mai sunt **${free}** locuri libere.`}`,
    )
    .addFields({ name: `👥 Party (${lfg.players.length}/${lfg.slots})`, value: players })
    .setFooter({ text: `Deschis de ${lfg.hostTag}` });
}

export function lfgButtons(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('lfg:join').setLabel('Mă bag').setEmoji('🎮').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId('lfg:leave').setLabel('Ies').setEmoji('🚪').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('lfg:close').setLabel('Închide').setEmoji('🔒').setStyle(ButtonStyle.Danger).setDisabled(disabled),
  );
}

export async function handleLfg(interaction) {
  const action = interaction.customId.split(':')[1];
  const key = `${interaction.guild.id}.${interaction.message.id}`;
  const lfg = db.get('lfg', key);
  if (!lfg) return fail(interaction, 'Grupul asta nu mai e activ.');

  if (action === 'close') {
    if (interaction.user.id !== lfg.hostId && !isStaff(interaction.member)) {
      return fail(interaction, 'Doar cel care a deschis grupul il poate inchide.');
    }
    db.delete('lfg', key);
    return interaction.update({ embeds: [lfgEmbed(lfg).setFooter({ text: 'Grup închis.' })], components: [lfgButtons(true)] });
  }

  const id = interaction.user.id;
  if (action === 'join') {
    if (lfg.players.includes(id)) return fail(interaction, 'Esti deja in party.');
    if (lfg.players.length >= lfg.slots) return fail(interaction, 'Party-ul e plin.');
    lfg.players.push(id);
  } else {
    lfg.players = lfg.players.filter((p) => p !== id);
  }
  db.set('lfg', key, lfg);
  return interaction.update({ embeds: [lfgEmbed(lfg)], components: [lfgButtons()] });
}
