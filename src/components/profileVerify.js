import { embeds, fail } from '../lib/embeds.js';
import { db } from '../lib/db.js';
import { isStaff } from '../lib/permissions.js';
import { syncRankRole } from '../lib/rankRoles.js';
import { formatRank } from '../lib/mlbbRanks.js';
import { log } from '../lib/logger.js';
import { COLORS } from '../config/config.js';

/** Staff-ul confirma sau respinge statisticile declarate pe profil. */
export async function handleProfileVerify(interaction) {
  if (!isStaff(interaction.member)) return fail(interaction, 'Doar staff-ul poate confirma stats-urile.');

  const [, decision, userId] = interaction.customId.split(':');
  const key = `${interaction.guild.id}.${userId}`;
  const profile = db.get('profiles', key, null);
  if (!profile) return fail(interaction, 'Membrul si-a sters intre timp profilul.');

  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  const approved = decision === 'ok';

  db.set('profiles', key, {
    ...profile,
    verifiedStats: approved,
    verifiedBy: interaction.user.id,
    verifiedStatsAt: approved ? Date.now() : null,
  });

  if (approved && member && profile.rankTier) await syncRankRole(member, profile.rankTier);

  member?.send({
    embeds: [
      embeds.custom(approved ? COLORS.success : COLORS.danger)
        .setTitle(approved ? '🛡️ Stats confirmate!' : '❌ Stats neconfirmate')
        .setDescription(
          approved
            ? `Staff-ul ti-a confirmat profilul: ${formatRank(profile) ?? 'rank setat'}.\n` +
              'Ai acum badge-ul **🛡️ Stats confirmate** pe fisa ta.'
            : 'Screenshot-ul nu a fost suficient de clar sau nu se potrivea cu ce ai declarat.\n' +
              'Trimite altul cu `/profil dovada` — sa se vada profilul din joc, cu rank si winrate.',
        ),
    ],
  }).catch(() => {});

  await log(interaction.guild, 'mod', embeds.custom(approved ? COLORS.success : COLORS.warning)
    .setTitle(approved ? '🛡️ Stats confirmate' : '❌ Stats respinse')
    .setDescription(`<@${userId}> — de ${interaction.user}`));

  const original = interaction.message.embeds[0];
  return interaction.update({
    embeds: [
      embeds.custom(approved ? COLORS.success : COLORS.danger)
        .setTitle(`${original.title} — ${approved ? '✅ confirmat' : '❌ respins'}`)
        .setDescription(`${original.description}\n\n**Decis de ${interaction.user}**`)
        .setImage(original.image?.url ?? null),
    ],
    components: [],
  });
}
