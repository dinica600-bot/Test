import {
  SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { profileCard } from '../../lib/profileCard.js';
import { lookupNickname, lookupStats } from '../../lib/mlbbApi.js';
import { findRank, rankFromPoints, rankLimits, rankChoices, formatRank } from '../../lib/mlbbRanks.js';
import { syncRankRole } from '../../lib/rankRoles.js';
import { getChannel } from '../../lib/guildMap.js';
import { HEROES, ROLE_EMOJI } from '../../data/heroes.js';
import { COLORS } from '../../config/config.js';

const LANES = [
  { name: '🥇 Gold Lane', value: 'Gold Lane' },
  { name: '🛡️ EXP Lane', value: 'EXP Lane' },
  { name: '🔮 Mid Lane', value: 'Mid Lane' },
  { name: '🌲 Jungle', value: 'Jungle' },
  { name: '🧿 Roam', value: 'Roam' },
];

const path = (guildId, userId) => `${guildId}.${userId}`;

export function buildProfileCommand(name) {
  const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription('Profilul tău de Mobile Legends: ID verificat, rank, stele, winrate')
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('conecteaza')
      .setDescription('Leagă-ți contul de MLBB — botul verifică ID-ul și îți ia numele real din joc')
      .addStringOption((o) => o.setName('user_id').setDescription('User ID-ul din joc (cifrele dinainte de paranteză)').setRequired(true))
      .addStringOption((o) => o.setName('zone_id').setDescription('Zone ID-ul (cifrele din paranteză)').setRequired(true)))
    .addSubcommand((s) => s
      .setName('stats')
      .setDescription('Completează-ți rank-ul, stelele și winrate-ul')
      .addStringOption((o) => o.setName('rank').setDescription('Rank-ul actual').addChoices(...rankChoices()))
      .addIntegerOption((o) => o.setName('diviziune').setDescription('Diviziunea (I-V), doar sub Mythic').setMinValue(1).setMaxValue(5))
      .addIntegerOption((o) => o.setName('stele').setDescription('Câte stele ai în diviziunea asta').setMinValue(0).setMaxValue(5))
      .addIntegerOption((o) => o.setName('puncte').setDescription('Punctele de Mythic (de la Mythic în sus)').setMinValue(0).setMaxValue(3000))
      .addNumberOption((o) => o.setName('winrate').setDescription('Winrate-ul, ex: 62.4').setMinValue(0).setMaxValue(100))
      .addIntegerOption((o) => o.setName('meciuri').setDescription('Total meciuri jucate').setMinValue(0))
      .addStringOption((o) => o.setName('lane').setDescription('Lane-ul principal').addChoices(...LANES))
      .addStringOption((o) => o.setName('main1').setDescription('Eroul principal').setAutocomplete(true))
      .addStringOption((o) => o.setName('main2').setDescription('Al doilea erou').setAutocomplete(true))
      .addStringOption((o) => o.setName('main3').setDescription('Al treilea erou').setAutocomplete(true))
      .addStringOption((o) => o.setName('squad').setDescription('Squad-ul din joc').setMaxLength(40)))
    .addSubcommand((s) => s
      .setName('vezi')
      .setDescription('Vezi fișa de jucător')
      .addUserOption((o) => o.setName('membru').setDescription('Al cui profil')))
    .addSubcommand((s) => s
      .setName('dovada')
      .setDescription('Trimite un screenshot din joc ca staff-ul să-ți confirme stats-urile')
      .addAttachmentOption((o) => o.setName('screenshot').setDescription('Poza cu profilul tău din joc').setRequired(true)))
    .addSubcommand((s) => s.setName('sterge').setDescription('Șterge-ți profilul de pe server'));

  return {
    data,
    cooldown: 10,

    async autocomplete(interaction) {
      const q = interaction.options.getFocused().toLowerCase();
      return interaction.respond(
        HEROES.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 25)
          .map((h) => ({ name: `${ROLE_EMOJI[h.role]} ${h.name}`, value: h.name })),
      );
    },

    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const gid = interaction.guild.id;
      const key = path(gid, interaction.user.id);

      /* ---------------- conecteaza ---------------- */
      if (sub === 'conecteaza') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const id = interaction.options.getString('user_id').replace(/\D/g, '');
        const zone = interaction.options.getString('zone_id').replace(/\D/g, '');

        const result = await lookupNickname(id, zone);
        if (!result.ok) {
          return interaction.editReply({
            embeds: [embeds.error(
              `${result.reason}\n\n` +
              '**Unde găsești ID-ul:** deschide MLBB → apasă pe avatarul tău → sub nume apare ' +
              '`12345678 (2019)`. Primul număr e **User ID**, cel din paranteză e **Zone ID**.',
            )],
          });
        }

        const current = db.get('profiles', key, {});
        const stats = await lookupStats(id, zone);
        const updated = {
          ...current,
          ign: result.nickname,
          gameId: id,
          zoneId: zone,
          verifiedId: true,
          verifiedAt: Date.now(),
          ...(stats?.winrate != null ? { winrate: stats.winrate } : {}),
          ...(stats?.matches != null ? { matches: stats.matches } : {}),
          ...(stats?.points != null ? { points: stats.points, rankTier: rankFromPoints(stats.points)?.name ?? current.rankTier } : {}),
        };
        db.set('profiles', key, updated);

        // punem si numele din joc ca nickname pe server, daca putem
        let renamed = false;
        if (interaction.member.manageable) {
          renamed = await interaction.member.setNickname(result.nickname, 'Cont MLBB verificat')
            .then(() => true).catch(() => false);
        }

        return interaction.editReply({
          embeds: [
            embeds.custom(COLORS.success)
              .setTitle('✅ Cont verificat!')
              .setDescription(
                `Contul **${id} (${zone})** există și îi aparține numele din joc:\n\n` +
                `# ${result.nickname}\n\n` +
                (renamed ? '_Ți-am pus și numele ăsta pe server._\n' : '') +
                'Acum completează-ți rank-ul și winrate-ul cu `/' + name + ' stats`, ' +
                'apoi trimite un screenshot cu `/' + name + ' dovada` ca staff-ul să le confirme.',
              ),
          ],
        });
      }

      /* ---------------- stats ---------------- */
      if (sub === 'stats') {
        const current = db.get('profiles', key, {});
        const points = interaction.options.getInteger('puncte');
        const chosenRank = interaction.options.getString('rank');
        let rankName = chosenRank ?? current.rankTier;

        // De la Mythic in sus nu mai exista diviziuni si stele, ci puncte —
        // asa ca punctele decid tier-ul si il corectam automat.
        let autoTier = null;
        if (points !== null) {
          if (chosenRank && !findRank(chosenRank)?.points) {
            return interaction.reply({
              embeds: [embeds.error(
                `**${chosenRank}** merge pe diviziuni si stele, nu pe puncte. ` +
                'Punctele exista doar de la **Mythic** in sus.',
              )],
              flags: MessageFlags.Ephemeral,
            });
          }
          const derived = rankFromPoints(points);
          if (derived) {
            autoTier = derived.name !== rankName ? derived.name : null;
            rankName = derived.name;
          }
        }

        const limits = rankLimits(rankName);
        const division = interaction.options.getInteger('diviziune') ?? current.division;
        const stars = interaction.options.getInteger('stele') ?? current.stars;

        if (limits && division && division > limits.divisions) {
          return interaction.reply({
            embeds: [embeds.error(`**${rankName}** are doar ${limits.divisions} diviziuni.`)],
            flags: MessageFlags.Ephemeral,
          });
        }
        if (limits && stars != null && stars > limits.stars) {
          return interaction.reply({
            embeds: [embeds.error(`La **${rankName}** o diviziune are maxim ${limits.stars} stele.`)],
            flags: MessageFlags.Ephemeral,
          });
        }

        const isPointRank = Boolean(findRank(rankName)?.points);
        const updated = {
          ...current,
          rankTier: rankName ?? null,
          division: isPointRank ? null : (division ?? null),
          stars: isPointRank ? null : (stars ?? null),
          points: isPointRank ? (points ?? current.points ?? null) : null,
          winrate: interaction.options.getNumber('winrate') ?? current.winrate ?? null,
          matches: interaction.options.getInteger('meciuri') ?? current.matches ?? null,
          lane: interaction.options.getString('lane') ?? current.lane ?? null,
          main1: interaction.options.getString('main1') ?? current.main1 ?? null,
          main2: interaction.options.getString('main2') ?? current.main2 ?? null,
          main3: interaction.options.getString('main3') ?? current.main3 ?? null,
          squad: interaction.options.getString('squad') ?? current.squad ?? null,
          // stats-urile declarate trebuie reconfirmate de staff
          verifiedStats: false,
        };
        // pastram compatibilitatea cu /lineup, care afiseaza rank-ul ca text
        updated.rank = formatRank(updated)?.replace(/\*\*/g, '') ?? null;
        db.set('profiles', key, updated);

        const role = rankName ? await syncRankRole(interaction.member, rankName) : null;

        return interaction.reply({
          embeds: [
            embeds.custom(COLORS.success)
              .setTitle('📊 Stats salvate')
              .setDescription(
                (autoTier ? `Cu **${points}** puncte ești la **${autoTier}** — am pus tier-ul corect.\n\n` : '') +
                (role ? `Ți-am dat rolul ${role}.\n` : '') +
                `Trimite un screenshot cu \`/${name} dovada\` ca staff-ul să pună badge-ul **🛡️ Stats confirmate**.`,
              ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      /* ---------------- dovada ---------------- */
      if (sub === 'dovada') {
        const file = interaction.options.getAttachment('screenshot');
        if (!file.contentType?.startsWith('image/')) {
          return interaction.reply({ embeds: [embeds.error('Trimite o imagine (screenshot din joc).')], flags: MessageFlags.Ephemeral });
        }

        const profile = db.get('profiles', key, null);
        if (!profile?.rankTier) {
          return interaction.reply({
            embeds: [embeds.warn(`Întâi completează-ți stats-urile cu \`/${name} stats\`.`)],
            flags: MessageFlags.Ephemeral,
          });
        }

        const channel = getChannel(interaction.guild, 'reports')
          ?? getChannel(interaction.guild, 'staff-chat')
          ?? getChannel(interaction.guild, 'applications');
        if (!channel?.isTextBased()) {
          return interaction.reply({
            embeds: [embeds.error('Nu am unde trimite dovada. Roagă un admin să ruleze `/setup server`.')],
            flags: MessageFlags.Ephemeral,
          });
        }

        db.set('profiles', key, { ...profile, proofUrl: file.url });

        const review = embeds
          .custom(COLORS.warning)
          .setTitle('🔍 Cerere de confirmare stats')
          .setDescription(
            `${interaction.user} \`${interaction.user.id}\`\n\n` +
            `**Nume în joc:** ${profile.ign ?? '_nesetat_'}\n` +
            `**ID:** ${profile.gameId ?? '?'} (${profile.zoneId ?? '?'}) ${profile.verifiedId ? '✅ verificat automat' : '⚠️ neverificat'}\n` +
            `**Rank declarat:** ${formatRank(profile) ?? '—'}\n` +
            `**Winrate declarat:** ${profile.winrate ?? '—'}% din ${profile.matches ?? '—'} meciuri`,
          )
          .setImage(file.url);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`pverify:ok:${interaction.user.id}`).setLabel('Confirm').setEmoji('✅').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`pverify:no:${interaction.user.id}`).setLabel('Resping').setEmoji('❌').setStyle(ButtonStyle.Danger),
        );

        await channel.send({ embeds: [review], components: [row] });
        return interaction.reply({
          embeds: [embeds.success('Am trimis screenshot-ul la staff. Primești DM când e confirmat. 🛡️')],
          flags: MessageFlags.Ephemeral,
        });
      }

      /* ---------------- sterge ---------------- */
      if (sub === 'sterge') {
        db.delete('profiles', key);
        return interaction.reply({ embeds: [embeds.success('Ți-am șters profilul.')], flags: MessageFlags.Ephemeral });
      }

      /* ---------------- vezi ---------------- */
      const user = interaction.options.getUser('membru') ?? interaction.user;
      const profile = db.get('profiles', path(gid, user.id), null);
      if (!profile) {
        return interaction.reply({
          embeds: [embeds.warn(
            user.id === interaction.user.id
              ? `Nu ai profil încă. Începe cu \`/${name} conecteaza\` — îți verific ID-ul și îți iau numele real din joc.`
              : `**${user.username}** nu și-a făcut încă profilul.`,
          )],
          flags: MessageFlags.Ephemeral,
        });
      }

      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      return interaction.reply({ embeds: [profileCard(user, member, profile, gid)] });
    },
  };
}

export default buildProfileCommand('profil');
