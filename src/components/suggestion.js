import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { embeds, fail } from '../lib/embeds.js';
import { db } from '../lib/db.js';
import { isStaff } from '../lib/permissions.js';
import { COLORS } from '../config/config.js';

export function suggestionEmbed(s) {
  const score = s.up.length - s.down.length;
  const color = s.status === 'approved' ? COLORS.success
    : s.status === 'denied' ? COLORS.danger
      : score > 0 ? COLORS.diamond : COLORS.neutral;

  const embed = embeds
    .custom(color)
    .setTitle('💡 Sugestie')
    .setAuthor({ name: s.authorTag, iconURL: s.authorAvatar })
    .setDescription(s.text)
    .addFields(
      { name: '👍 Pentru', value: `**${s.up.length}**`, inline: true },
      { name: '👎 Împotrivă', value: `**${s.down.length}**`, inline: true },
      { name: '📊 Scor', value: `**${score > 0 ? '+' : ''}${score}**`, inline: true },
    );
  if (s.status !== 'pending') {
    embed.addFields({
      name: s.status === 'approved' ? '✅ Aprobată' : '❌ Respinsă',
      value: `${s.reason || 'fara motiv'}\n— <@${s.decidedBy}>`,
    });
  }
  return embed;
}

export function suggestionButtons(s, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('suggest:up').setLabel(String(s.up.length)).setEmoji('👍').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId('suggest:down').setLabel(String(s.down.length)).setEmoji('👎').setStyle(ButtonStyle.Danger).setDisabled(disabled),
    new ButtonBuilder().setCustomId('suggest:approve').setLabel('Aprobă').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('suggest:deny').setLabel('Respinge').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
  );
}

export async function handleSuggestion(interaction) {
  const action = interaction.customId.split(':')[1];
  const key = `${interaction.guild.id}.${interaction.message.id}`;
  const s = db.get('suggestions', key);
  if (!s) return fail(interaction, 'Sugestia asta nu mai e in evidenta.');

  if (action === 'approve' || action === 'deny') {
    if (!isStaff(interaction.member)) return fail(interaction, 'Doar staff-ul poate decide sugestiile.');
    s.status = action === 'approve' ? 'approved' : 'denied';
    s.decidedBy = interaction.user.id;
    db.set('suggestions', key, s);
    return interaction.update({ embeds: [suggestionEmbed(s)], components: [suggestionButtons(s, true)] });
  }

  const id = interaction.user.id;
  s.up = s.up.filter((u) => u !== id);
  s.down = s.down.filter((u) => u !== id);
  if (action === 'up') s.up.push(id);
  else s.down.push(id);
  db.set('suggestions', key, s);
  return interaction.update({ embeds: [suggestionEmbed(s)], components: [suggestionButtons(s)] });
}
