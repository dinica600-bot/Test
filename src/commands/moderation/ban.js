import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { canActOn } from '../../lib/permissions.js';
import { modLog } from '../../lib/logger.js';
import { db } from '../../lib/db.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banează un membru de pe server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addUserOption((o) => o.setName('membru').setDescription('Pe cine').setRequired(true))
    .addStringOption((o) => o.setName('motiv').setDescription('De ce').setMaxLength(400))
    .addIntegerOption((o) => o.setName('sterge_zile').setDescription('Șterge mesajele din ultimele X zile').setMinValue(0).setMaxValue(7)),

  async execute(interaction) {
    const user = interaction.options.getUser('membru');
    const reason = interaction.options.getString('motiv') ?? 'Fără motiv specificat';
    const days = interaction.options.getInteger('sterge_zile') ?? 0;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member) {
      const error = canActOn(interaction.member, member);
      if (error) return interaction.reply({ embeds: [embeds.error(error)], flags: MessageFlags.Ephemeral });
      await member.send({
        embeds: [embeds.custom(COLORS.danger).setTitle(`🔨 Ai fost banat de pe ${interaction.guild.name}`).setDescription(`**Motiv:** ${reason}`)],
      }).catch(() => {});
    }

    try {
      await interaction.guild.bans.create(user.id, {
        reason: `${reason} • de ${interaction.user.tag}`,
        deleteMessageSeconds: days * 86400,
      });
    } catch (err) {
      return interaction.reply({ embeds: [embeds.error(`Nu am putut da ban: ${err.message}`)], flags: MessageFlags.Ephemeral });
    }

    db.push('modlog', `${interaction.guild.id}.${user.id}`, {
      type: 'ban', reason, by: interaction.user.id, at: Date.now(),
    });
    await modLog(interaction.guild, { action: 'Ban', target: user, moderator: interaction.user, reason });

    return interaction.reply({
      embeds: [embeds.custom(COLORS.danger).setDescription(`🔨 **${user.tag}** a fost banat.\n**Motiv:** ${reason}`)],
    });
  },
};
