import { SlashCommandBuilder } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { heroesBy, ROLE_EMOJI, LANE_LABEL } from '../../data/heroes.js';
import { COLORS, config } from '../../config/config.js';

const LANES = ['gold', 'exp', 'mid', 'jungle', 'roam'];

export default {
  data: new SlashCommandBuilder()
    .setName('comp')
    .setDescription('Generează o compoziție completă de 5 eroi (câte unul pe lane)')
    .addBooleanOption((o) => o.setName('meta').setDescription('Doar eroi ușor/mediu de jucat (fără main-uri grele)')),

  cooldown: 5,

  async execute(interaction) {
    const easy = interaction.options.getBoolean('meta');
    const used = new Set();
    const lineup = [];

    for (const lane of LANES) {
      let pool = heroesBy({ lane }).filter((h) => !used.has(h.name));
      if (easy) {
        const filtered = pool.filter((h) => h.diff === 'Ușor' || h.diff === 'Mediu');
        if (filtered.length) pool = filtered;
      }
      const hero = pool[Math.floor(Math.random() * pool.length)];
      if (hero) { used.add(hero.name); lineup.push({ lane, hero }); }
    }

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.diamond)
          .setTitle('🧩 Compoziție generată')
          .setDescription(`Line-up random pentru **${config.squadName}**. Impartiti-va lane-urile si la treaba!`)
          .addFields(lineup.map(({ lane, hero }) => ({
            name: LANE_LABEL[lane],
            value: `${ROLE_EMOJI[hero.role]} **${hero.name}**\n_${hero.role} • ${hero.diff}_`,
            inline: true,
          })))
          .setFooter({ text: 'Nu-ti place? Mai da o data /comp.' }),
      ],
    });
  },
};
