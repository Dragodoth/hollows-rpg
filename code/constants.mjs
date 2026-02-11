export const systemID = "hollows-rpg";

/* -------------------------------------------------- */

/**
 * Translates repository paths to Foundry Data paths.
 * @param {string} path - A path relative to the root of this repository.
 * @returns {string} The path relative to the Foundry data folder.
 */
export const systemPath = (path) => `systems/${systemID}/${path}`;

/* -------------------------------------------------- */

export const ASCII = `
░▒█░▒█░▄▀▀▄░█░░█░░▄▀▀▄░█░░░█░█▀▀░░░▒█▀▀▄░▒█▀▀█░▒█▀▀█
░▒█▀▀█░█░░█░█░░█░░█░░█░▀▄█▄▀░▀▀▄░░░▒█▄▄▀░▒█▄▄█░▒█░▄▄
░▒█░▒█░░▀▀░░▀▀░▀▀░░▀▀░░░▀░▀░░▀▀▀░░░▒█░▒█░▒█░░░░▒█▄▄▀
`;

/* -------------------------------------------------- */

/**
 * Effects that apply based on health type value.
 * @type {Record<string, {img: string, name: string, threshold: string | number}>}
 */
export const healthEffects = Object.freeze({
  resolve: {
    broken: {
      name: "DRAW_STEEL.Effect.Broken",
      hud: false,
      img: "icons/svg/stoned.svg",
      threshold: 0,
    }
  },
  wounds:{
    dying: {
      name: "DRAW_STEEL.Effect.Dying",
      hud: false,
      img: "icons/svg/skull.svg",
      threshold: 0,
    }
  }
});