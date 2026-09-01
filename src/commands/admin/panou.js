import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { verifyPanel, rulesEmbed } from '../../components/verify.js';
import { selfRolePanels } from '../../components/selfroles.js';
import { ticketPanel } from '../../components/tickets.js';
import { tryoutPanel } from '../../components/tryout.js';

export default {
  data: new SlashCommandBuilder()
    .setName('panou')
    .setDescription('Postează un panou interactiv într-un canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addStringOption((o) => o
      .setName('tip')
      .setDescription('Ce panou vrei')
      .setRequired(true)
      .addChoices(
        { name: '✅ Verificare', value: 'verify' },
        { name: '📜 Reguli', value: 'rules' },
        { name: '🎭 Self-roles', value: 'roles' },
        { name: '🎫 Tickete', value: 'ticket' },
        { name: '🎯 Tryout / aplicare', value: 'tryout' },
      ))
    .addChannelOption((o) => o
      .setName('canal')
      .setDescription('Unde îl postez (implicit: aici)')
      .addChannelTypes(ChannelType.GuildText)),

  staffOnly: true,

  async execute(interaction) {
    const type = interaction.options.getString('tip');
    const channel = interaction.options.getChannel('canal') ?? interaction.channel;

    const payloads = {
      verify: [verifyPanel()],
      rules: [{ embeds: [rulesEmbed()] }],
      roles: selfRolePanels(interaction.guild),
      ticket: [ticketPanel()],
      tryout: [tryoutPanel()],
    }[type];

    for (const payload of payloads) await channel.send(payload);

    return interaction.reply({
      embeds: [embeds.success(`Am postat panoul **${type}** in ${channel}.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
