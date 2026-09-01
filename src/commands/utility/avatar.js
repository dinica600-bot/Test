import { SlashCommandBuilder } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Poza de profil a unui membru')
    .addUserOption((o) => o.setName('membru').setDescription('Al cui avatar')),

  cooldown: 3,

  async execute(interaction) {
    const user = interaction.options.getUser('membru') ?? interaction.user;
    const url = user.displayAvatarURL({ size: 1024, extension: 'png' });
    return interaction.reply({
      embeds: [
        embeds.custom(COLORS.diamond)
          .setTitle(`🖼️ Avatarul lui ${user.username}`)
          .setImage(url)
          .setDescription(`[Descarcă](${url})`),
      ],
    });
  },
};
