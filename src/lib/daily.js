/**
 * Continut zilnic — serverul face ceva de la sine in fiecare zi,
 * ca sa nu para mort cand nu scrie nimeni.
 *
 * In fiecare zi la prima verificare de dupa ora 12:00 posteaza in
 * `🎯︱hero-tips` eroul zilei plus un sfat de joc.
 */
import { db } from './db.js';
import { embeds } from './embeds.js';
import { getChannel, getRole } from './guildMap.js';
import { HEROES, ROLE_EMOJI, LANE_LABEL, BUILD_TEMPLATES, counteredBy } from '../data/heroes.js';
import { COLORS, config } from '../config/config.js';

const TIPS = [
  'Nu incepe fight-ul daca nu stii unde e jungler-ul inamic. Vision > damage.',
  'Cumpara Anti-heal (Sea Halberd / Necklace of Durance) cand vezi Esmeralda, Uranus sau Alucard.',
  'Turtle la minutul 2 valoreaza mai mult decat un kill. Rotiti impreuna.',
  'Daca ai lane-ul impins, ia crab-ul si da vision spre jungla lor — asa se castiga macro.',
  'Nu da flame la coechipieri. Un jucator tiltat pierde meciul mai repede decat un feed.',
  'Malefic Roar / Divine Glaive doar cand au 2+ tank-i. Altfel iei damage flat.',
  'Retreat-ul cu ping e gratis. Moartea de la minutul 12 costa Lordul.',
  'Invata un singur erou pe lane si joaca-l 50 de meciuri. Consistenta bate pool-ul mare.',
  'Cand pierzi turnul, nu il apara pe al doilea singur. Grupati-va si luati obiectiv in schimb.',
  'Verifica ce spell are inamicul. Flicker-ul lui pe cooldown e fereastra ta de kill.',
  'Cel mai bun timp pentru Lord e dupa ce ai luat 2-3 kill-uri, nu inainte.',
  'Roamer-ul nu fura farm. Sta langa carry si tine vision-ul in jur.',
];

export function startDailyLoop(client) {
  const check = async () => {
    const now = new Date();
    if (now.getHours() < 12) return;
    const stamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    for (const guild of client.guilds.cache.values()) {
      if (db.get('daily', `${guild.id}.last`) === stamp) continue;

      const channel = getChannel(guild, 'tips') ?? getChannel(guild, 'general');
      if (!channel?.isTextBased()) continue;

      const hero = HEROES[Math.floor(Math.random() * HEROES.length)];
      const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
      const build = BUILD_TEMPLATES[hero.role];
      const beats = counteredBy(hero);

      const embed = embeds
        .custom(COLORS.gold)
        .setTitle(`${ROLE_EMOJI[hero.role]} Eroul zilei — ${hero.name}`)
        .setDescription(
          `Astazi antrenati **${hero.name}**. Cine da un clip bun cu el in \`📸︱victorii\` intra la highlight-uri.`,
        )
        .addFields(
          { name: 'Rol', value: hero.role, inline: true },
          { name: 'Lane', value: hero.lanes.map((l) => LANE_LABEL[l]).join(', '), inline: true },
          { name: 'Dificultate', value: hero.diff, inline: true },
          { name: '⛔ Ai grijă de', value: hero.counters?.join(', ') || '—', inline: true },
          { name: '✅ El contrează', value: beats.slice(0, 6).join(', ') || '—', inline: true },
          { name: '🛠️ Primii itemi', value: build?.items.slice(0, 3).join(' → ') ?? '—' },
          { name: '🧠 Sfatul zilei', value: tip },
        )
        .setFooter({ text: `${config.squadName} • /hero ${hero.name} pentru tot ce stiu despre el` });

      const ping = getRole(guild, 'ping_event');
      await channel.send({
        content: ping ? `${ping}` : undefined,
        embeds: [embed],
        allowedMentions: { roles: ping ? [ping.id] : [] },
      }).catch(() => {});

      db.set('daily', `${guild.id}.last`, stamp);
      db.set('daily', `${guild.id}.hero`, hero.name);
    }
  };

  setTimeout(check, 45_000);
  setInterval(check, 30 * 60_000).unref?.();
}
