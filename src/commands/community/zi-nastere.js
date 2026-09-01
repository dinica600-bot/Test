import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { COLORS } from '../../config/config.js';

const MONTHS = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];

export default {
  data: new SlashCommandBuilder()
    .setName('zi-nastere')
    .setDescription('Ziua ta de naștere pe server')
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('seteaza')
      .setDescription('Setează-ți ziua de naștere')
      .addIntegerOption((o) => o.setName('zi').setDescription('Ziua').setRequired(true).setMinValue(1).setMaxValue(31))
      .addIntegerOption((o) => o.setName('luna').setDescription('Luna').setRequired(true)
        .addChoices(...MONTHS.map((m, i) => ({ name: m, value: i + 1 })))))
    .addSubcommand((s) => s.setName('lista').setDescription('Cine urmează la zile de naștere'))
    .addSubcommand((s) => s.setName('sterge').setDescription('Șterge-ți ziua din listă')),

  cooldown: 5,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'seteaza') {
      const day = interaction.options.getInteger('zi');
      const month = interaction.options.getInteger('luna');
      db.set('birthdays', `${gid}.${interaction.user.id}`, { day, month });
      return interaction.reply({
        embeds: [embeds.success(`Am notat: **${day} ${MONTHS[month - 1]}**. Te anuntam noi in ziua aia! 🎂`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'sterge') {
      db.delete('birthdays', `${gid}.${interaction.user.id}`);
      return interaction.reply({ embeds: [embeds.success('Te-am scos din lista.')], flags: MessageFlags.Ephemeral });
    }

    const all = db.get('birthdays', gid, {});
    const today = new Date();
    const sorted = Object.entries(all)
      .map(([id, b]) => {
        const next = new Date(today.getFullYear(), b.month - 1, b.day);
        if (next < today.setHours(0, 0, 0, 0)) next.setFullYear(next.getFullYear() + 1);
        return { id, ...b, next };
      })
      .sort((a, b) => a.next - b.next)
      .slice(0, 15);

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.diamond)
          .setTitle('🎂 Zile de naștere')
          .setDescription(
            sorted.length
              ? sorted.map((b) => `<@${b.id}> — **${b.day} ${MONTHS[b.month - 1]}** (<t:${Math.floor(b.next.getTime() / 1000)}:R>)`).join('\n')
              : 'Nimeni nu si-a setat ziua inca. Foloseste `/zi-nastere seteaza`.',
          ),
      ],
    });
  },
};
