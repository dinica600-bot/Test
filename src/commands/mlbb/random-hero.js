import { SlashCommandBuilder } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { heroesBy, ROLE_EMOJI, LANE_LABEL, BUILD_TEMPLATES } from '../../data/heroes.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('random-hero')
    .setDescription('Îți alege botul un erou (pentru pariuri sau challenge-uri)')
    .addStringOption((o) => o.setName('rol').setDescription('Filtrează după rol').addChoices(
      { name: '🛡️ Tank', value: 'Tank' },
      { name: '⚔️ Fighter', value: 'Fighter' },
      { name: '🗡️ Assassin', value: 'Assassin' },
      { name: '🔮 Mage', value: 'Mage' },
      { name: '🏹 Marksman', value: 'Marksman' },
      { name: '💚 Support', value: 'Support' },
    ))
    .addStringOption((o) => o.setName('lane').setDescription('Filtrează după lane').addChoices(
      { name: '🥇 Gold Lane', value: 'gold' },
      { name: '🛡️ EXP Lane', value: 'exp' },
      { name: '🔮 Mid Lane', value: 'mid' },
      { name: '🌲 Jungle', value: 'jungle' },
      { name: '🧿 Roam', value: 'roam' },
    )),

  cooldown: 3,

  async execute(interaction) {
    const role = interaction.options.getString('rol');
    const lane = interaction.options.getString('lane');
    const pool = heroesBy({ role, lane });

    if (!pool.length) {
      return interaction.reply({ embeds: [embeds.error('Nu am niciun erou cu filtrele astea.')], flags: 64 });
    }

    const hero = pool[Math.floor(Math.random() * pool.length)];
    const build = BUILD_TEMPLATES[hero.role];

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.gold)
          .setTitle(`🎲 ${ROLE_EMOJI[hero.role]} ${hero.name}`)
          .setDescription(`Asta joci! Fara reroll, fara scuze. 😈`)
          .addFields(
            { name: 'Rol', value: hero.role, inline: true },
            { name: 'Dificultate', value: hero.diff, inline: true },
            { name: 'Lane', value: hero.lanes.map((l) => LANE_LABEL[l]).join(', '), inline: true },
            { name: 'Spell recomandat', value: build?.spell ?? '—' },
          )
          .setFooter({ text: `Ales din ${pool.length} eroi` }),
      ],
    });
  },
};
