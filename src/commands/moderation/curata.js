import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { modLog } from '../../lib/logger.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('curata')
    .setDescription('Șterge mesaje din canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addIntegerOption((o) => o.setName('cate').setDescription('Câte mesaje (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('membru').setDescription('Doar mesajele acestui membru'))
    .addBooleanOption((o) => o.setName('doar_boti').setDescription('Doar mesajele boților')),

  async execute(interaction) {
    const amount = interaction.options.getInteger('cate');
    const user = interaction.options.getUser('membru');
    const botsOnly = interaction.options.getBoolean('doar_boti');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    let filtered = [...messages.values()]
      .filter((m) => Date.now() - m.createdTimestamp < 14 * 86400 * 1000);
    if (user) filtered = filtered.filter((m) => m.author.id === user.id);
    if (botsOnly) filtered = filtered.filter((m) => m.author.bot);
    filtered = filtered.slice(0, amount);

    if (!filtered.length) {
      return interaction.editReply({ embeds: [embeds.error('Nu am gasit mesaje de sters (cele mai vechi de 14 zile nu se pot sterge in masa).')] });
    }

    const deleted = await interaction.channel.bulkDelete(filtered, true);
    await modLog(interaction.guild, {
      action: 'Curățare mesaje', target: user ?? null, moderator: interaction.user,
      reason: `${deleted.size} mesaje in #${interaction.channel.name}`, color: COLORS.info,
    });

    return interaction.editReply({ embeds: [embeds.success(`Am sters **${deleted.size}** mesaje.`)] });
  },
};
