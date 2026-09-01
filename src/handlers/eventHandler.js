import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { console_ } from '../lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_DIR = join(__dirname, '..', 'events');

export async function loadEvents(client) {
  let count = 0;
  for (const file of readdirSync(EVENTS_DIR).filter((f) => f.endsWith('.js'))) {
    const mod = await import(pathToFileURL(join(EVENTS_DIR, file)).href);
    const event = mod.default;
    if (!event?.name || typeof event.execute !== 'function') {
      console_.warn(`Event invalid: ${file}`);
      continue;
    }
    if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
    else client.on(event.name, (...args) => event.execute(...args, client));
    count += 1;
  }
  console_.ok(`Am incarcat ${count} evenimente.`);
}
