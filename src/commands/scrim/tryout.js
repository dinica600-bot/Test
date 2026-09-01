import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embeds, ts } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { tryoutModal, tryoutPanel } from '../../components/tryout.js';
import { isStaff } from '../../lib/permissions.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tryout')
    .setDescription('Recrutare pentru squad')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('aplica').setDescription('Completează formularul de aplicare'))
    .addSubcommand((s) => s.setName('panou').setDescription('(staff) Postează panoul de recrutare aici'))
    .addSubcommand((s) => s.setName('lista').setDescription('(staff) Aplicațiile în așteptare')),

  cooldown: 10,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'aplica') {
      const existing = db.get('applications', `${interaction.guild.id}.${interaction.user.id}`);
      if (existing?.status === 'pending') {
        return interaction.reply({
          embeds: [embeds.warn('Ai deja o aplicatie in asteptare. Ai rabdare, staff-ul o citeste.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.showModal(tryoutModal());
    }

    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [embeds.error('Doar staff-ul poate folosi subcomanda asta.')], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'panou') {
      await interaction.channel.send(tryoutPanel());
      return interaction.reply({ embeds: [embeds.success('Panoul de recrutare e postat.')], flags: MessageFlags.Ephemeral });
    }

    const all = db.get('applications', interaction.guild.id, {});
    const pending = Object.entries(all).filter(([, a]) => a.status === 'pending');

    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.gold)
          .setTitle('📥 Aplicații în așteptare')
          .setDescription(
            pending.length
              ? pending.map(([id, a]) => `<@${id}> — trimisa ${ts(a.at)}`).join('\n')
              : 'Nicio aplicatie in asteptare. 🎉',
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
