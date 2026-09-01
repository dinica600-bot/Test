import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { isStaff } from '../../lib/permissions.js';

/** Ia canalul temporar al utilizatorului (trebuie sa fie in el si sa fie owner). */
function ownedChannel(interaction) {
  const channel = interaction.member.voice?.channel;
  if (!channel) return { error: 'Trebuie sa fii intr-un canal de voice.' };
  const temp = db.get('tempvc', `${interaction.guild.id}.${channel.id}`);
  if (!temp) return { error: 'Canalul asta nu e unul temporar. Intra in `➕ Creează canal` ca sa-ti faci unul.' };
  if (temp.ownerId !== interaction.user.id && !isStaff(interaction.member)) {
    return { error: `Doar <@${temp.ownerId}> poate modifica acest canal.` };
  }
  return { channel };
}

export default {
  data: new SlashCommandBuilder()
    .setName('vc')
    .setDescription('Controlează-ți canalul de voice temporar')
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('nume')
      .setDescription('Redenumește canalul')
      .addStringOption((o) => o.setName('text').setDescription('Noul nume').setRequired(true).setMaxLength(40)))
    .addSubcommand((s) => s
      .setName('limita')
      .setDescription('Câți oameni încap')
      .addIntegerOption((o) => o.setName('numar').setDescription('0 = fără limită').setRequired(true).setMinValue(0).setMaxValue(99)))
    .addSubcommand((s) => s.setName('blocheaza').setDescription('Nimeni nu mai poate intra'))
    .addSubcommand((s) => s.setName('deblocheaza').setDescription('Oricine poate intra din nou'))
    .addSubcommand((s) => s
      .setName('da-afara')
      .setDescription('Scoate pe cineva din canal')
      .addUserOption((o) => o.setName('membru').setDescription('Pe cine').setRequired(true)))
    .addSubcommand((s) => s
      .setName('invita')
      .setDescription('Dă acces cuiva la canalul blocat')
      .addUserOption((o) => o.setName('membru').setDescription('Pe cine').setRequired(true))),

  cooldown: 3,

  async execute(interaction) {
    const { channel, error } = ownedChannel(interaction);
    if (error) return interaction.reply({ embeds: [embeds.error(error)], flags: MessageFlags.Ephemeral });

    const sub = interaction.options.getSubcommand();
    const everyone = interaction.guild.roles.everyone;

    switch (sub) {
      case 'nume':
        await channel.setName(interaction.options.getString('text'));
        return interaction.reply({ embeds: [embeds.success('Am redenumit canalul.')], flags: MessageFlags.Ephemeral });

      case 'limita': {
        const n = interaction.options.getInteger('numar');
        await channel.setUserLimit(n);
        return interaction.reply({ embeds: [embeds.success(n ? `Limita e acum **${n}** persoane.` : 'Am scos limita.')], flags: MessageFlags.Ephemeral });
      }

      case 'blocheaza':
      case 'deblocheaza': {
        const lock = sub === 'blocheaza';
        await channel.permissionOverwrites.edit(everyone, { Connect: lock ? false : null });
        return interaction.reply({ embeds: [embeds.success(lock ? '🔒 Canal blocat.' : '🔓 Canal deschis.')], flags: MessageFlags.Ephemeral });
      }

      case 'da-afara': {
        const target = interaction.options.getMember('membru');
        if (target?.voice?.channelId !== channel.id) {
          return interaction.reply({ embeds: [embeds.error('Membrul nu e in canalul tau.')], flags: MessageFlags.Ephemeral });
        }
        await target.voice.disconnect('Dat afara din canalul temporar');
        await channel.permissionOverwrites.edit(target.id, { Connect: false });
        return interaction.reply({ embeds: [embeds.success(`${target} a fost scos din canal.`)], flags: MessageFlags.Ephemeral });
      }

      default: {
        const target = interaction.options.getMember('membru');
        await channel.permissionOverwrites.edit(target.id, {
          Connect: true, ViewChannel: true, Speak: true,
        });
        await target.send({
          embeds: [embeds.info(`${interaction.user} te-a invitat in canalul **${channel.name}** de pe **${interaction.guild.name}**.`)],
        }).catch(() => {});
        return interaction.reply({ embeds: [embeds.success(`${target} are acum acces.`)], flags: MessageFlags.Ephemeral });
      }
    }
  },
};
