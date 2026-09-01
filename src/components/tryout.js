import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder,
  TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { embeds, fail } from '../lib/embeds.js';
import { TRYOUT_QUESTIONS } from '../config/blueprint.js';
import { getChannel, getRole } from '../lib/guildMap.js';
import { isStaff } from '../lib/permissions.js';
import { db } from '../lib/db.js';
import { COLORS, config } from '../config/config.js';
import { withBanner } from '../lib/assets.js';

export function tryoutPanel() {
  const embed = embeds
    .custom(COLORS.gold)
    .setTitle('🎯 Aplică pentru Blood×Diamonds')
    .setDescription(
      'Cautam jucatori seriosi pentru **roster** si **academy**.\n\n' +
      '**Ce cerem:**\n' +
      '⭐ minim Mythic (sau Legend cu potential clar)\n' +
      '🎙️ microfon si disponibilitate pentru scrim-uri seara\n' +
      '🧠 atitudine buna — invatam din greseli, nu dam vina\n' +
      '⏰ minim 4 seri pe saptamana\n\n' +
      '**Cum decurge:**\n' +
      '`1.` Completezi formularul de mai jos\n' +
      '`2.` Staff-ul il citeste (24-48h)\n' +
      '`3.` Primesti rol 🧪 Tryout si joci 3-5 scrim-uri\n' +
      '`4.` Decizie finala: Roster / Academy / Nu momentan',
    )
    .setFooter({ text: `${config.squadName} • recrutare deschisă` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tryout:apply').setLabel('Completează formularul').setEmoji('📝').setStyle(ButtonStyle.Success),
  );
  const files = withBanner(embed, 'banner-academy.png');
  return { embeds: [embed], components: [row], files };
}

export function tryoutModal() {
  const modal = new ModalBuilder().setCustomId('tryout:modal').setTitle('Aplicație Blood×Diamonds');
  for (const q of TRYOUT_QUESTIONS.slice(0, 5)) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(q.id)
          .setLabel(q.label.slice(0, 45))
          .setStyle(q.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setMaxLength(q.max)
          .setRequired(q.required),
      ),
    );
  }
  return modal;
}

export async function submitTryout(interaction) {
  const answers = TRYOUT_QUESTIONS.slice(0, 5).map((q) => ({
    name: q.label,
    value: interaction.fields.getTextInputValue(q.id) || '—',
  }));

  const channel = getChannel(interaction.guild, 'applications')
    ?? getChannel(interaction.guild, 'staff-chat');
  if (!channel?.isTextBased()) {
    return fail(interaction, 'Nu am gasit canalul de aplicatii. Roaga un admin sa ruleze `/setup server`.');
  }

  const embed = embeds
    .custom(COLORS.gold)
    .setTitle('📥 Aplicație nouă')
    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
    .setDescription(`Candidat: ${interaction.user} \`${interaction.user.id}\``)
    .addFields(answers)
    .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tryout:accept:${interaction.user.id}`).setLabel('Acceptă la tryout').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`tryout:academy:${interaction.user.id}`).setLabel('Academy').setEmoji('🎓').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`tryout:reject:${interaction.user.id}`).setLabel('Respinge').setEmoji('❌').setStyle(ButtonStyle.Danger),
  );

  const msg = await channel.send({ embeds: [embed], components: [row] });
  db.set('applications', `${interaction.guild.id}.${interaction.user.id}`, {
    messageId: msg.id, status: 'pending', at: Date.now(),
  });

  return interaction.reply({
    embeds: [embeds.success('Aplicatia ta a fost trimisa! Staff-ul iti raspunde in 24-48h. Mult noroc! 🩸')],
    flags: 64,
  });
}

export async function decideTryout(interaction) {
  if (!isStaff(interaction.member)) return fail(interaction, 'Doar staff-ul poate decide aplicatiile.');
  const [, decision, userId] = interaction.customId.split(':');
  const member = await interaction.guild.members.fetch(userId).catch(() => null);

  const map = {
    accept: { role: 'tryout', color: COLORS.success, title: '✅ Acceptat la tryout', dm: 'Felicitari! Ai trecut de prima etapa. Ai primit rolul **🧪 Tryout** — intra in `🧪︱tryout-chat` pentru detalii.' },
    academy: { role: 'academy', color: COLORS.diamond, title: '🎓 Trimis la Academy', dm: 'Ai fost acceptat in **Academy**! Te antrenezi cu noi si urci spre roster.' },
    reject: { role: null, color: COLORS.danger, title: '❌ Respins', dm: 'Momentan nu te putem primi in squad. Mai lucreaza la rank/consistenta si aplica din nou peste 30 de zile. Mult succes!' },
  }[decision];

  if (member && map.role) {
    const role = getRole(interaction.guild, map.role);
    if (role) await member.roles.add(role, `Aplicatie ${decision} de ${interaction.user.tag}`).catch(() => {});
  }
  if (member) {
    member.send({ embeds: [embeds.custom(map.color).setTitle(map.title).setDescription(map.dm)] }).catch(() => {});
  }

  db.set('applications', `${interaction.guild.id}.${userId}`, { status: decision, by: interaction.user.id, at: Date.now() });

  const original = interaction.message.embeds[0];
  const updated = embeds.custom(map.color)
    .setTitle(`${original.title} — ${map.title}`)
    .setAuthor(original.author)
    .setDescription(`${original.description}\n\nDecizie luata de ${interaction.user}.`)
    .addFields(original.fields ?? []);

  return interaction.update({ embeds: [updated], components: [] });
}
