import { SlashCommandBuilder } from 'discord.js';
import { embeds, ts } from '../../lib/embeds.js';
import { getUser } from '../../lib/leveling.js';
import { db } from '../../lib/db.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Informații despre un membru')
    .setDMPermission(false)
    .addUserOption((o) => o.setName('membru').setDescription('Despre cine')),

  cooldown: 5,

  async execute(interaction) {
    const user = interaction.options.getUser('membru') ?? interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const level = getUser(interaction.guild.id, user.id);
    const warns = db.get('warns', `${interaction.guild.id}.${user.id}`, []);

    const embed = embeds
      .custom(member?.displayColor || COLORS.info)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 512 }))
      .addFields(
        { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
        { name: '📅 Cont creat', value: ts(user.createdAt, 'D'), inline: true },
        { name: '📥 A intrat', value: member?.joinedAt ? ts(member.joinedAt, 'D') : '—', inline: true },
        { name: '⭐ Nivel', value: `**${level.level}** (${level.messages ?? 0} mesaje)`, inline: true },
        { name: '⚠️ Avertismente', value: `**${warns.length}**`, inline: true },
        { name: '🔇 Timeout', value: member?.isCommunicationDisabled?.() ? `până ${ts(member.communicationDisabledUntil)}` : 'nu', inline: true },
      );

    if (member) {
      const roles = member.roles.cache.filter((r) => r.name !== '@everyone')
        .sort((a, b) => b.position - a.position);
      embed.addFields({
        name: `🎭 Roluri (${roles.size})`,
        value: roles.map((r) => `${r}`).join(' ').slice(0, 1000) || '—',
      });
      if (member.premiumSince) embed.addFields({ name: '🚀 Boostează de', value: ts(member.premiumSince), inline: true });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
