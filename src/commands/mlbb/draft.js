import { SlashCommandBuilder } from 'discord.js';
import { db } from '../../lib/db.js';
import { newDraft, draftEmbed, draftButtons } from '../../components/draft.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('draft')
    .setDescription('Pornește un draft simulator (ban/pick în format MPL)')
    .addStringOption((o) => o.setName('echipa_albastra').setDescription('Numele echipei albastre').setMaxLength(30))
    .addStringOption((o) => o.setName('echipa_rosie').setDescription('Numele echipei roșii').setMaxLength(30)),

  cooldown: 5,

  async execute(interaction) {
    const teamA = interaction.options.getString('echipa_albastra') ?? config.squadTag;
    const teamB = interaction.options.getString('echipa_rosie') ?? 'Adversari';
    const draft = newDraft(teamA, teamB, interaction.user.id);

    await interaction.reply({
      embeds: [draftEmbed(draft)],
      components: draftButtons(draft),
    });
    const message = await interaction.fetchReply();

    db.set('drafts', `${interaction.guild.id}.${message.id}`, draft);
    return null;
  },
};
