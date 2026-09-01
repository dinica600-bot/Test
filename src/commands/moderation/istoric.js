import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds, ts } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { COLORS } from '../../config/config.js';

const ICON = { ban: '🔨', kick: '👢', timeout: '🔇', warn: '⚠️' };

export default {
  data: new SlashCommandBuilder()
    .setName('istoric')
    .setDescription('Istoricul de moderare al unui membru')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((o) => o.setName('membru').setDescription('Cine').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('membru');
    const actions = db.get('modlog', `${interaction.guild.id}.${user.id}`, []);
    const warns = db.get('warns', `${interaction.guild.id}.${user.id}`, []);

    const all = [
      ...actions,
      ...warns.map((w) => ({ ...w, type: 'warn' })),
    ].sort((a, b) => b.at - a.at).slice(0, 15);

    return interaction.reply({
      embeds: [
        embeds.custom(all.length ? COLORS.warning : COLORS.success)
          .setTitle(`📋 Istoric moderare — ${user.tag}`)
          .setThumbnail(user.displayAvatarURL())
          .setDescription(
            all.length
              ? all.map((a) => `${ICON[a.type] ?? '•'} **${a.type}** — ${a.reason}\n└ de <@${a.by}> • ${ts(a.at)}`).join('\n\n').slice(0, 3900)
              : 'Cazier curat. 👏',
          )
          .setFooter({ text: `${warns.length} avertismente active • ${actions.length} acțiuni de moderare` }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
