/**
 * Baza de date — JSON simplu pe disc (fara dependinte externe).
 * Fiecare "colectie" e un fisier in /data. Scrierea e debounced ca sa nu
 * loveasca discul la fiecare mesaj.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const cache = new Map();
const timers = new Map();

function file(name) {
  return join(DATA_DIR, `${name}.json`);
}

function load(name) {
  if (cache.has(name)) return cache.get(name);
  let data = {};
  try {
    if (existsSync(file(name))) data = JSON.parse(readFileSync(file(name), 'utf8'));
  } catch (err) {
    console.error(`[db] ${name}.json e corupt, pornesc de la zero:`, err.message);
    data = {};
  }
  cache.set(name, data);
  return data;
}

function scheduleSave(name) {
  if (timers.has(name)) return;
  timers.set(
    name,
    setTimeout(() => {
      timers.delete(name);
      try {
        writeFileSync(file(name), JSON.stringify(cache.get(name) ?? {}, null, 2));
      } catch (err) {
        console.error(`[db] nu am putut salva ${name}.json:`, err.message);
      }
    }, 1500),
  );
}

export const db = {
  /** Citeste o valoare. `path` poate fi "a.b.c". */
  get(name, path, fallback = null) {
    const data = load(name);
    if (!path) return data;
    const value = path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), data);
    return value === undefined || value === null ? fallback : value;
  },

  /** Seteaza o valoare pe un path. */
  set(name, path, value) {
    const data = load(name);
    const keys = path.split('.');
    const last = keys.pop();
    let target = data;
    for (const key of keys) {
      if (typeof target[key] !== 'object' || target[key] === null) target[key] = {};
      target = target[key];
    }
    target[last] = value;
    scheduleSave(name);
    return value;
  },

  /** Sterge o cheie. */
  delete(name, path) {
    const data = load(name);
    const keys = path.split('.');
    const last = keys.pop();
    let target = data;
    for (const key of keys) {
      if (typeof target[key] !== 'object' || target[key] === null) return false;
      target = target[key];
    }
    const existed = last in target;
    delete target[last];
    scheduleSave(name);
    return existed;
  },

  /** Adauga intr-un array. */
  push(name, path, value) {
    const arr = db.get(name, path, []);
    const list = Array.isArray(arr) ? arr : [];
    list.push(value);
    db.set(name, path, list);
    return list;
  },

  /** Incrementeaza un numar. */
  add(name, path, amount = 1) {
    const current = Number(db.get(name, path, 0)) || 0;
    return db.set(name, path, current + amount);
  },

  /** Salveaza imediat (folosit la oprirea botului). */
  flushAll() {
    for (const [name, timer] of timers) {
      clearTimeout(timer);
      timers.delete(name);
      try {
        writeFileSync(file(name), JSON.stringify(cache.get(name) ?? {}, null, 2));
      } catch (err) {
        console.error(`[db] flush ${name}:`, err.message);
      }
    }
  },
};

/** Setarile serverului (canale de log, toggle-uri automod etc). */
export const settings = {
  get(guildId, key, fallback = null) {
    return db.get('settings', `${guildId}.${key}`, fallback);
  },
  set(guildId, key, value) {
    return db.set('settings', `${guildId}.${key}`, value);
  },
  all(guildId) {
    return db.get('settings', guildId, {});
  },
};
