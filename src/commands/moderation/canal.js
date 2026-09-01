import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { modLog } from '../../lib/logger.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('canal')
    .setDescription('Control rapid pe canal (lock, slowmode, ascundere)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('blocheaza')
      .setDescription('Nimeni nu mai poate scrie')
      .addChannelOption((o) => o.setName('canal').setDescription('Care canal').addChannelTypes(ChannelType.GuildText))
      .addStringOption((o) => o.setName('motiv').setDescription('De ce')))
    .addSubcommand((s) => s
      .setName('deblocheaza')
      .setDescription('Se poate scrie din nou')
      .addChannelOption((o) => o.setName('canal').setDescription('Care canal').addChannelTypes(ChannelType.GuildText)))
    .addSubcommand((s) => s
      .setName('slowmode')
      .setDescription('Setează întârzierea între mesaje')
      .addIntegerOption((o) => o.setName('secunde').setDescription('0 = oprit').setRequired(true).setMinValue(0).setMaxValue(21600))
      .addChannelOption((o) => o.setName('canal').setDescription('Care canal').addChannelTypes(ChannelType.GuildText))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('canal') ?? interaction.channel;
    const everyone = interaction.guild.roles.everyone;

    if (sub === 'slowmode') {
      const seconds = interaction.options.getInteger('secunde');
      await channel.setRateLimitPerUser(seconds, `Slowmode de ${interaction.user.tag}`);
      return interaction.reply({
        embeds: [embeds.success(seconds ? `Slowmode setat la **${seconds}s** in ${channel}.` : `Am oprit slowmode-ul in ${channel}.`)],
      });
    }

    const lock = sub === 'blocheaza';
    const motiv = interaction.options.getString('motiv') ?? 'Fără motiv specificat';

    await channel.permissionOverwrites.edit(everyone, {
      SendMessages: lock ? false : null,
      AddReactions: lock ? false : null,
      CreatePublicThreads: lock ? false : null,
    }, { reason: `${motiv} • ${interaction.user.tag}` });

    await modLog(interaction.guild, {
      action: lock ? 'Canal blocat' : 'Canal deblocat', target: null,
      moderator: interaction.user, reason: `${channel} — ${motiv}`,
      color: lock ? COLORS.danger : COLORS.success,
    });

    if (channel.id !== interaction.channel.id) {
      await interaction.reply({
        embeds: [embeds.success(`${lock ? '🔒 Am blocat' : '🔓 Am deblocat'} ${channel}.`)],
        flags: MessageFlags.Ephemeral,
      });
      await channel.send({
        embeds: [embeds.custom(lock ? COLORS.danger : COLORS.success)
          .setDescription(lock ? `🔒 **Canal blocat.**\n${motiv}` : '🔓 **Canal deblocat.** Puteti scrie din nou.')],
      }).catch(() => {});
      return null;
    }

    return interaction.reply({
      embeds: [embeds.custom(lock ? COLORS.danger : COLORS.success)
        .setDescription(lock ? `🔒 **Canal blocat.**\n${motiv}` : '🔓 **Canal deblocat.** Puteti scrie din nou.')],
    });
  },
};
