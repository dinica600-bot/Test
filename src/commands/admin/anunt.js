import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { COLORS, config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('anunt')
    .setDescription('Trimite un anunț oficial într-un canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addStringOption((o) => o.setName('titlu').setDescription('Titlul anunțului').setRequired(true).setMaxLength(240))
    .addStringOption((o) => o.setName('text').setDescription('Textul (folosește \\n pentru rând nou)').setRequired(true).setMaxLength(3500))
    .addChannelOption((o) => o.setName('canal').setDescription('Unde (implicit: aici)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addRoleOption((o) => o.setName('ping').setDescription('Rol de menționat'))
    .addStringOption((o) => o.setName('imagine').setDescription('Link către o imagine'))
    .addStringOption((o) => o.setName('culoare').setDescription('Culoarea embed-ului').addChoices(
      { name: '🩸 Roșu Blood', value: 'primary' },
      { name: '💎 Albastru Diamond', value: 'diamond' },
      { name: '🏆 Auriu', value: 'gold' },
      { name: '✅ Verde', value: 'success' },
      { name: '⚠️ Portocaliu', value: 'warning' },
    )),

  staffOnly: true,

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal') ?? interaction.channel;
    const role = interaction.options.getRole('ping');
    const color = COLORS[interaction.options.getString('culoare') ?? 'primary'];

    const embed = embeds
      .custom(color)
      .setTitle(interaction.options.getString('titlu'))
      .setDescription(interaction.options.getString('text').replace(/\\n/g, '\n'))
      .setAuthor({ name: `${config.squadName} • anunț oficial`, iconURL: interaction.guild.iconURL() ?? undefined })
      .setFooter({ text: `Postat de ${interaction.user.tag}` });

    const image = interaction.options.getString('imagine');
    if (image) embed.setImage(image);

    const msg = await channel.send({
      content: role ? `${role}` : undefined,
      embeds: [embed],
      allowedMentions: { roles: role ? [role.id] : [] },
    });

    if (channel.type === ChannelType.GuildAnnouncement) await msg.crosspost().catch(() => {});

    return interaction.reply({
      embeds: [embeds.success(`Anunț trimis in ${channel}.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
