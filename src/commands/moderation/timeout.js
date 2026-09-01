import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { canActOn } from '../../lib/permissions.js';
import { modLog } from '../../lib/logger.js';
import { db } from '../../lib/db.js';
import { COLORS } from '../../config/config.js';

const DURATIONS = [
  { name: '60 secunde', value: 60 },
  { name: '5 minute', value: 300 },
  { name: '10 minute', value: 600 },
  { name: '1 oră', value: 3600 },
  { name: '6 ore', value: 21600 },
  { name: '1 zi', value: 86400 },
  { name: '1 săptămână', value: 604800 },
];

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Pune sau scoate timeout unui membru')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('da')
      .setDescription('Îl amuțește temporar')
      .addUserOption((o) => o.setName('membru').setDescription('Pe cine').setRequired(true))
      .addIntegerOption((o) => o.setName('durata').setDescription('Cât timp').setRequired(true).addChoices(...DURATIONS))
      .addStringOption((o) => o.setName('motiv').setDescription('De ce').setMaxLength(400)))
    .addSubcommand((s) => s
      .setName('scoate')
      .setDescription('Ridică timeout-ul')
      .addUserOption((o) => o.setName('membru').setDescription('Pe cine').setRequired(true))),

  async execute(interaction) {
    const member = interaction.options.getMember('membru');
    const error = canActOn(interaction.member, member);
    if (error) return interaction.reply({ embeds: [embeds.error(error)], flags: MessageFlags.Ephemeral });

    if (interaction.options.getSubcommand() === 'scoate') {
      await member.timeout(null, `Timeout ridicat de ${interaction.user.tag}`);
      await modLog(interaction.guild, {
        action: 'Timeout ridicat', target: member.user, moderator: interaction.user,
        reason: '—', color: COLORS.success,
      });
      return interaction.reply({ embeds: [embeds.success(`**${member.user.tag}** poate vorbi din nou.`)] });
    }

    const seconds = interaction.options.getInteger('durata');
    const reason = interaction.options.getString('motiv') ?? 'Fără motiv specificat';
    const label = DURATIONS.find((d) => d.value === seconds)?.name ?? `${seconds}s`;

    await member.timeout(seconds * 1000, `${reason} • de ${interaction.user.tag}`);
    db.push('modlog', `${interaction.guild.id}.${member.id}`, {
      type: 'timeout', reason, duration: seconds, by: interaction.user.id, at: Date.now(),
    });
    await member.send({
      embeds: [embeds.custom(COLORS.warning)
        .setTitle(`🔇 Ai primit timeout pe ${interaction.guild.name}`)
        .setDescription(`**Durată:** ${label}\n**Motiv:** ${reason}`)],
    }).catch(() => {});
    await modLog(interaction.guild, {
      action: 'Timeout', target: member.user, moderator: interaction.user, reason,
      extra: `Durată: **${label}**`, color: COLORS.warning,
    });

    return interaction.reply({
      embeds: [embeds.custom(COLORS.warning).setDescription(`🔇 **${member.user.tag}** are timeout **${label}**.\n**Motiv:** ${reason}`)],
    });
  },
};
