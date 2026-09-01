import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { asset, assetPath } from '../../lib/assets.js';
import { getChannel } from '../../lib/guildMap.js';
import { settings } from '../../lib/db.js';
import { COLORS, config } from '../../config/config.js';

/** Ce baner merge in ce canal. */
const PLACEMENTS = [
  { file: 'welcome.png', channel: 'welcome' },
  { file: 'banner-info.png', channel: 'announcements' },
  { file: 'banner-community.png', channel: 'general' },
  { file: 'banner-mlbb.png', channel: 'tips' },
  { file: 'banner-voice.png', channel: 'lfg' },
  { file: 'banner-competitive.png', channel: 'scrim-schedule' },
  { file: 'banner-academy.png', channel: 'training' },
  { file: 'banner-support.png', channel: 'faq' },
  { file: 'banner-staff.png', channel: 'staff-chat' },
];

async function postBanners(guild) {
  let posted = 0;
  let missing = 0;

  for (const { file, channel: key } of PLACEMENTS) {
    const channel = getChannel(guild, key);
    const attachment = asset(file);
    if (!channel?.isTextBased() || !attachment) { missing += 1; continue; }

    // stergem banerul pus data trecuta, ca sa nu se adune
    const previous = settings.get(guild.id, `decor.${key}`);
    if (previous) {
      await channel.messages.fetch(previous).then((m) => m.delete()).catch(() => {});
    }

    try {
      const message = await channel.send({ files: [attachment] });
      settings.set(guild.id, `decor.${key}`, message.id);
      posted += 1;
    } catch {
      missing += 1;
    }
  }
  return { posted, missing };
}

export default {
  data: new SlashCommandBuilder()
    .setName('decor')
    .setDescription('Pune iconul, avatarul botului și banerele pe canale')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('tot').setDescription('Toate de mai jos, dintr-o mișcare'))
    .addSubcommand((s) => s.setName('icon').setDescription('Setează iconul serverului'))
    .addSubcommand((s) => s.setName('avatar').setDescription('Setează poza de profil a botului'))
    .addSubcommand((s) => s.setName('banere').setDescription('Postează banerele în canale')),

  staffOnly: true,
  cooldown: 30,

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const { guild } = interaction;
    await interaction.deferReply();

    const done = [];
    const failed = [];
    const icon = assetPath('icon.png');

    if ((sub === 'tot' || sub === 'icon') && icon) {
      await guild.setIcon(icon, 'Icon Blood×Diamonds')
        .then(() => done.push('🖼️ **Iconul serverului** — pus'))
        .catch((err) => failed.push(`iconul serverului (${err.message})`));
    }

    if ((sub === 'tot' || sub === 'avatar') && icon) {
      await client.user.setAvatar(icon)
        .then(() => done.push('🤖 **Avatarul botului** — pus'))
        .catch(() => failed.push('avatarul botului (Discord permite doar 2 schimbări pe oră)'));
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
