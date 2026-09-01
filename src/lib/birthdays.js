import { db } from './db.js';
import { embeds } from './embeds.js';
import { getChannel } from './guildMap.js';
import { COLORS } from '../config/config.js';

/** Verifica o data pe ora daca e ziua cuiva si anunta o singura data pe zi. */
export function startBirthdayLoop(client) {
  const check = async () => {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    for (const guild of client.guilds.cache.values()) {
      if (db.get('birthdays', `${guild.id}._announced`) === stamp) continue;
      const all = db.get('birthdays', guild.id, {});
      const today = Object.entries(all).filter(
        ([id, b]) => id !== '_announced' && b.day === now.getDate() && b.month === now.getMonth() + 1,
      );
      if (!today.length) continue;

      const channel = getChannel(guild, 'birthdays') ?? getChannel(guild, 'general');
      if (channel?.isTextBased()) {
        await channel.send({
          content: today.map(([id]) => `<@${id}>`).join(' '),
          embeds: [
            embeds.custom(COLORS.gold)
              .setTitle('🎂 La mulți ani!')
              .setDescription(
                `Azi e ziua lui ${today.map(([id]) => `<@${id}>`).join(', ')}!\n` +
                'Squad-ul iti ureaza numai bine si Mythical Glory fara pierderi. 🩸💎',
              ),
          ],
        }).catch(() => {});
      }
      db.set('birthdays', `${guild.id}._announced`, stamp);
    }
  };

  setTimeout(check, 30_000);
  setInterval(check, 60 * 60_000).unref?.();
}
