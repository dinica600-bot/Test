import {
  SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags,
} from 'discord.js';
import { ROLES, CATEGORIES, VISIBILITY_ROLES, STAFF_KEYS } from '../../config/blueprint.js';
import { embeds } from '../../lib/embeds.js';
import { setRoleId, setChannelId, getChannel, getRole } from '../../lib/guildMap.js';
import { settings } from '../../lib/db.js';
import { console_ } from '../../lib/logger.js';
import { COLORS, config } from '../../config/config.js';
import { verifyPanel, rulesMessage } from '../../components/verify.js';
import { applyRoleStyle, countStyled } from '../../lib/roleStyles.js';
import { selfRolePanels } from '../../components/selfroles.js';
import { ticketPanel } from '../../components/tickets.js';
import { tryoutPanel } from '../../components/tryout.js';

const P = PermissionFlagsBits;
const TYPE_MAP = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  announcement: ChannelType.GuildAnnouncement,
  forum: ChannelType.GuildForum,
  stage: ChannelType.GuildStageVoice,
};

const VIEW = [P.ViewChannel, P.ReadMessageHistory];
const TEXT = [P.SendMessages, P.AddReactions, P.AttachFiles, P.EmbedLinks,
  P.UseApplicationCommands, P.SendMessagesInThreads, P.CreatePublicThreads];
const VOICE = [P.Connect, P.Speak, P.Stream, P.UseVAD, P.UseEmbeddedActivities];

/** Construieste lista de permisiuni pentru un canal/categorie. */
function buildOverwrites(guild, def, roleId) {
  const overwrites = [];
  const everyone = guild.roles.everyone.id;
  const isVoice = def.type === 'voice' || def.type === 'stage';
  const isCategory = !def.type;
  // categoriile trebuie sa dea si permisiuni de voice, altfel canalele
  // de voice din ele mostenesc "Connect: deny" de la @everyone
  const grant = isCategory ? [...VIEW, ...TEXT, ...VOICE]
    : isVoice ? [...VIEW, ...VOICE] : [...VIEW, ...TEXT];

  const allowedKeys = def.restrict
    ? [...new Set([...def.restrict, ...STAFF_KEYS])]
    : VISIBILITY_ROLES[def.visibility ?? 'member'];

  if (!allowedKeys) {
    // canal public — toata lumea vede
    overwrites.push({
      id: everyone,
      allow: def.readonly ? VIEW : grant,
      deny: def.readonly ? [P.SendMessages, P.CreatePublicThreads] : [],
    });
    if (def.readonly) {
      // staff-ul trebuie sa poata scrie in canalele read-only
      for (const key of STAFF_KEYS) {
        const id = roleId(key);
        if (id) overwrites.push({ id, allow: grant });
      }
    }
  } else {
    overwrites.push({ id: everyone, deny: [P.ViewChannel, P.Connect] });
    for (const key of allowedKeys) {
      const id = roleId(key);
      if (!id) continue;
      const staff = STAFF_KEYS.includes(key);
      overwrites.push({
        id,
        allow: def.readonly && !staff ? VIEW : grant,
        deny: def.readonly && !staff ? [P.SendMessages, P.CreatePublicThreads] : [],
      });
    }
  }

  if (def.locked) {
    // canalele de statistici: nimeni nu intra in ele
    for (const ow of overwrites) ow.deny = [...(ow.deny ?? []), P.Connect];
  }

  const mutedId = roleId('muted');
  if (mutedId) {
    overwrites.push({
      id: mutedId,
      deny: [P.SendMessages, P.AddReactions, P.Speak, P.SendMessagesInThreads, P.CreatePublicThreads],
    });
  }

  const botId = guild.members.me?.id;
  if (botId) overwrites.push({ id: botId, allow: [...VIEW, ...TEXT, ...VOICE, P.ManageMessages, P.ManageChannels] });

  return overwrites;
}

