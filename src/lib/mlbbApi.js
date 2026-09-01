/**
 * Verificarea contului de Mobile Legends.
 *
 * IMPORTANT — ce se poate si ce nu:
 * Moonton NU are un API public pentru statisticile jucatorilor (winrate,
 * stele, meciuri). Botul oficial de pe serverul lor (Halpo) are acces
 * special, pe care un bot tert nu-l poate obtine.
 *
 * Ce SE poate: endpoint-ul de validare folosit de site-urile de top-up
 * (Codashop & co.) confirma daca un User ID + Zone ID exista si intoarce
 * NUMELE REAL DIN JOC. Asta e suficient ca sa dovedesti ca un cont e al
 * tau si ca ID-ul e corect — restul statisticilor le confirma staff-ul
 * pe baza unui screenshot.
 *
 * Furnizorul se poate schimba din .env fara sa modifici codul:
 *   MLBB_NICKNAME_API=https://exemplu.tld/api?id={id}&server={server}
 */
import { config } from '../config/config.js';
import { console_ } from './logger.js';

const DEFAULT_NICKNAME_API = 'https://api.isan.eu.org/nickname/ml?id={id}&server={server}';
const TIMEOUT_MS = 8000;
const CACHE_TTL = 10 * 60_000;

const cache = new Map(); // "id:server" -> { at, result }

/** Cauta un nume intr-un raspuns JSON, oricum ar fi structurat. */
function extractName(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [
    payload.name, payload.nickname, payload.username, payload.userName,
    payload.data?.name, payload.data?.nickname, payload.data?.username,
    payload.result?.name, payload.result?.nickname,
    payload.confirmationFields?.username, payload.confirmationFields?.roles?.[0]?.role,
  ];
  const found = candidates.find((v) => typeof v === 'string' && v.trim().length);
  if (!found) return null;
  try {
    return decodeURIComponent(found).trim();
  } catch {
    return found.trim();
  }
}

/** Raspunsurile pot semnala explicit un esec chiar si cu status 200. */
function looksFailed(payload) {
  if (!payload || typeof payload !== 'object') return true;
  if (payload.success === false || payload.status === false) return true;
  if (typeof payload.message === 'string' && /not found|invalid|failed/i.test(payload.message)) return true;
  return false;
}

/**
 * Verifica un cont MLBB.
 * @returns {Promise<{ok: true, nickname: string} | {ok: false, reason: string}>}
 */
export async function lookupNickname(id, server) {
  if (!/^\d{5,15}$/.test(String(id)) || !/^\d{1,6}$/.test(String(server))) {
    return { ok: false, reason: 'ID-ul si zone ID-ul trebuie sa fie doar cifre (ex: `12345678` si `2019`).' };
  }

  const key = `${id}:${server}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.result;

  const template = process.env.MLBB_NICKNAME_API || DEFAULT_NICKNAME_API;
  const url = template.replace('{id}', encodeURIComponent(id)).replace('{server}', encodeURIComponent(server));

  let result;
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': `${config.squadTag}-DiscordBot/1.0` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      result = { ok: false, reason: `Serviciul de verificare a raspuns cu eroare (HTTP ${response.status}). Incearca peste cateva minute.` };
    } else {
      const payload = await response.json().catch(() => null);
      const nickname = extractName(payload);
      if (!nickname || looksFailed(payload)) {
        result = { ok: false, reason: 'Contul nu a fost gasit. Verifica User ID-ul si Zone ID-ul (cifrele din paranteza din joc).' };
      } else {
        result = { ok: true, nickname };
      }
    }
  } catch (err) {
    console_.warn('Verificare MLBB esuata:', err.message);
    result = {
      ok: false,
      reason: err.name === 'TimeoutError'
        ? 'Serviciul de verificare nu a raspuns la timp. Mai incearca o data.'
        : 'Nu am putut contacta serviciul de verificare. Poti completa manual cu `/profil stats` si sa ceri confirmare de la staff.',
    };
  }

  cache.set(key, { at: Date.now(), result });
  return result;
}

/**
 * OPTIONAL — daca gasesti vreodata un serviciu care da si statistici,
 * pui URL-ul in .env ca MLBB_STATS_API si botul le preia automat.
 * Fara variabila setata, functia nu face nimic.
 */
export async function lookupStats(id, server) {
  const template = process.env.MLBB_STATS_API;
  if (!template) return null;

  const url = template.replace('{id}', encodeURIComponent(id)).replace('{server}', encodeURIComponent(server));
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    const data = payload?.data ?? payload;
    if (!data || typeof data !== 'object') return null;

    const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
    const stats = {
      winrate: num(data.winrate ?? data.win_rate ?? data.wr),
      matches: num(data.matches ?? data.total_matches ?? data.games),
      points: num(data.points ?? data.rank_points ?? data.mythic_points),
      tier: typeof data.rank === 'string' ? data.rank : (typeof data.tier === 'string' ? data.tier : null),
    };
    return Object.values(stats).some((v) => v !== null) ? stats : null;
  } catch {
    return null;
  }
}
