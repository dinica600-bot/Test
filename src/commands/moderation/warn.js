import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds, ts } from '../../lib/embeds.js';
import { canActOn, isStaff } from '../../lib/permissions.js';
import { modLog } from '../../lib/logger.js';
import { db } from '../../lib/db.js';
import { COLORS } from '../../config/config.js';

/** La al 3-lea warn -> timeout 1h, la al 5-lea -> kick. */
const ESCALATION = { 3: 'timeout', 5: 'kick' };

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Sistemul de avertismente')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('da')
      .setDescription('Dă un avertisment')
      .addUserOption((o) => o.setName('membru').setDescription('Pe cine').setRequired(true))
      .addStringOption((o) => o.setName('motiv').setDescription('De ce').setRequired(true).setMaxLength(400)))
    .addSubcommand((s) => s
      .setName('lista')
      .setDescription('Vezi avertismentele unui membru')
      .addUserOption((o) => o.setName('membru').setDescription('Cine').setRequired(true)))
    .addSubcommand((s) => s
      .setName('sterge')
      .setDescription('Șterge un avertisment')
      .addUserOption((o) => o.setName('membru').setDescription('Cine').setRequired(true))
      .addIntegerOption((o) => o.setName('numar').setDescription('Al câtelea avertisment (din /warn lista)').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s
      .setName('curata')
      .setDescription('Șterge toate avertismentele unui membru')
      .addUserOption((o) => o.setName('membru').setDescription('Cine').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('membru');
    const path = `${interaction.guild.id}.${user.id}`;
    const warns = db.get('warns', path, []);

    if (sub === 'lista') {
      if (!warns.length) {
        return interaction.reply({ embeds: [embeds.success(`**${user.tag}** nu are niciun avertisment. 👏`)], flags: MessageFlags.Ephemeral });
      }
      return interaction.reply({
        embeds: [
          embeds.custom(COLORS.warning)
            .setTitle(`⚠️ Avertismente — ${user.tag}`)
            .setDescription(warns.map((w, i) =>
              `**${i + 1}.** ${w.reason}\n└ de <@${w.by}> • ${ts(w.at)}`).join('\n\n').slice(0, 3900))
            .setThumbnail(user.displayAvatarURL()),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'curata') {
      db.set('warns', path, []);
      await modLog(interaction.guild, {
        action: 'Avertismente șterse', target: user, moderator: interaction.user,
        reason: 'curățare completă', color: COLORS.success,
      });
      return interaction.reply({ embeds: [embeds.success(`Am sters toate avertismentele lui **${user.tag}**.`)] });
    }

    if (sub === 'sterge') {
      const index = interaction.options.getInteger('numar') - 1;
      if (!warns[index]) return interaction.reply({ embeds: [embeds.error('Nu exista avertismentul asta.')], flags: MessageFlags.Ephemeral });
      const [removed] = warns.splice(index, 1);
      db.set('warns', path, warns);
      return interaction.reply({ embeds: [embeds.success(`Am sters avertismentul: _${removed.reason}_`)] });
    }

    // ---- warn da ----
    const member = interaction.options.getMember('membru');
    const error = canActOn(interaction.member, member);
    if (error) return interaction.reply({ embeds: [embeds.error(error)], flags: MessageFlags.Ephemeral });

    const reason = interaction.options.getString('motiv');
    warns.push({ reason, by: interaction.user.id, at: Date.now() });
    db.set('warns', path, warns);

    const count = warns.length;
    const action = ESCALATION[count];
    let extra = '';

    if (action === 'timeout' && member.moderatable) {
      await member.timeout(60 * 60_000, `Al ${count}-lea avertisment`).catch(() => {});
      extra = '\n🔇 A primit automat **timeout 1 oră** (al 3-lea avertisment).';
    } else if (action === 'kick' && member.kickable) {
      extra = '\n👢 A fost dat afară automat (al 5-lea avertisment).';
    }

    await member.send({
      embeds: [embeds.custom(COLORS.warning)
        .setTitle(`⚠️ Avertisment pe ${interaction.guild.name}`)
        .setDescription(`**Motiv:** ${reason}\n**Total avertismente:** ${count}${extra}`)],
    }).catch(() => {});

    if (action === 'kick' && member.kickable) await member.kick(`Al ${count}-lea avertisment`).catch(() => {});

    await modLog(interaction.guild, {
      action: `Avertisment #${count}`, target: user, moderator: interaction.user, reason,
      extra: extra || undefined, color: COLORS.warning,
    });

    return interaction.reply({
      embeds: [embeds.custom(COLORS.warning)
        .setDescription(`⚠️ **${user.tag}** a primit avertismentul **#${count}**.\n**Motiv:** ${reason}${extra}`)],
    });
  },
};