async function createRoles(guild, report) {
  const map = new Map();
  for (const def of ROLES) {
    let role = guild.roles.cache.find((r) => r.name === def.name);
    if (!role) {
      try {
        role = await guild.roles.create({
          name: def.name,
          color: def.color,
          hoist: def.hoist,
          mentionable: def.mentionable,
          permissions: (def.perms ?? []).map((p) => P[p]).filter(Boolean),
          reason: 'Setup Blood×Diamonds',
        });
        report.rolesCreated += 1;
      } catch (err) {
        console_.error(`Rol ${def.name}:`, err.message);
        report.errors.push(`rol **${def.name}**: ${err.message}`);
        continue;
      }
    } else {
      report.rolesExisting += 1;
    }

    // nume cu gradient / holografic (cere boost-uri pe server)
    if (await applyRoleStyle(role, def)) report.styled += 1;

    map.set(def.key, role.id);
    setRoleId(guild.id, def.key, role.id);
  }
  return map;
}

async function createChannels(guild, roleMap, report) {
  const roleId = (key) => roleMap.get(key) ?? null;

  for (const cat of CATEGORIES) {
    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === cat.name,
    );
    if (!category) {
      try {
        category = await guild.channels.create({
          name: cat.name,
          type: ChannelType.GuildCategory,
          permissionOverwrites: buildOverwrites(guild, cat, roleId),
          reason: 'Setup Blood×Diamonds',
        });
        report.categoriesCreated += 1;
      } catch (err) {
        report.errors.push(`categoria **${cat.name}**: ${err.message}`);
        continue;
      }
    }
    setChannelId(guild.id, cat.key, category.id);

    for (const ch of cat.channels) {
      const exists = guild.channels.cache.find((c) => c.name === ch.name && c.parentId === category.id);
      if (exists) {
        setChannelId(guild.id, ch.key, exists.id);
        report.channelsExisting += 1;
        continue;
      }

      const def = { ...ch, visibility: ch.visibility ?? cat.visibility };
      const payload = {
        name: ch.name,
        type: TYPE_MAP[ch.type] ?? ChannelType.GuildText,
        parent: category.id,
        topic: ch.type === 'text' || ch.type === 'announcement' ? ch.topic : undefined,
        rateLimitPerUser: ch.slowmode,
        userLimit: ch.userLimit,
        permissionOverwrites: buildOverwrites(guild, def, roleId),
        reason: 'Setup Blood×Diamonds',
      };

      let channel = null;
      try {
        channel = await guild.channels.create(payload);
      } catch {
        // serverul poate sa nu aiba Community activat (announcement/stage/forum)
        try {
          channel = await guild.channels.create({ ...payload, type: ChannelType.GuildText, userLimit: undefined });
          report.errors.push(`**${ch.name}** creat ca text (tipul ${ch.type} cere Community activat).`);
        } catch (err2) {
          report.errors.push(`canalul **${ch.name}**: ${err2.message}`);
          continue;
        }
      }

      setChannelId(guild.id, ch.key, channel.id);
      report.channelsCreated += 1;

      if (ch.afk && channel.type === ChannelType.GuildVoice) {
        await guild.setAFKChannel(channel).catch(() => {});
        await guild.setAFKTimeout(300).catch(() => {});
      }
    }
  }
}

/** Mapeaza canalele de log in setari. */
function mapLogs(guild) {
  const pairs = {
    join: 'log-join', message: 'log-message', mod: 'log-mod',
    voice: 'log-voice', ticket: 'log-ticket', bot: 'log-bot',
  };
  let mapped = 0;
  for (const [type, key] of Object.entries(pairs)) {
    const channel = getChannel(guild, key);
    if (channel) { settings.set(guild.id, `logs.${type}`, channel.id); mapped += 1; }
  }
  return mapped;
}

