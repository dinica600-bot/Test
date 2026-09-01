import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { asset, assetPath } from '../../lib/assets.js';
import { emojiName, setEmojiId, FALLBACK } from '../../lib/emojis.js';
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

/** Incarca emoji-urile din assets/emoji. Nu cere boost-uri. */
async function uploadEmojis(guild) {
  const uploaded = [];
  const skipped = [];
  const failed = [];

  for (const key of Object.keys(FALLBACK)) {
    const name = emojiName(key);
    const path = assetPath(`emoji/emoji-${key}.png`);
    if (!path) { failed.push(key); continue; }

    const existing = guild.emojis.cache.find((em) => em.name === name);
    if (existing) {
      setEmojiId(guild.id, key, existing.id);
      skipped.push(`<:${name}:${existing.id}>`);
      continue;
    }

    try {
      const emoji = await guild.emojis.create({ attachment: path, name, reason: 'Pachet emoji Blood×Diamonds' });
      setEmojiId(guild.id, key, emoji.id);
      uploaded.push(`<:${name}:${emoji.id}>`);
    } catch (err) {
      failed.push(`${key} (${err.message.slice(0, 40)})`);
    }
  }
  return { uploaded, skipped, failed };
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
