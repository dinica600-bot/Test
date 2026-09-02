import { Events, ActivityType } from 'discord.js';
import { console_ } from '../lib/logger.js';
import { config } from '../config/config.js';
import { startGiveawayLoop } from '../components/giveaway.js';
import { updateStats } from '../lib/stats.js';
import { startBirthdayLoop } from '../lib/birthdays.js';
import { startDailyLoop } from '../lib/daily.js';
import { startAmbianceLoop } from '../lib/personas.js';
import { startLiveWatcher } from '../lib/tiktok.js';
import { settings } from '../lib/db.js';
import { ROLES, CATEGORIES } from '../config/blueprint.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console_.ok(`Conectat ca ${client.user.tag}`);
    console_.info(`Servere: ${client.guilds.cache.size} • Membri: ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`);
    // Asa vezi imediat daca rulezi codul nou: numerele cresc cand adaug ceva.
    console_.info(
      `Blueprint incarcat: ${ROLES.length} roluri, ${CATEGORIES.flatMap((c) => c.channels).length} canale. ` +
      'Daca ai facut git pull si numerele nu s-au schimbat, botul vechi inca ruleaza.',
    );

    const activities = [
      { name: `${config.squadName} 🩸`, type: ActivityType.Competing },
      { name: 'Mobile Legends • Mythical Glory', type: ActivityType.Playing },
      { name: '/help pentru toate comenzile', type: ActivityType.Listening },
      { name: 'scrim-urile squad-ului', type: ActivityType.Watching },
    ];
    let i = 0;
    setInterval(() => {
      client.user.setActivity(activities[i % activities.length]);
      i += 1;
    }, 60_000).unref?.();

    // citim setarile acum, ca prima comanda sa nu astepte dupa disc
    for (const guild of client.guilds.cache.values()) settings.all(guild.id);

    startGiveawayLoop(client);
    startBirthdayLoop(client);
    startDailyLoop(client);
    startAmbianceLoop(client);
    startLiveWatcher(client);

    // canalele de statistici se actualizeaza la 10 minute (rate limit Discord)
    const refresh = () => client.guilds.cache.forEach((g) => updateStats(g).catch(() => {}));
    setTimeout(refresh, 10_000);
    setInterval(refresh, 10 * 60_000).unref?.();
  },
};
