import { SlashCommandBuilder } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { getRole } from '../../lib/guildMap.js';
import { db } from '../../lib/db.js';
import { COLORS, config } from '../../config/config.js';

const LANES = [
  { key: 'lane_gold', label: '🥇 Gold Lane' },
  { key: 'lane_exp', label: '🛡️ EXP Lane' },
  { key: 'lane_mid', label: '🔮 Mid Lane' },
  { key: 'lane_jungle', label: '🌲 Jungler' },
  { key: 'lane_roam', label: '🧿 Roamer' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('lineup')
    .setDescription('Line-up-ul oficial al squad-ului, pe lane-uri')
    .setDMPermission(false)
    .addStringOption((o) => o.setName('grup').setDescription('Ce lot').addChoices(
      { name: '🏆 Roster principal', value: 'roster' },
      { name: '🔁 Rezerve', value: 'sub' },
      { name: '🎓 Academy', value: 'academy' },
    )),

  cooldown: 5,

  async execute(interaction) {
    await interaction.guild.members.fetch();
    const groupKey = interaction.options.getString('grup') ?? 'roster';
    const group = getRole(interaction.guild, groupKey);
    if (!group) {
      return interaction.reply({ embeds: [embeds.error('Rolul nu exista. Ruleaza `/setup server`.')], flags: 64 });
    }

    const members = group.members;
    const fields = LANES.map(({ key, label }) => {
      const laneRole = getRole(interaction.guild, key);
      const list = laneRole
        ? members.filter((m) => m.roles.cache.has(laneRole.id))
        : null;
      const value = list?.size
        ? list.map((m) => {
          const p = db.get('profiles', `${interaction.guild.id}.${m.id}`, {});
          return `${m} ${p.ign ? `\`${p.ign}\`` : ''} ${p.rank ? `• ${p.rank}` : ''}`;
        }).join('\n')
        : '_liber_';
      return { name: label, value, inline: false };
    });

    const noLane = members.filter((m) => !LANES.some((l) => {
      const r = getRole(interaction.guild, l.key);
      return r && m.roles.cache.has(r.id);
    }));

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.gold)
          .setTitle(`🏅 Line-up ${config.squadName} — ${group.name}`)
          .setDescription(`**${members.size}** jucători în acest lot.`)
          .addFields(
            ...fields,
            { name: '❔ Fără lane setat', value: noLane.size ? noLane.map((m) => `${m}`).join(', ') : '_—_' },
          )
          .setFooter({ text: 'Lane-ul se ia din 🎭︱self-roles' }),
      ],
    });
  },
};
