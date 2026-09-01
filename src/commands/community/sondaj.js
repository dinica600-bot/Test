import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../../lib/db.js';
import { pollEmbed, pollButtons } from '../../components/poll.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sondaj')
    .setDescription('Creează un sondaj cu butoane')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setDMPermission(false)
    .addStringOption((o) => o.setName('intrebare').setDescription('Întrebarea').setRequired(true).setMaxLength(200))
    .addStringOption((o) => o.setName('optiunea1').setDescription('Prima opțiune').setRequired(true).setMaxLength(40))
    .addStringOption((o) => o.setName('optiunea2').setDescription('A doua opțiune').setRequired(true).setMaxLength(40))
    .addStringOption((o) => o.setName('optiunea3').setDescription('A treia opțiune').setMaxLength(40))
    .addStringOption((o) => o.setName('optiunea4').setDescription('A patra opțiune').setMaxLength(40))
    .addStringOption((o) => o.setName('optiunea5').setDescription('A cincea opțiune').setMaxLength(40))
    .addRoleOption((o) => o.setName('ping').setDescription('Rol de menționat')),

  cooldown: 10,

  async execute(interaction) {
    const options = [1, 2, 3, 4, 5]
      .map((i) => interaction.options.getString(`optiunea${i}`))
      .filter(Boolean);

    const poll = {
      question: interaction.options.getString('intrebare'),
      options,
      votes: {},
      by: interaction.user.id,
      at: Date.now(),
    };

    const role = interaction.options.getRole('ping');
    await interaction.reply({
      content: role ? `${role}` : undefined,
      embeds: [pollEmbed(poll)],
      components: pollButtons(poll),
      allowedMentions: { roles: role ? [role.id] : [] },
    });
    const message = await interaction.fetchReply();
    db.set('polls', `${interaction.guild.id}.${message.id}`, poll);
    return null;
  },
};
