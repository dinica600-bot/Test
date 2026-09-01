import { SlashCommandBuilder } from 'discord.js';
import { embeds, progressBar } from '../../lib/embeds.js';
import { getUser, xpForNext, rankOf } from '../../lib/leveling.js';
import { ROLES } from '../../config/blueprint.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Nivelul tău pe server')
    .setDMPermission(false)
    .addUserOption((o) => o.setName('membru').setDescription('Al cui nivel')),

  cooldown: 5,

  async execute(interaction) {
    const user = interaction.options.getUser('membru') ?? interaction.user;
    const data = getUser(interaction.guild.id, user.id);
    const need = xpForNext(data.level);
    const position = rankOf(interaction.guild.id, user.id);

    const next = ROLES.filter((r) => r.group === 'level' && r.level > data.level)
      .sort((a, b) => a.level - b.level)[0];

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.gold)
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
          .setTitle(`⭐ Nivel ${data.level}`)
          .setDescription(
            `${progressBar(data.xp, need, 16)}\n**${data.xp} / ${need} XP** până la nivelul ${data.level + 1}`,
          )
          .addFields(
            { name: '🏆 Poziție', value: position.of ? `**#${position.position}** din ${position.of}` : 'neclasat', inline: true },
            { name: '💬 Mesaje', value: `**${data.messages ?? 0}**`, inline: true },
            { name: '🔊 Voice', value: `**${Math.round((data.voice ?? 0) / 60)}h ${(data.voice ?? 0) % 60}m**`, inline: true },
            ...(next ? [{ name: '🎯 Următoarea recompensă', value: `**${next.name}** la nivelul ${next.level}` }] : []),
          )
          .setThumbnail(user.displayAvatarURL({ size: 256 })),
      ],
    });
  },
};
