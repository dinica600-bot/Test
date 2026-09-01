import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { getUser, rankOf } from '../../lib/leveling.js';
import { COLORS } from '../../config/config.js';
import { HEROES, ROLE_EMOJI } from '../../data/heroes.js';

const RANKS = [
  'Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend',
  'Mythic', 'Mythical Honor', 'Mythical Glory', 'Mythical Immortal',
];

export default {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Profilul tău de Mobile Legends')
    .addSubcommand((s) => s
      .setName('seteaza')
      .setDescription('Completează-ți profilul')
      .addStringOption((o) => o.setName('ign').setDescription('Numele din joc').setMaxLength(40))
      .addStringOption((o) => o.setName('id').setDescription('ID-ul + server (ex: 12345678 (2019))').setMaxLength(30))
      .addStringOption((o) => o.setName('rank').setDescription('Rank-ul actual').addChoices(...RANKS.map((r) => ({ name: r, value: r }))))
      .addStringOption((o) => o.setName('lane').setDescription('Lane-ul principal').addChoices(
        { name: '🥇 Gold Lane', value: 'Gold Lane' },
        { name: '🛡️ EXP Lane', value: 'EXP Lane' },
        { name: '🔮 Mid Lane', value: 'Mid Lane' },
        { name: '🌲 Jungle', value: 'Jungle' },
        { name: '🧿 Roam', value: 'Roam' },
      ))
      .addStringOption((o) => o.setName('main').setDescription('Eroul tău principal').setAutocomplete(true))
      .addStringOption((o) => o.setName('winrate').setDescription('Winrate-ul tău (ex: 62%)').setMaxLength(10)))
    .addSubcommand((s) => s
      .setName('vezi')
      .setDescription('Vezi profilul cuiva')
      .addUserOption((o) => o.setName('membru').setDescription('Al cui profil'))),

  async autocomplete(interaction) {
    const q = interaction.options.getFocused().toLowerCase();
    return interaction.respond(
      HEROES.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 25)
        .map((h) => ({ name: `${ROLE_EMOJI[h.role]} ${h.name}`, value: h.name })),
    );
  },

  async execute(interaction) {
    const path = (id) => `${interaction.guild.id}.${id}`;

    if (interaction.options.getSubcommand() === 'seteaza') {
      const current = db.get('profiles', path(interaction.user.id), {});
      const updated = {
        ...current,
        ign: interaction.options.getString('ign') ?? current.ign,
        gameId: interaction.options.getString('id') ?? current.gameId,
        rank: interaction.options.getString('rank') ?? current.rank,
        lane: interaction.options.getString('lane') ?? current.lane,
        main: interaction.options.getString('main') ?? current.main,
        winrate: interaction.options.getString('winrate') ?? current.winrate,
        updatedAt: Date.now(),
      };
      db.set('profiles', path(interaction.user.id), updated);
      return interaction.reply({
        embeds: [embeds.success('Profil actualizat! Vezi-l cu `/profil vezi`.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const user = interaction.options.getUser('membru') ?? interaction.user;
    const profile = db.get('profiles', path(user.id), null);
    const level = getUser(interaction.guild.id, user.id);
    const rank = rankOf(interaction.guild.id, user.id);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!profile) {
      return interaction.reply({
        embeds: [embeds.warn(
          user.id === interaction.user.id
            ? 'Nu ti-ai completat profilul. Foloseste `/profil seteaza`.'
            : `**${user.username}** nu si-a completat inca profilul.`,
        )],
        flags: MessageFlags.Ephemeral,
      });
    }

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.diamond)
          .setTitle(`🎮 Profil — ${profile.ign ?? user.username}`)
          .setThumbnail(user.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: '🆔 ID joc', value: profile.gameId ?? '_nesetat_', inline: true },
            { name: '🏅 Rank', value: profile.rank ?? '_nesetat_', inline: true },
            { name: '📍 Lane', value: profile.lane ?? '_nesetat_', inline: true },
            { name: '⭐ Main', value: profile.main ?? '_nesetat_', inline: true },
            { name: '📊 Winrate', value: profile.winrate ?? '_nesetat_', inline: true },
            { name: '🎖️ Nivel server', value: `Lv. **${level.level}** (#${rank.position})`, inline: true },
            {
              name: '🎭 Roluri',
              value: member?.roles.cache.filter((r) => r.name !== '@everyone').sort((a, b) => b.position - a.position)
                .map((r) => `${r}`).slice(0, 10).join(' ') || '—',
            },
          )
          .setFooter({ text: `Membru din ${member?.joinedAt?.toLocaleDateString('ro-RO') ?? '—'}` }),
      ],
    });
  },
};
