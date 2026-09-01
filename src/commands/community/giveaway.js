import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { giveawayEmbed, giveawayButtons, endGiveaway } from '../../components/giveaway.js';
import { getRole } from '../../lib/guildMap.js';

const DURATIONS = [
  { name: '10 minute', value: 10 },
  { name: '30 minute', value: 30 },
  { name: '1 oră', value: 60 },
  { name: '6 ore', value: 360 },
  { name: '12 ore', value: 720 },
  { name: '1 zi', value: 1440 },
  { name: '3 zile', value: 4320 },
  { name: '1 săptămână', value: 10080 },
];

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Organizează un giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('start')
      .setDescription('Pornește un giveaway')
      .addStringOption((o) => o.setName('premiu').setDescription('Ce se câștigă').setRequired(true).setMaxLength(200))
      .addIntegerOption((o) => o.setName('durata').setDescription('Cât ține').setRequired(true).addChoices(...DURATIONS))
      .addIntegerOption((o) => o.setName('castigatori').setDescription('Câți câștigători (implicit 1)').setMinValue(1).setMaxValue(20))
      .addRoleOption((o) => o.setName('rol_necesar').setDescription('Doar cei cu rolul ăsta pot participa'))
      .addChannelOption((o) => o.setName('canal').setDescription('Unde îl postez').addChannelTypes(ChannelType.GuildText)))
    .addSubcommand((s) => s
      .setName('incheie')
      .setDescription('Încheie un giveaway mai devreme')
      .addStringOption((o) => o.setName('mesaj_id').setDescription('ID-ul mesajului de giveaway').setRequired(true)))
    .addSubcommand((s) => s
      .setName('reroll')
      .setDescription('Extrage alt câștigător')
      .addStringOption((o) => o.setName('mesaj_id').setDescription('ID-ul mesajului de giveaway').setRequired(true))),

  staffOnly: true,

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub !== 'start') {
      const id = interaction.options.getString('mesaj_id');
      const g = db.get('giveaways', `${gid}.${id}`);
      if (!g) return interaction.reply({ embeds: [embeds.error('Nu gasesc giveaway-ul cu ID-ul asta.')], flags: MessageFlags.Ephemeral });
      const winners = await endGiveaway(client, gid, id, sub === 'reroll');
      return interaction.reply({
        embeds: [embeds.success(winners?.length ? `Castigatori: ${winners.map((w) => `<@${w}>`).join(', ')}` : 'Nu a participat nimeni.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const minutes = interaction.options.getInteger('durata');
    const channel = interaction.options.getChannel('canal') ?? interaction.channel;
    const required = interaction.options.getRole('rol_necesar');

    const g = {
      prize: interaction.options.getString('premiu'),
      winners: interaction.options.getInteger('castigatori') ?? 1,
      endsAt: Date.now() + minutes * 60_000,
      hostId: interaction.user.id,
      hostTag: interaction.user.tag,
      requiredRole: required?.id ?? null,
      channelId: channel.id,
      entries: [],
      ended: false,
    };

    const ping = getRole(interaction.guild, 'ping_giveaway');
    const message = await channel.send({
      content: ping ? `${ping}` : undefined,
      embeds: [giveawayEmbed(g)],
      components: [giveawayButtons(false, 0)],
      allowedMentions: { roles: ping ? [ping.id] : [] },
    });
    db.set('giveaways', `${gid}.${message.id}`, g);

    return interaction.reply({
      embeds: [embeds.success(`Giveaway pornit in ${channel}!\nID mesaj: \`${message.id}\` (pentru \`/giveaway incheie\`).`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
