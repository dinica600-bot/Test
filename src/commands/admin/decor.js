import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { applyIcon, applyAvatar, uploadEmojis, postBanners } from '../../lib/decor.js';
import { COLORS, config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('decor')
    .setDescription('Pune iconul, avatarul botului și banerele pe canale')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('tot').setDescription('Toate de mai jos, dintr-o mișcare'))
    .addSubcommand((s) => s.setName('icon').setDescription('Setează iconul serverului'))
    .addSubcommand((s) => s.setName('avatar').setDescription('Setează poza de profil a botului'))
    .addSubcommand((s) => s.setName('banere').setDescription('Postează banerele în canale'))
    .addSubcommand((s) => s.setName('emoji').setDescription('Încarcă pachetul de emoji al squad-ului (nu cere boost-uri)')),

  staffOnly: true,
  cooldown: 30,

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const { guild } = interaction;
    await interaction.deferReply();

    const done = [];
    const failed = [];

    if (sub === 'tot' || sub === 'icon') {
      await applyIcon(guild)
        .then(() => done.push('🖼️ **Iconul serverului** — pus'))
        .catch((err) => failed.push(`iconul serverului (${err.message})`));
    }

    if (sub === 'tot' || sub === 'avatar') {
      await applyAvatar(client)
        .then(() => done.push('🤖 **Avatarul botului** — pus'))
        .catch(() => failed.push('avatarul botului (Discord permite doar 2 schimbări pe oră)'));
    }

    if (sub === 'tot' || sub === 'emoji') {
      const { uploaded, skipped, failed: bad } = await uploadEmojis(guild);
      if (uploaded.length) done.push(`😀 **${uploaded.length} emoji** încărcate: ${uploaded.join(' ')}`);
      if (skipped.length) done.push(`♻️ **${skipped.length} emoji** existau deja: ${skipped.join(' ')}`);
      if (bad.length) failed.push(`${bad.length} emoji (${bad[0]})`);
    }

    if (sub === 'tot' || sub === 'banere') {
      const { posted, missing } = await postBanners(guild);
      if (posted) done.push(`🎨 **${posted} banere** postate în canale`);
      if (missing) failed.push(`${missing} banere (canalul lipsește — rulează \`/setup server\`)`);
    }

    const embed = embeds
      .custom(done.length ? COLORS.success : COLORS.warning)
      .setTitle('✨ Decor aplicat')
      .setDescription(done.length ? done.join('\n') : 'Nu am putut aplica nimic.')
      .setFooter({ text: `${config.squadName} • imaginile se regenerează cu scripts/generate-assets.py` });

    if (failed.length) embed.addFields({ name: '⚠️ N-au mers', value: failed.join('\n') });

    return interaction.editReply({ embeds: [embed] });
  },
};
