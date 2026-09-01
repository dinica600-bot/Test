import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('spune')
    .setDescription('Botul scrie un mesaj în numele serverului')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addStringOption((o) => o.setName('text').setDescription('Ce să scriu').setRequired(true).setMaxLength(1900))
    .addChannelOption((o) => o.setName('canal').setDescription('Unde (implicit: aici)').addChannelTypes(ChannelType.GuildText))
    .addStringOption((o) => o.setName('raspunde_la').setDescription('ID-ul unui mesaj la care să răspund')),

  staffOnly: true,

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal') ?? interaction.channel;
    const text = interaction.options.getString('text').replace(/\\n/g, '\n');
    const replyTo = interaction.options.getString('raspunde_la');

    await channel.send({
      content: text,
      reply: replyTo ? { messageReference: replyTo, failIfNotExists: false } : undefined,
      allowedMentions: { parse: ['users'] },
    });

    return interaction.reply({ embeds: [embeds.success('Trimis.')], flags: MessageFlags.Ephemeral });
  },
};
