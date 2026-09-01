import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  ownerId: process.env.OWNER_ID,
  squadName: process.env.SQUAD_NAME || 'Blood×Diamonds',
  squadTag: process.env.SQUAD_TAG || 'BxD',
};

/** Culorile brandului — folosite in toate embed-urile. */
export const COLORS = {
  primary: 0xc1121f,      // rosu sange
  diamond: 0x38bdf8,      // albastru diamant
  success: 0x22c55e,
  warning: 0xf59e0b,
  danger: 0xef4444,
  info: 0x6366f1,
  neutral: 0x2b2d31,
  gold: 0xffd700,
};

export const EMOJI = {
  blood: '🩸',
  diamond: '💎',
  sword: '⚔️',
  shield: '🛡️',
  trophy: '🏆',
  fire: '🔥',
  star: '⭐',
  check: '✅',
  cross: '❌',
  warn: '⚠️',
  ticket: '🎫',
  crown: '👑',
  target: '🎯',
};

export function assertConfig() {
  const missing = ['token', 'clientId'].filter((k) => !config[k]);
  if (missing.length) {
    throw new Error(
      `Lipsesc variabile din .env: ${missing.join(', ')}. Copiaza .env.example in .env si completeaza-le.`,
    );
  }
}
