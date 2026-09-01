import { SlashCommandBuilder } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { leaderboard, rankOf } from '../../lib/leveling.js';
import { db } from '../../lib/db.js';
import { COLORS, config } from '../../config/config.js';

const MEDALS = ['🥇', '🥈', '🥉'];

export default {
  data: new SlashCommandBuilder()
    .setName('clasament')
    .setDescription('Topul serverului')
    .setDMPermission(false)
    .addStringOption((o) => o.setName('tip').setDescription('După ce criteriu').addChoices(
      { name: '⭐ Nivel / XP', value: 'xp' },
      { name: '💬 Mesaje', value: 'messages' },
      { name: '🔊 Timp în voice', value: 'voice' },
    )),

  cooldown: 5,

  async execute(interaction) {
    const type = interaction.options.getString('tip') ?? 'xp';
    const gid = interaction.guild.id;

    let rows;
    if (type === 'xp') {
      rows = leaderboard(gid, 10).map((u, i) => ({
        line: `${MEDALS[i] ?? `\`${i + 1}.\``} <@${u.id}> — Lv. **${u.level}** (${u.total} XP)`,
      }));
    } else {
      const all = db.get('levels', gid, {});
      rows = Object.entries(all)
        .map(([id, d]) => ({ id, value: d[type] ?? 0 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .map((u, i) => ({
          line: `${MEDALS[i] ?? `\`${i + 1}.\``} <@${u.id}> — **${type === 'voice' ? `${Math.round(u.value / 60)}h` : u.value}**`,
        }));
    }

    const me = rankOf(gid, interaction.user.id);

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.gold)
          .setTitle(`🏆 Clasament ${config.squadName}`)
          .setDescription(rows.length ? rows.map((r) => r.line).join('\n') : 'Inca nu are nimeni XP. Scrieti ceva! 💬')
          .setFooter({ text: `Tu esti pe locul #${me.position} din ${me.of}` })
          .setThumbnail(interaction.guild.iconURL() ?? null),
      ],
    });
  },
};
