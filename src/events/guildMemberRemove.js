import { Events } from 'discord.js';
import { embeds, ts } from '../lib/embeds.js';
import { log } from '../lib/logger.js';
import { COLORS } from '../config/config.js';
import { db } from '../lib/db.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    await log(member.guild, 'join', embeds.custom(COLORS.danger)
      .setTitle('📤 A plecat de pe server')
      .setDescription(`${member.user.tag} \`${member.id}\``)
      .addFields(
        { name: 'A intrat', value: member.joinedAt ? ts(member.joinedAt) : 'necunoscut', inline: true },
        { name: 'Roluri', value: member.roles.cache.filter((r) => r.name !== '@everyone').map((r) => r.name).join(', ').slice(0, 900) || '—' },
      )
      .setThumbnail(member.displayAvatarURL()));

    // daca avea un ticket deschis, il marcam ca liber
    db.delete('tickets', `${member.guild.id}.open.${member.id}`);
  },
};
