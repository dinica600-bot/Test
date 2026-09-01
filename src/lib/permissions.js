import { PermissionFlagsBits } from 'discord.js';
import { config } from '../config/config.js';
import { STAFF_KEYS } from '../config/blueprint.js';
import { getRole } from './guildMap.js';

/** Owner-ul configurat in .env sau owner-ul serverului trec peste orice. */
export function isOwner(member) {
  return member.id === config.ownerId || member.id === member.guild.ownerId;
}

/**
 * Rolurile care pot folosi comenzile de staff.
 *
 * Coach-ul e inclus aici (evalueaza tryout-urile, programeaza evenimente,
 * preia tickete), dar NU e in STAFF_KEYS — deci tot nu vede canalele de
 * staff si de logs. Daca nu vrei coach-ul aici, sterge-l din lista.
 */
const COMMAND_STAFF_KEYS = [...STAFF_KEYS, 'coach'];

/** Are unul din rolurile de staff (sau permisiuni echivalente)? */
export function isStaff(member) {
  if (isOwner(member)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  return COMMAND_STAFF_KEYS.some((key) => {
    const role = getRole(member.guild, key);
    return role && member.roles.cache.has(role.id);
  });
}

/** Poate modera (staff sau permisiuni de moderare). */
export function isMod(member) {
  return (
    isStaff(member) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    member.permissions.has(PermissionFlagsBits.KickMembers)
  );
}

/**
 * Verifica daca `moderator` are voie sa actioneze asupra lui `target`.
 * Returneaza un mesaj de eroare sau null daca e ok.
 */
export function canActOn(moderator, target) {
  if (!target) return 'Nu am gasit membrul pe server.';
  if (target.id === moderator.id) return 'Nu poti face asta cu tine insuti.';
  if (target.id === moderator.guild.ownerId) return 'Nu pot actiona asupra owner-ului serverului.';
  if (!isOwner(moderator) && target.roles.highest.position >= moderator.roles.highest.position) {
    return 'Membrul are un rol egal sau mai mare decat al tau.';
  }
  const me = moderator.guild.members.me;
  if (me && target.roles.highest.position >= me.roles.highest.position) {
    return 'Rolul meu e prea jos ca sa actionez asupra acestui membru. Muta rolul botului mai sus.';
  }
  return null;
}
