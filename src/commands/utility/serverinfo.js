import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { embeds, ts } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { COLORS, config } from '../../config/config.js';

const LEVELS = ['fără boost', 'Nivel 1', 'Nivel 2', 'Nivel 3'];

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Informații despre server')
    .setDMPermission(false),

  cooldown: 10,

  async execute(interaction) {
    const { guild } = interaction;
    await guild.members.fetch().catch(() => {});

    const channels = guild.channels.cache;
    const text = channels.filter((c) => c.type === ChannelType.GuildText).size;
    const voice = channels.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = channels.filter((c) => c.type === ChannelType.GuildCategory).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const online = guild.members.cache.filter((m) => m.presence && m.presence.status !== 'offline').size;
    const results = db.get('results', guild.id, []);
    const wins = results.filter((r) => r.type === 'win').length;

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.primary)
          .setTitle(`🩸 ${guild.name}`)
          .setDescription(guild.description ?? `Serverul oficial ${config.squadName}.`)
          .setThumbnail(guild.iconURL({ size: 512 }))
          .setImage(guild.bannerURL({ size: 1024 }) ?? null)
          .addFields(
            { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
            { name: '📅 Creat', value: ts(guild.createdAt, 'D'), inline: true },
            { name: '🆔 ID', value: `\`${guild.id}\``, inline: true },
            { name: '👥 Membri', value: `**${guild.memberCount}**\n${online} online • ${bots} boți`, inline: true },
            { name: '💬 Canale', value: `**${text}** text\n**${voice}** voice • ${categories} categorii`, inline: true },
            { name: '🎭 Roluri', value: `**${guild.roles.cache.size}**`, inline: true },
            { name: '🚀 Boost', value: `${LEVELS[guild.premiumTier]} (${guild.premiumSubscriptionCount ?? 0})`, inline: true },
            { name: '😀 Emoji', value: `**${guild.emojis.cache.size}**`, inline: true },
            { name: '🏆 Meciuri câștigate', value: `**${wins}** din ${results.length}`, inline: true },
          )
          .setFooter({ text: `${config.squadName} • ${config.squadTag}` }),
      ],
    });
  },
};
