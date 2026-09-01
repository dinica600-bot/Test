/**
 * Stiluri avansate de rol — nume cu gradient sau holografice.
 *
 * Discord le numeste "Enhanced Role Styles". Nu sunt pentru orice server:
 *   • gradient (2 culori)  → serverul are nevoie de Nivel 2 de boost
 *   • holografic (animat)  → Nivel 3 de boost
 * Daca serverul nu are boost-urile, Discord respinge cererea — noi prindem
 * eroarea si rolul ramane cu culoarea simpla, fara sa se strice nimic.
 */
import { Constants } from 'discord.js';

/**
 * Incearca sa aplice stilul definit in blueprint.
 * @returns {'holographic'|'gradient'|null} ce s-a aplicat efectiv
 */
export async function applyRoleStyle(role, def) {
  if (!role || (!def?.gradient && !def?.holographic)) return null;

  try {
    if (def.holographic) {
      await role.setColors({
        primaryColor: Constants.HolographicStyle.Primary,
        secondaryColor: Constants.HolographicStyle.Secondary,
        tertiaryColor: Constants.HolographicStyle.Tertiary,
      }, 'Stil de rol Blood×Diamonds');
      return 'holographic';
    }
    await role.setColors({
      primaryColor: def.gradient[0],
      secondaryColor: def.gradient[1],
    }, 'Stil de rol Blood×Diamonds');
    return 'gradient';
  } catch {
    // serverul nu are boost-urile necesare — ramane culoarea simpla
    return null;
  }
}

/** Cate roluri din blueprint au un stil definit. */
export function countStyled(roles) {
  return roles.filter((r) => r.gradient || r.holographic).length;
}
