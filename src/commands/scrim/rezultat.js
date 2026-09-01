import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { getChannel } from '../../lib/guildMap.js';
import { COLORS, config } from '../../config/config.js';
import { e } from '../../lib/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rezultat')
    .setDescription('Înregistrează rezultatul unui meci')
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('adauga')
      .setDescription('Adaugă un rezultat')
      .addStringOption((o) => o.setName('adversar').setDescription('Cu cine am jucat').setRequired(true).setMaxLength(50))
      .addStringOption((o) => o.setName('scor').setDescription('Scorul, ex: 2-1').setRequired(true).setMaxLength(10))
      .addStringOption((o) => o.setName('tip').setDescription('Ce fel de meci').setRequired(true).addChoices(
        { name: '🏆 Victorie', value: 'win' },
        { name: '❌ Înfrângere', value: 'loss' },
        { name: '🤝 Egal', value: 'draw' },
      ))
      .addStringOption((o) => o.setName('competitie').setDescription('Scrim / turneu / oficial').setMaxLength(60))
      .addUserOption((o) => o.setName('mvp').setDescription('MVP-ul meciului'))
      .addStringOption((o) => o.setName('note').setDescription('Ce a mers / ce nu').setMaxLength(500)))
    .addSubcommand((s) => s.setName('statistici').setDescription('Bilanțul squad-ului')),

  staffOnly: false,
  cooldown: 5,

  async execute(interaction) {
    const gid = interaction.guild.id;

    if (interaction.options.getSubcommand() === 'statistici') {
      const results = db.get('results', gid, []);
      const wins = results.filter((r) => r.type === 'win').length;
      const losses = results.filter((r) => r.type === 'loss').length;
      const draws = results.filter((r) => r.type === 'draw').length;
      const total = results.length || 1;
      const wr = Math.round((wins / total) * 100);

      const mvps = {};
      for (const r of results) if (r.mvp) mvps[r.mvp] = (mvps[r.mvp] ?? 0) + 1;
      const topMvp = Object.entries(mvps).sort((a, b) => b[1] - a[1]).slice(0, 3);

      return interaction.reply({
        embeds: [
          embeds.custom(wr >= 50 ? COLORS.success : COLORS.warning)
            .setTitle(`📊 Bilanț ${config.squadName}`)
            .addFields(
              { name: `${e(interaction.guild, 'win')} Victorii`, value: `**${wins}**`, inline: true },
              { name: `${e(interaction.guild, 'loss')} Înfrângeri`, value: `**${losses}**`, inline: true },
              { name: '🤝 Egaluri', value: `**${draws}**`, inline: true },
              { name: '📈 Winrate', value: `**${wr}%** din ${results.length} meciuri` },
              {
                name: '⭐ Cei mai mulți MVP',
                value: topMvp.length
                  ? topMvp.map(([id, n], i) => `\`${i + 1}.\` <@${id}> — ${e(interaction.guild, 'mvp')} **${n}**`).join('\n')
                  : '_—_',
              },
              {
                name: '🕐 Ultimele meciuri',
                value: results.slice(-5).reverse()
                  .map((r) => `${r.type === 'win' ? e(interaction.guild, 'win') : r.type === 'loss' ? e(interaction.guild, 'loss') : '🟡'} vs **${r.opponent}** ${r.score}`)
                  .join('\n') || '_—_',
              },
            ),
        ],
      });
    }

    const result = {
      opponent: interaction.options.getString('adversar'),
      score: interaction.options.getString('scor'),
      type: interaction.options.getString('tip'),
      competition: interaction.options.getString('competitie') ?? 'Scrim',
      mvp: interaction.options.getUser('mvp')?.id ?? null,
      notes: interaction.options.getString('note'),
      by: interaction.user.id,
      at: Date.now(),
    };
    db.push('results', gid, result);

    const embed = embeds
      .custom(result.type === 'win' ? COLORS.success : result.type === 'loss' ? COLORS.danger : COLORS.warning)
      .setTitle(
        `${result.type === 'win' ? `${e(interaction.guild, 'win')} VICTORIE`
          : result.type === 'loss' ? `${e(interaction.guild, 'loss')} ÎNFRÂNGERE` : '🤝 EGAL'}`
        + ` — ${config.squadTag} ${result.score} ${result.opponent}`,
      )
      .addFields(
        { name: 'Competiție', value: result.competition, inline: true },
        { name: `${e(interaction.guild, 'mvp')} MVP`, value: result.mvp ? `<@${result.mvp}>` : '—', inline: true },
      );
    if (result.notes) embed.addFields({ name: '📝 Note', value: result.notes });

    const channel = getChannel(interaction.guild, 'results');
    if (channel?.isTextBased() && channel.id !== interaction.channel.id) {
      await channel.send({ embeds: [embed] }).catch(() => {});
      return interaction.reply({ embeds: [embeds.success(`Rezultat salvat si postat in ${channel}.`)], flags: MessageFlags.Ephemeral });
    }
    return interaction.reply({ embeds: [embed] });
  },
};