async function postPanels(guild, report) {
  const send = async (key, payload) => {
    const channel = getChannel(guild, key);
    if (!channel?.isTextBased()) return;
    try {
      const existing = await channel.messages.fetch({ limit: 20 }).catch(() => null);
      const mine = existing?.find((m) => m.author.id === guild.client.user.id && m.components.length);
      if (mine) {
        if (payload.files?.length) await mine.delete().catch(() => {});
        else { await mine.edit(payload); return; }
      }
      await channel.send(payload);
      report.panels += 1;
    } catch (err) {
      report.errors.push(`panoul din **${key}**: ${err.message}`);
    }
  };

  const rules = getChannel(guild, 'rules');
  if (rules?.isTextBased()) {
    const existing = await rules.messages.fetch({ limit: 10 }).catch(() => null);
    const mine = existing?.find((m) => m.author.id === guild.client.user.id);
    // mesajele cu imagine atasata nu se pot edita, asa ca il rescriem
    if (mine) await mine.delete().catch(() => {});
    await rules.send(rulesMessage()).catch(() => {});
    report.panels += 1;
  }

  await send('verify', verifyPanel());
  await send('ticket-panel', ticketPanel());
  await send('how-to-apply', tryoutPanel());

  const rolesChannel = getChannel(guild, 'roles');
  if (rolesChannel?.isTextBased()) {
    const existing = await rolesChannel.messages.fetch({ limit: 20 }).catch(() => null);
    const mine = existing?.filter((m) => m.author.id === guild.client.user.id);
    const panels = selfRolePanels(guild);
    if (mine?.size >= panels.length) {
      const sorted = [...mine.values()].reverse();
      for (let i = 0; i < panels.length; i += 1) await sorted[i]?.edit(panels[i]).catch(() => {});
    } else {
      for (const panel of panels) { await rolesChannel.send(panel).catch(() => {}); report.panels += 1; }
    }
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Construiește sau repară serverul Blood×Diamonds')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('server')
      .setDescription('Creează toate rolurile, categoriile, canalele și panourile'))
    .addSubcommand((s) => s
      .setName('panouri')
      .setDescription('Repostează panourile (verificare, self-roles, tickete, tryout)'))
    .addSubcommand((s) => s
      .setName('logs')
      .setDescription('Reconectează canalele de log la bot'))
    .addSubcommand((s) => s
      .setName('stiluri')
      .setDescription('Aplică nume cu gradient și holografice pe rolurile de staff (cere boost-uri)'))
    .addSubcommand((s) => s
      .setName('status')
      .setDescription('Arată ce lipsește față de blueprint')),

  staffOnly: true,
  cooldown: 10,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const { guild } = interaction;

    if (!guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        embeds: [embeds.error(
          'Am nevoie de permisiunea **Administrator** ca sa construiesc serverul.\n' +
          'Du-te in Setari server → Roluri → rolul botului si activeaza-o. ' +
          'Muta si rolul botului cat mai sus in lista.',
        )],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'status') {
      const missingRoles = ROLES.filter((r) => !getRole(guild, r.key));
      const missingChannels = CATEGORIES.flatMap((c) => c.channels).filter((c) => !getChannel(guild, c.key));
      return interaction.reply({
        embeds: [
          embeds.custom(missingRoles.length || missingChannels.length ? COLORS.warning : COLORS.success)
            .setTitle('🔍 Status server')
            .addFields(
              { name: 'Roluri', value: `${ROLES.length - missingRoles.length}/${ROLES.length} existente`, inline: true },
              { name: 'Canale', value: `${CATEGORIES.flatMap((c) => c.channels).length - missingChannels.length}/${CATEGORIES.flatMap((c) => c.channels).length} existente`, inline: true },
              { name: 'Lipsesc roluri', value: missingRoles.map((r) => r.name).join(', ').slice(0, 1000) || '_niciunul_' },
              { name: 'Lipsesc canale', value: missingChannels.map((c) => c.name).join(', ').slice(0, 1000) || '_niciunul_' },
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();
    const report = {
      rolesCreated: 0, rolesExisting: 0, categoriesCreated: 0,
      channelsCreated: 0, channelsExisting: 0, panels: 0, styled: 0, errors: [],
    };

    if (sub === 'stiluri') {
      const styled = [];
      const failed = [];
      for (const def of ROLES.filter((r) => r.gradient || r.holographic)) {
        const role = getRole(guild, def.key);
        if (!role) continue;
        const applied = await applyRoleStyle(role, def);
        if (applied) styled.push(`${role} — ${applied === 'holographic' ? '✨ holografic' : '🌈 gradient'}`);
        else failed.push(role.name);
      }

      const embed = embeds
        .custom(styled.length ? COLORS.success : COLORS.warning)
        .setTitle('🎨 Stiluri de rol')
        .setDescription(
          styled.length
            ? `Am stilizat **${styled.length}** roluri:\n\n${styled.join('\n')}`
            : 'N-am putut aplica niciun stil.',
        );

      if (failed.length) {
        embed.addFields({
          name: `⚠️ N-au mers (${failed.length})`,
          value:
            'Discord cere boost-uri pe server pentru stilurile astea:\n' +
            '• **Nivel 2** (7 boost-uri) → nume cu gradient\n' +
            '• **Nivel 3** (14 boost-uri) → nume holografice\n\n' +
            'Rolurile au ramas cu culoarea simpla si totul functioneaza normal. ' +
            'Cand ajungi la boost-uri, rulezi din nou `/setup stiluri`.',
        });
      }
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'logs') {
      const mapped = mapLogs(guild);
      return interaction.editReply({
        embeds: [embeds.success(`Am conectat **${mapped}/6** canale de log.`)],
      });
    }

    if (sub === 'panouri') {
      await postPanels(guild, report);
      return interaction.editReply({
        embeds: [embeds.success(`Am (re)postat **${report.panels}** panouri.`)],
      });
    }

    // ---- setup complet ----
    await interaction.editReply({
      embeds: [embeds.info('🩸 Construiesc serverul... **Pasul 1/4** — creez rolurile.', 'Setup în curs')],
    });
    const roleMap = await createRoles(guild, report);

    await interaction.editReply({
      embeds: [embeds.info('🩸 **Pasul 2/4** — creez categoriile si canalele. Poate dura un minut.', 'Setup în curs')],
    });
    await createChannels(guild, roleMap, report);

    await interaction.editReply({
      embeds: [embeds.info('🩸 **Pasul 3/4** — conectez log-urile.', 'Setup în curs')],
    });
    mapLogs(guild);

    await interaction.editReply({
      embeds: [embeds.info('🩸 **Pasul 4/4** — postez panourile.', 'Setup în curs')],
    });
    await postPanels(guild, report);

    settings.set(guild.id, 'setupDoneAt', Date.now());

    const summary = embeds
      .custom(COLORS.success)
      .setTitle(`${config.squadName} — server construit! 🩸💎`)
      .setDescription('Totul e gata. Mai jos ai raportul si urmatorii pasi.')
      .addFields(
        { name: '🎭 Roluri', value: `create: **${report.rolesCreated}**\nexistente: **${report.rolesExisting}**`, inline: true },
        { name: '📁 Categorii', value: `create: **${report.categoriesCreated}**`, inline: true },
        { name: '💬 Canale', value: `create: **${report.channelsCreated}**\nexistente: **${report.channelsExisting}**`, inline: true },
        {
          name: '🎨 Stiluri de nume',
          value: report.styled
            ? `**${report.styled}/${countStyled(ROLES)}** roluri au nume cu gradient sau holografic`
            : `0/${countStyled(ROLES)} — cer boost-uri pe server (Nivel 2 pentru gradient, 3 pentru holografic). Ruleaza \`/setup stiluri\` cand le ai.`,
        },
        {
          name: '✅ Ce faci acum',
          value:
            '`1.` Muta rolul botului **deasupra** tuturor rolurilor create.\n' +
            '`2.` Da-ti singur rolul 🩸 Owner.\n' +
            '`3.` Verifica-te in `✅︱verificare` ca sa testezi fluxul.\n' +
            '`4.` Ruleaza `/decor tot` — pune iconul serverului si banerele pe canale.\n' +
            '`5.` Ruleaza `/config vezi` ca sa reglezi automod si nivele.\n' +
            '`6.` Invita membrii — au tot ce le trebuie in `👋︱bun-venit`.',
        },
      );

    if (report.errors.length) {
      summary.addFields({
        name: '⚠️ Avertismente',
        value: report.errors.slice(0, 8).join('\n').slice(0, 1000),
      });
    }

    return interaction.editReply({ embeds: [summary] });
  },
};
