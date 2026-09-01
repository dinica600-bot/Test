import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embeds, ts } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { scrimEmbed, scrimButtons } from '../../components/scrim.js';
import { getChannel, getRole } from '../../lib/guildMap.js';
import { COLORS } from '../../config/config.js';

/** Accepta "azi", "maine", "24.09" sau "24.09.2026" + ora "20:30". */
function parseWhen(dateStr, timeStr) {
  const now = new Date();
  const [hours, minutes] = (timeStr ?? '20:00').split(':').map(Number);
  if (Number.isNaN(hours)) return null;

  const date = new Date(now);
  const lower = (dateStr ?? 'azi').trim().toLowerCase();

  if (lower === 'maine' || lower === 'mâine') date.setDate(date.getDate() + 1);
  else if (lower !== 'azi') {
    const parts = lower.split(/[.\-/]/).map(Number);
    if (parts.length < 2 || parts.some(Number.isNaN)) return null;
    date.setDate(parts[0]);
    date.setMonth(parts[1] - 1);
    if (parts[2]) date.setFullYear(parts[2] < 100 ? 2000 + parts[2] : parts[2]);
  }

  date.setHours(hours, minutes || 0, 0, 0);
  if (lower === 'azi' && date < now) date.setDate(date.getDate() + 1);
  return date.getTime();
}

export default {
  data: new SlashCommandBuilder()
    .setName('scrim')
    .setDescription('Organizează scrim-urile squad-ului')
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('creeaza')
      .setDescription('Programează un scrim și strânge line-up-ul')
      .addStringOption((o) => o.setName('adversar').setDescription('Cu cine jucăm').setRequired(true).setMaxLength(50))
      .addStringOption((o) => o.setName('ora').setDescription('Ora, ex: 20:30').setRequired(true))
      .addStringOption((o) => o.setName('data').setDescription('azi / maine / 24.09 (implicit: azi)'))
      .addStringOption((o) => o.setName('format').setDescription('Format').addChoices(
        { name: 'BO1', value: 'BO1' }, { name: 'BO2', value: 'BO2' },
        { name: 'BO3', value: 'BO3' }, { name: 'BO5', value: 'BO5' },
      ))
      .addStringOption((o) => o.setName('note').setDescription('Detalii (draft, room ID, condiții)').setMaxLength(300)))
    .addSubcommand((s) => s.setName('lista').setDescription('Scrim-urile programate'))
    .addSubcommand((s) => s.setName('curata').setDescription('Șterge scrim-urile care au trecut')),

  cooldown: 5,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'lista') {
      const all = Object.entries(db.get('scrims', gid, {}))
        .map(([id, s]) => ({ id, ...s }))
        .filter((s) => s.time > Date.now() - 3600_000)
        .sort((a, b) => a.time - b.time);

      return interaction.reply({
        embeds: [
          embeds.custom(COLORS.primary)
            .setTitle('📅 Scrim-uri programate')
            .setDescription(
              all.length
                ? all.map((s) =>
                  `**${s.opponent}** • ${s.format}\n└ ${ts(s.time, 'F')} (${ts(s.time, 'R')}) — line-up: **${s.players.length}/5**`)
                  .join('\n\n')
                : 'Niciun scrim programat. Fa unul cu `/scrim creeaza`.',
            ),
        ],
      });
    }

    if (sub === 'curata') {
      const all = db.get('scrims', gid, {});
      let removed = 0;
      for (const [id, s] of Object.entries(all)) {
        if (s.time < Date.now() - 6 * 3600_000) { db.delete('scrims', `${gid}.${id}`); removed += 1; }
      }
      return interaction.reply({
        embeds: [embeds.success(`Am sters **${removed}** scrim-uri vechi.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    // ---- creeaza ----
    const time = parseWhen(interaction.options.getString('data'), interaction.options.getString('ora'));
    if (!time) {
      return interaction.reply({
        embeds: [embeds.error('Nu am inteles data/ora. Exemple: `ora: 20:30`, `data: maine` sau `data: 24.09`.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const scrim = {
      opponent: interaction.options.getString('adversar'),
      format: interaction.options.getString('format') ?? 'BO3',
      notes: interaction.options.getString('note'),
      time,
      createdBy: interaction.user.id,
      createdByTag: interaction.user.tag,
      players: [], subs: [], out: [],
    };

    const channel = getChannel(interaction.guild, 'scrim-schedule') ?? interaction.channel;
    const ping = getRole(interaction.guild, 'ping_scrim');

    const message = await channel.send({
      content: ping ? `${ping}` : undefined,
      embeds: [scrimEmbed(scrim)],
      components: [scrimButtons()],
      allowedMentions: { roles: ping ? [ping.id] : [] },
    });
    db.set('scrims', `${gid}.${message.id}`, scrim);

    return interaction.reply({
      embeds: [embeds.success(`Scrim-ul cu **${scrim.opponent}** e programat: ${channel}`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
