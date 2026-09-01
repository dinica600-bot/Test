import { SlashCommandBuilder } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { HEROES, findHero, BUILD_TEMPLATES, ROLE_EMOJI } from '../../data/heroes.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('build')
    .setDescription('Build, emblemă și spell recomandat')
    .addStringOption((o) => o.setName('erou').setDescription('Pentru ce erou').setRequired(true).setAutocomplete(true)),

  cooldown: 2,

  async autocomplete(interaction) {
    const q = interaction.options.getFocused().toLowerCase();
    return interaction.respond(
      HEROES.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 25)
        .map((h) => ({ name: `${ROLE_EMOJI[h.role]} ${h.name}`, value: h.name })),
    );
  },

  async execute(interaction) {
    const hero = findHero(interaction.options.getString('erou'));
    if (!hero) return interaction.reply({ embeds: [embeds.error('Nu gasesc eroul asta.')], flags: 64 });
    const build = BUILD_TEMPLATES[hero.role];

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.info)
          .setTitle(`🛠️ Build — ${ROLE_EMOJI[hero.role]} ${hero.name}`)
          .setDescription(`Punct de plecare pentru un **${hero.role}**. Adapteaza itemii la comp-ul inamic.`)
          .addFields(
            { name: 'Itemi (în ordine)', value: build.items.map((it, i) => `\`${i + 1}.\` ${it}`).join('\n') },
            { name: 'Emblemă', value: build.emblem, inline: true },
            { name: 'Battle Spell', value: build.spell, inline: true },
            { name: '🧠 Cum îl joci', value: build.tip },
            {
              name: '⚠️ Ai grijă de',
              value: hero.counters?.join(', ') || '—',
            },
          )
          .setFooter({ text: 'Anti-heal: Sea Halberd / Necklace of Durance • Anti-tank: Malefic Roar / Divine Glaive' }),
      ],
    });
  },
};
