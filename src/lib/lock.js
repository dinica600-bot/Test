/**
 * Blocheaza pornirea a doua boturi in acelasi timp.
 *
 * Daca ruleaza doua copii, fiecare primeste aceleasi mesaje si raspunde
 * separat — utilizatorii vad totul dublat sau triplat. Fisierul de lock
 * tine minte PID-ul procesului activ; daca acela mai traieste, a doua
 * pornire se opreste cu un mesaj clar in loc sa faca dezastru.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { console_ } from './logger.js';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const LOCK = join(DATA, 'bot.lock');

function alive(pid) {
  try {
    process.kill(pid, 0); // semnalul 0 nu omoara nimic, doar verifica
    return true;
  } catch {
    return false;
  }
}

/** Returneaza false daca deja ruleaza alt bot. */
export function acquireLock() {
  if (!existsSync(DATA)) mkdirSync(DATA, { recursive: true });

  if (existsSync(LOCK)) {
    const pid = Number(readFileSync(LOCK, 'utf8').trim());
    if (pid && pid !== process.pid && alive(pid)) {
      console_.error(`Botul ruleaza deja (proces ${pid}).`);
      console_.info('Doua copii pornite inseamna raspunsuri duble in chat.');
      console_.info('Opreste-le pe toate cu:  pkill node    apoi porneste una singura.');
      return false;
    }
    // lock ramas de la un proces mort — il luam noi
  }

  writeFileSync(LOCK, String(process.pid));
  return true;
}

export function releaseLock() {
  try {
    if (existsSync(LOCK) && Number(readFileSync(LOCK, 'utf8').trim()) === process.pid) {
      unlinkSync(LOCK);
    }
  } catch { /* la iesire nu mai avem ce face */ }
}
