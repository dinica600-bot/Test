import { SlashCommandBuilder } from 'discord.js';
import { db } from '../../lib/db.js';
import { lfgEmbed, lfgButtons } from '../../components/scrim.js';
import { getRole } from '../../lib/guildMap.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lfg')
    .setDescription('Caută coechipieri pentru un party')
    .addStringOption((o) => o.setName('mod').setDescription('Ce jucați').setRequired(true).addChoices(
      { name: '🏆 Ranked', value: 'Ranked' },
      { name: '🎮 Classic', value: 'Classic' },
      { name: '🔥 Brawl', value: 'Brawl' },
      { name: '🎯 Custom / Scrim intern', value: 'Custom' },
      { name: '🎪 Mode-uri speciale', value: 'Special' },
    ))
    .addStringOption((o) => o.setName('rank').setDescription('Rank minim cerut').setMaxLength(40))
    .addIntegerOption((o) => o.setName('locuri').setDescription('Câți jucători în total (2-5)').setMinValue(2).setMaxValue(5))
    .addStringOption((o) => o.setName('detalii').setDescription('Alte detalii').setMaxLength(200)),

  cooldown: 15,

  async execute(interaction) {
    const lfg = {
      mode: interaction.options.getString('mod'),
      rank: interaction.options.getString('rank') ?? 'oricare',
      slots: interaction.options.getInteger('locuri') ?? 5,
      notes: interaction.options.getString('detalii') ?? null,
      hostId: interaction.user.id,
      hostTag: interaction.user.tag,
      players: [interaction.user.id],
    };

    const ping = getRole(interaction.guild, 'ping_lfg');
    await interaction.reply({
      content: ping ? `${ping}` : undefined,
      embeds: [lfgEmbed(lfg)],
      components: [lfgButtons()],
      allowedMentions: { roles: ping ? [ping.id] : [] },
    });
    const message = await interaction.fetchReply();
    db.set('lfg', `${interaction.guild.id}.${message.id}`, lfg);
    return null;
  },
};
