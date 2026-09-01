import { SlashCommandBuilder } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { HEROES, findHero, counteredBy, ROLE_EMOJI } from '../../data/heroes.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('counter')
    .setDescription('Ce erou să iei împotriva unui erou inamic')
    .addStringOption((o) => o.setName('inamic').setDescription('Eroul inamic').setRequired(true).setAutocomplete(true)),

  cooldown: 2,

  async autocomplete(interaction) {
    const q = interaction.options.getFocused().toLowerCase();
    return interaction.respond(
      HEROES.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 25)
        .map((h) => ({ name: `${ROLE_EMOJI[h.role]} ${h.name}`, value: h.name })),
    );
  },

  async execute(interaction) {
    const hero = findHero(interaction.options.getString('inamic'));
    if (!hero) return interaction.reply({ embeds: [embeds.error('Nu gasesc eroul asta.')], flags: 64 });

    const picks = hero.counters ?? [];
    const details = picks
      .map((name) => HEROES.find((h) => h.name === name))
      .filter(Boolean)
      .map((h) => `${ROLE_EMOJI[h.role]} **${h.name}** — ${h.role} (${h.lanes.join('/')})`);

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.diamond)
          .setTitle(`⛔ Counter pentru ${hero.name}`)
          .setDescription(
            details.length
              ? `Ia unul din astia impotriva lui **${hero.name}**:\n\n${details.join('\n')}`
              : `Nu am counter-e salvate pentru **${hero.name}**. Adauga-le in \`src/data/heroes.js\`.`,
          )
          .addFields({
            name: `⚠️ ${hero.name} e bun împotriva lui`,
            value: counteredBy(hero).slice(0, 12).join(', ') || '_—_',
          })
          .setFooter({ text: 'Counter-ul e doar jumatate din poveste — conteaza si rotatiile.' }),
      ],
    });
  },
};
