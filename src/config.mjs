import { preLocalize } from "./helpers/localization.mjs";

/**
 * The set of Stats used within the system.
 * These have special localization handling that checks for `HOLLOWS_RPG.Actor.Stat`.
 * The `label` is the full name (e.g. Strong).
 * @type {Record<string, {label: string; rollKey: string}>}
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
 * Configuration information for health types.
 * @type {Record<string, {label: string, color: foundry.utils.Color}>}
 */
export const health = {
  resolve: {
    label: "HOLLOWS_RPG.Health.Resolve",
    color: foundry.utils.Color.fromString("#ffab0f"),
  },
  wounds: {
    label: "HOLLOWS_RPG.Health.Wounds",
    color: foundry.utils.Color.fromString("#ff0f0f"),
  },
};
preLocalize("health", { key: "label" });

/**
 * Configuration information for healing types.
 * Keys correspond to keys in `system.stamina`.
 * This is included in ds.CONFIG not because the top level keys can be customized
 * but because the properties within the object can be customized.
 * @type {Record<string, {label: string}>}
 */
export const healingTypes = {
  value: {
    label: "HOLLOWS_RPG.Health.HealingType.Value",
  },
  temporary: {
    label: "HOLLOWS_RPG.Health.HealingType.Temporary",
  },
};
preLocalize("healingTypes", { key: "label" });

/**
 * List of exploration equipment.
 * @type {Record<string, {label: string}>}
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

/* -------------------------------------------------- */

export const itemResourceTypes = {
    token: {
        id: 'token',
        label: 'HOLLOWS_RPG.Item.ItemResourceType.token'
    },
    counter: {
        id: 'counter',
        label: 'HOLLOWS_RPG.Item.ItemResourceType.counter'
    },
};

preLocalize("itemResourceTypes", { key: "label" });