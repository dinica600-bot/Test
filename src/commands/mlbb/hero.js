import { SlashCommandBuilder } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { HEROES, findHero, counteredBy, ROLE_EMOJI, LANE_LABEL, BUILD_TEMPLATES } from '../../data/heroes.js';
import { COLORS } from '../../config/config.js';

const ROLE_COLOR = {
  Tank: 0x8d99ae, Fighter: 0xe76f51, Assassin: 0x6d28d9,
  Mage: 0x38bdf8, Marksman: 0xf59e0b, Support: 0x22c55e,
};

export default {
  data: new SlashCommandBuilder()
    .setName('hero')
    .setDescription('Informații despre un erou din Mobile Legends')
    .addStringOption((o) => o
      .setName('nume')
      .setDescription('Numele eroului')
      .setRequired(true)
      .setAutocomplete(true)),

  cooldown: 2,

  async autocomplete(interaction) {
    const q = interaction.options.getFocused().toLowerCase();
    const matches = HEROES
      .filter((h) => h.name.toLowerCase().includes(q))
      .slice(0, 25)
      .map((h) => ({ name: `${ROLE_EMOJI[h.role]} ${h.name} — ${h.role}`, value: h.name }));
    return interaction.respond(matches);
  },

  async execute(interaction) {
    const hero = findHero(interaction.options.getString('nume'));
    if (!hero) {
      return interaction.reply({
        embeds: [embeds.error('Nu gasesc eroul asta. Scrie primele litere si alege din lista de sugestii.')],
        flags: 64,
      });
    }

    const build = BUILD_TEMPLATES[hero.role];
    const beats = counteredBy(hero);

    const embed = embeds
      .custom(ROLE_COLOR[hero.role] ?? COLORS.primary)
      .setTitle(`${ROLE_EMOJI[hero.role]} ${hero.name}`)
      .addFields(
        { name: 'Rol', value: hero.role, inline: true },
        { name: 'Dificultate', value: hero.diff, inline: true },
        { name: 'Lane', value: hero.lanes.map((l) => LANE_LABEL[l]).join('\n'), inline: true },
        { name: '⛔ Îl contrează', value: hero.counters?.join(', ') || '_—_', inline: false },
        { name: '✅ El contrează', value: beats.length ? beats.slice(0, 12).join(', ') : '_—_', inline: false },
      );

    if (build) {
      embed.addFields(
        { name: '🛠️ Build recomandat', value: build.items.map((i) => `• ${i}`).join('\n'), inline: true },
        { name: '💠 Emblemă & Spell', value: `**Emblemă:** ${build.emblem}\n**Spell:** ${build.spell}`, inline: true },
        { name: '🧠 Tip', value: build.tip },
      );
    }

    return interaction.reply({ embeds: [embed] });
  },
};
