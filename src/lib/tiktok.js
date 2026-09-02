/**
 * Anuntarea live-urilor de pe TikTok.
 *
 * TikTok NU are un API public pentru asta. Verificarea automata se face
 * printr-o biblioteca neoficiala (tiktok-live-connector), care merge dar
 * se poate strica atunci cand TikTok isi schimba lucrurile pe dinauntru.
 * De aceea:
 *   • biblioteca e optionala — botul merge normal si fara ea
 *   • comanda /live ramane mereu disponibila, ca varianta sigura
 *
 * Instalare pentru verificarea automata:  npm install tiktok-live-connector
 */
import { db, settings } from './db.js';
import { embeds } from './embeds.js';
import { getChannel, getRole } from './guildMap.js';
import { console_ } from './logger.js';
import { COLORS } from '../config/config.js';

let connector;  // undefined = neincercat, null = neinstalat

async function getConnector() {
  if (connector !== undefined) return connector;
  try {
    const mod = await import('tiktok-live-connector');
    connector = mod.TikTokLiveConnection ?? null;
    if (connector) console_.ok('Verificarea automata a live-urilor TikTok e activa.');
  } catch {
    connector = null;
  }
  return connector;
}

export function autoCheckAvailable() {
  return connector !== null && connector !== undefined;
}

/** Conturile urmarite pe serverul asta. */
export function accounts(guildId) {
  return settings.get(guildId, 'tiktok.accounts', []);
}

export function addAccount(guildId, username, memberId = null) {
  const list = accounts(guildId);
  const clean = username.replace(/^@/, '').trim().toLowerCase();
  if (list.some((a) => a.username === clean)) return false;
  list.push({ username: clean, memberId });
  settings.set(guildId, 'tiktok.accounts', list);
  return true;
}

export function removeAccount(guildId, username) {
  const clean = username.replace(/^@/, '').trim().toLowerCase();
  const list = accounts(guildId).filter((a) => a.username !== clean);
  settings.set(guildId, 'tiktok.accounts', list);
  return list;
}

/** Embed-ul de anunt, folosit si manual si automat. */
export function liveEmbed({ username, url, title, platform = 'TikTok', memberId, avatar }) {
  const embed = embeds
    .custom(0xff0050)
    .setAuthor({ name: `🔴 LIVE pe ${platform}` })
    .setTitle(title || `@${username} e live acum!`)
    .setDescription(
      (memberId ? `${`<@${memberId}>`} tocmai a intrat live.\n\n` : '') +
      `**[Intră în live aici](${url})**`,
    )
    .setURL(url)
    .setFooter({ text: 'Ia-ți rolul 🔴 Live din self-roles ca să primești notificare data viitoare.' });
  if (avatar) embed.setThumbnail(avatar);
  return embed;
}

/** Trimite anuntul in canalul de live si mentioneaza rolul. */
export async function announceLive(guild, data) {
  const channel = getChannel(guild, 'live') ?? getChannel(guild, 'announcements');
  if (!channel?.isTextBased()) return null;
  const ping = getRole(guild, 'ping_live');

  return channel.send({
    content: ping ? `${ping}` : undefined,
    embeds: [liveEmbed(data)],
    allowedMentions: { roles: ping ? [ping.id] : [] },
  }).catch(() => null);
}

/**
 * Verifica din 3 in 3 minute daca vreun cont urmarit a intrat live.
 * Anunta o singura data pe sesiune de live, nu la fiecare verificare.
 */
export function startLiveWatcher(client) {
  const tick = async () => {
    const TikTok = await getConnector();
    if (!TikTok) return;

    for (const guild of client.guilds.cache.values()) {
      const list = accounts(guild.id);
      if (!list.length) continue;

      for (const account of list) {
        const key = `${guild.id}.${account.username}`;
        let isLive = false;

        try {
          const connection = new TikTok(account.username, {
            ...(process.env.TIKTOK_SIGN_KEY ? { signApiKey: process.env.TIKTOK_SIGN_KEY } : {}),
          });
          isLive = await connection.fetchIsLive();
          connection.disconnect?.();
        } catch (err) {
          db.set('tiktok', `${key}.error`, String(err.message).slice(0, 120));
          continue;
        }

        const wasLive = db.get('tiktok', `${key}.live`, false);
        db.set('tiktok', `${key}.live`, isLive);

        if (isLive && !wasLive) {
          await announceLive(guild, {
            username: account.username,
            url: `https://www.tiktok.com/@${account.username}/live`,
            memberId: account.memberId,
          });
          console_.info(`TikTok: @${account.username} a intrat live.`);
        }
      }
    }
  };

  setTimeout(tick, 90_000);
  setInterval(tick, 3 * 60_000).unref?.();
}
