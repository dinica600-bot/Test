import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder,
  TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { embeds, fail } from '../lib/embeds.js';
import { db } from '../lib/db.js';
import { findHero, ROLE_EMOJI } from '../data/heroes.js';
import { COLORS } from '../config/config.js';

/** Secventa oficiala de draft (format MPL): 1-2-2-1 cu doua faze de ban. */
export const DRAFT_SEQUENCE = [
  ...['A', 'B', 'A', 'B', 'A', 'B'].map((team) => ({ team, type: 'ban' })),
  ...[['A', 'pick'], ['B', 'pick'], ['B', 'pick'], ['A', 'pick'], ['A', 'pick'], ['B', 'pick']]
    .map(([team, type]) => ({ team, type })),
  ...['B', 'A', 'B', 'A'].map((team) => ({ team, type: 'ban' })),
  ...[['B', 'pick'], ['A', 'pick'], ['A', 'pick'], ['B', 'pick']].map(([team, type]) => ({ team, type })),
];

function fmt(list) {
  if (!list.length) return '_—_';
  return list.map((h) => `${ROLE_EMOJI[h.role] ?? '•'} ${h.name}`).join('\n');
}

export function draftEmbed(draft) {
  const step = DRAFT_SEQUENCE[draft.turn];
  const done = draft.turn >= DRAFT_SEQUENCE.length;
  const teamName = (t) => (t === 'A' ? `🔵 ${draft.teamA}` : `🔴 ${draft.teamB}`);

  return embeds
    .custom(done ? COLORS.success : step.team === 'A' ? 0x3b82f6 : 0xef4444)
    .setTitle('🧩 Draft Simulator')
    .setDescription(
      done
        ? '✅ **Draft complet!** Analizati comp-urile si stabiliti rotatiile.'
        : `**La rând:** ${teamName(step.team)} — ${step.type === 'ban' ? '🚫 BAN' : '✅ PICK'}\n` +
          `Pasul **${draft.turn + 1}/${DRAFT_SEQUENCE.length}**`,
    )
    .addFields(
      { name: `🔵 ${draft.teamA} — Picks`, value: fmt(draft.picksA), inline: true },
      { name: '​', value: '​', inline: true },
      { name: `🔴 ${draft.teamB} — Picks`, value: fmt(draft.picksB), inline: true },
      { name: '🚫 Bans', value: fmt(draft.bansA) || '_—_', inline: true },
      { name: '​', value: '​', inline: true },
      { name: '🚫 Bans', value: fmt(draft.bansB) || '_—_', inline: true },
    )
    .setFooter({ text: 'Apasa butonul si scrie numele eroului. /hero iti da detalii.' });
}

export function draftButtons(draft) {
  const done = draft.turn >= DRAFT_SEQUENCE.length;
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('draft:action').setLabel(done ? 'Draft complet' : 'Ban / Pick').setEmoji('🎯').setStyle(ButtonStyle.Primary).setDisabled(done),
      new ButtonBuilder().setCustomId('draft:undo').setLabel('Înapoi').setEmoji('↩️').setStyle(ButtonStyle.Secondary).setDisabled(draft.turn === 0),
      new ButtonBuilder().setCustomId('draft:reset').setLabel('Reset').setEmoji('🔄').setStyle(ButtonStyle.Danger),
    ),
  ];
}

export function newDraft(teamA, teamB, userId) {
  return { teamA, teamB, createdBy: userId, turn: 0, picksA: [], picksB: [], bansA: [], bansB: [] };
}

function usedNames(draft) {
  return [...draft.picksA, ...draft.picksB, ...draft.bansA, ...draft.bansB].map((h) => h.name);
}

export async function handleDraft(interaction) {
  const action = interaction.customId.split(':')[1];
  const key = `${interaction.guild.id}.${interaction.message.id}`;
  const draft = db.get('drafts', key);
  if (!draft) return fail(interaction, 'Draft-ul asta nu mai e activ. Porneste altul cu `/draft`.');

  if (action === 'action') {
    const modal = new ModalBuilder().setCustomId('draft:modal').setTitle('Ban / Pick');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('hero')
          .setLabel('Numele eroului')
          .setPlaceholder('ex: Fanny, Khufra, Yi Sun-shin')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );
    return interaction.showModal(modal);
  }

  if (action === 'undo') {
    draft.turn -= 1;
    const step = DRAFT_SEQUENCE[draft.turn];
    const list = step.type === 'ban'
      ? (step.team === 'A' ? draft.bansA : draft.bansB)
      : (step.team === 'A' ? draft.picksA : draft.picksB);
    list.pop();
    db.set('drafts', key, draft);
    return interaction.update({ embeds: [draftEmbed(draft)], components: draftButtons(draft) });
  }

  if (action === 'reset') {
    const fresh = newDraft(draft.teamA, draft.teamB, draft.createdBy);
    db.set('drafts', key, fresh);
    return interaction.update({ embeds: [draftEmbed(fresh)], components: draftButtons(fresh) });
  }
  return null;
}

export async function submitDraftHero(interaction) {
  const key = `${interaction.guild.id}.${interaction.message.id}`;
  const draft = db.get('drafts', key);
  if (!draft) return fail(interaction, 'Draft-ul asta nu mai e activ.');

  const input = interaction.fields.getTextInputValue('hero');
  const hero = findHero(input);
  if (!hero) return fail(interaction, `Nu gasesc eroul **${input}**. Verifica numele sau adauga-l in \`src/data/heroes.js\`.`);
  if (usedNames(draft).includes(hero.name)) {
    return fail(interaction, `**${hero.name}** e deja banat sau ales in draft-ul asta.`);
  }

  const step = DRAFT_SEQUENCE[draft.turn];
  const entry = { name: hero.name, role: hero.role };
  if (step.type === 'ban') (step.team === 'A' ? draft.bansA : draft.bansB).push(entry);
  else (step.team === 'A' ? draft.picksA : draft.picksB).push(entry);
  draft.turn += 1;
  db.set('drafts', key, draft);

  return interaction.update({ embeds: [draftEmbed(draft)], components: draftButtons(draft) });
}
