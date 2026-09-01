/**
 * Router pentru butoane, meniuri si modale.
 * Fiecare customId are forma "namespace:actiune[:extra]".
 */
import { console_ } from '../lib/logger.js';
import { fail } from '../lib/embeds.js';
import * as tickets from './tickets.js';
import * as verify from './verify.js';
import * as selfroles from './selfroles.js';
import * as scrim from './scrim.js';
import * as tryout from './tryout.js';
import * as giveaway from './giveaway.js';
import * as poll from './poll.js';
import * as suggestion from './suggestion.js';
import * as draft from './draft.js';

export async function handleComponent(interaction) {
  const [namespace, action] = interaction.customId.split(':');

  try {
    switch (namespace) {
      case 'verify':
        return await verify.handleVerify(interaction);

      case 'selfrole':
        return await selfroles.handleSelfRole(interaction);

      case 'ticket':
        if (action === 'open') return await tickets.openTicket(interaction);
        if (action === 'claim') return await tickets.claimTicket(interaction);
        if (action === 'close') return await tickets.askCloseTicket(interaction);
        if (action === 'confirm') return await tickets.closeTicket(interaction);
        if (action === 'cancel') return await tickets.cancelClose(interaction);
        break;

      case 'scrim':
        return await scrim.handleScrim(interaction);

      case 'lfg':
        return await scrim.handleLfg(interaction);

      case 'tryout':
        if (action === 'apply') return await interaction.showModal(tryout.tryoutModal());
        if (action === 'modal') return await tryout.submitTryout(interaction);
        return await tryout.decideTryout(interaction);

      case 'giveaway':
        return await giveaway.handleGiveawayEnter(interaction);

      case 'poll':
        return await poll.handlePollVote(interaction);

      case 'suggest':
        return await suggestion.handleSuggestion(interaction);

      case 'draft':
        if (action === 'modal') return await draft.submitDraftHero(interaction);
        return await draft.handleDraft(interaction);

      default:
        break;
    }
    return null;
  } catch (err) {
    console_.error(`Eroare la componenta ${interaction.customId}:`, err);
    if (!interaction.replied && !interaction.deferred) {
      return fail(interaction, 'A aparut o eroare. Incearca din nou sau anunta staff-ul.').catch(() => {});
    }
    return null;
  }
}
