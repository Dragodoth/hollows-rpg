import { preLocalize } from "./helpers/localization.mjs";

/**
 * The set of Stats used within the system.
 * @type {Object}
 */
export const stats = Object.seal({
  strong: {
    label: 'HOLLOWS_RPG.Actor.Stat.strong',
    rollKey: 'strong'
  },
  hard: {
    label: 'HOLLOWS_RPG.Actor.Stat.hard',
    rollKey: 'hard'
  },
  quick: {
    label: 'HOLLOWS_RPG.Actor.Stat.quick',
    rollKey: 'quick'
  },
  sharp: {
    label: 'HOLLOWS_RPG.Actor.Stat.sharp',
    rollKey: 'sharp'
  },
  wise: {
    label: 'HOLLOWS_RPG.Actor.Stat.wise',
    rollKey: 'wise'
  },
});
preLocalize("stats", { key: "label" });

/**
 * Configuration information for healing types.
 */
export const health = {
  resolve: {
    label: "HOLLOWS_RPG.Health.Resolve",
    color: foundry.utils.Color.fromString("#ffed61"),
  },
  wounds: {
    label: "HOLLOWS_RPG.Health.Wounds",
    color: foundry.utils.Color.fromString("#ff870f"),
  },
};
preLocalize("health", { key: "label" });

/**
 * List of exploration equipment.
 * @type {Record<string, {label: string, group: string}>}
 */
export const explorationEquipmentList = {
  cloak: {
    label: "HOLLOWS_RPG.Equipment.Exploration.Cloak"
  },
  crrowbar: {
    label: "HOLLOWS_RPG.Equipment.Exploration.Crowbar"
  },
  dowsingkit: {
    label: "HOLLOWS_RPG.Equipment.Exploration.DowsingKit"
  },
  finery: {
    label: "HOLLOWS_RPG.Equipment.Exploration.Finery"
  },
  gin: {
    label: "HOLLOWS_RPG.Equipment.Exploration.Gin"
  },
  goodBooks: {
    label: "HOLLOWS_RPG.Equipment.Exploration.GoodBooks"
  },
  hammerAndNails: {
    label: "HOLLOWS_RPG.Equipment.Exploration.HammerAndNails"
  },
  lantern: {
    label: "HOLLOWS_RPG.Equipment.Exploration.Lantern"
  },
  rope: {
    label: "HOLLOWS_RPG.Equipment.Exploration.Rope"
  },
  spade: {
    label: "HOLLOWS_RPG.Equipment.Exploration.Spade"
  },
  telescope: {
    label: "HOLLOWS_RPG.Equipment.Exploration.Telescope"
  },
  tobacco: {
    label: "HOLLOWS_RPG.Equipment.Exploration.Tobacco"
  }
}

preLocalize("explorationEquipmentList", { key: "label" });