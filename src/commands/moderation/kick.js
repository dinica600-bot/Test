import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { canActOn } from '../../lib/permissions.js';
import { modLog } from '../../lib/logger.js';
import { db } from '../../lib/db.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Dă afară un membru (poate reveni cu invitație)')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false)
    .addUserOption((o) => o.setName('membru').setDescription('Pe cine').setRequired(true))
    .addStringOption((o) => o.setName('motiv').setDescription('De ce').setMaxLength(400)),

  async execute(interaction) {
    const member = interaction.options.getMember('membru');
    const reason = interaction.options.getString('motiv') ?? 'Fără motiv specificat';

    const error = canActOn(interaction.member, member);
    if (error) return interaction.reply({ embeds: [embeds.error(error)], flags: MessageFlags.Ephemeral });

    await member.send({
      embeds: [embeds.custom(COLORS.warning).setTitle(`👢 Ai fost dat afară de pe ${interaction.guild.name}`).setDescription(`**Motiv:** ${reason}`)],
    }).catch(() => {});

    await member.kick(`${reason} • de ${interaction.user.tag}`);
    db.push('modlog', `${interaction.guild.id}.${member.id}`, {
      type: 'kick', reason, by: interaction.user.id, at: Date.now(),
    });
    await modLog(interaction.guild, {
      action: 'Kick', target: member.user, moderator: interaction.user, reason, color: COLORS.warning,
    });

    return interaction.reply({
      embeds: [embeds.custom(COLORS.warning).setDescription(`👢 **${member.user.tag}** a fost dat afară.\n**Motiv:** ${reason}`)],
    });
  },
};
