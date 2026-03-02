import { preLocalize } from "./helpers/localization.mjs";
import { pseudoDocuments } from "./data/_module.mjs";

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
 * The set of Stats used within the system.
 * These have special localization handling that checks for `HOLLOWS_RPG.Actor.Stat`.
 * The `label` is the full name (e.g. Strong).
 * @type {Record<string, {label: string; rollKey: string}>}
 */
export const ranges = Object.seal({
  close: {
    label: 'HOLLOWS_RPG.Scene.Range.close.label',
    front: {
      label: 'HOLLOWS_RPG.Scene.Range.close.front',
    },
    flankRight: {
      label: 'HOLLOWS_RPG.Scene.Range.close.flankRight',
    },
    flankLeft: {
      label: 'HOLLOWS_RPG.Scene.Range.close.flankLeft',
    },
    rear: {
      label: 'HOLLOWS_RPG.Scene.Range.close.rear',
    },
  },
  ranged: {
    label: 'HOLLOWS_RPG.Scene.Range.ranged.label',
    rangedFront: {
      label: 'HOLLOWS_RPG.Scene.Range.ranged.rangedFront',
    },
    frangedRight: {
      label: 'HOLLOWS_RPG.Scene.Range.ranged.rangedRight',
    },
    rangedLeft: {
      label: 'HOLLOWS_RPG.Scene.Range.ranged.rangedLeft',
    },
  },
  support: {
    label: 'HOLLOWS_RPG.Scene.Range.support.label',
  }
});
preLocalize("ranges", { key: "label" });


/**
 * The set of Stats used within the system.
 * These have special localization handling that checks for `HOLLOWS_RPG.Actor.Stat`.
 * The `label` is the full name (e.g. Strong).
 * @type {Record<string, {label: string}>}
 */

export const defences = Object.seal({
  close: {
    label: 'HOLLOWS_RPG.Actor.Defence.close',
  },
  ranged: {
    label: 'HOLLOWS_RPG.Actor.Defence.ranged',
  },
  wyrd: {
    label: 'HOLLOWS_RPG.Actor.Defence.wyrd',
  }
});
preLocalize("defences", { key: "label" });

/**
 * Configuration information for health types.
 * @type {Record<string, {label: string, color: foundry.utils.Color}>}
 */
export const health = Object.seal({
  resolve: {
    label: "HOLLOWS_RPG.Actor.Health.Resolve",
    color: foundry.utils.Color.fromString("#ffab0f"),
  },
  wounds: {
    label: "HOLLOWS_RPG.Actor.Health.Wounds",
    color: foundry.utils.Color.fromString("#ff0f0f"),
  },
});
preLocalize("health", { key: "label" });

/**
 * Configuration information for healing types.
 * Keys correspond to keys in `system.stamina`.
 * This is included in ds.CONFIG not because the top level keys can be customized
 * but because the properties within the object can be customized.
 * @type {Record<string, {label: string}>}
 */
export const healingTypes = Object.seal({
  value: {
    label: "HOLLOWS_RPG.Actor.Health.HealingType.Value",
  },
  temporary: {
    label: "HOLLOWS_RPG.Actor.Health.HealingType.Temporary",
  },
});
preLocalize("healingTypes", { key: "label" });

export const results = Object.seal({
  success: {
    label: "HOLLOWS_RPG.ROLL.Core.Results.Success"
  },
  superiorSuccess: {
    label: "HOLLOWS_RPG.ROLL.Core.Results.SuperiorSuccess"
  },
  criticalSuccess: {
    label: "HOLLOWS_RPG.ROLL.Core.Results.CriticalSuccess"
  },
  failure: {
    label: "HOLLOWS_RPG.ROLL.Core.Results.Failure"
  },
  criticalFailure: {
    label: "HOLLOWS_RPG.ROLL.Core.Results.CriticalFailure"
  }
});
preLocalize("results", { key: "label" });

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

/**
 * @typedef ActionType
 * @property {string} label                                       Human-readable label.
 * @property {string} defaultImage                                The default image for PowerRollEffects of this type.
 * @property {pseudoDocuments.actions.BaseAction} documentClass   The pseudo-document class.
 * @property {Record<string, ActionProperty>} [properties]
 */

/**
 * Valid types for the Action pseudo-document.
 * @type {Record<string, ActionType>}
 */
export const Action = {
  attack: {
    label: "TYPES.Action.attack",
    defaultImage: "icons/svg/sword.svg",
    documentClass: pseudoDocuments.actions.AttackAction,
  },
  damage: {
    label: "TYPES.Action.damage",
    defaultImage: "icons/svg/fire.svg",
    documentClass: pseudoDocuments.actions.DamageAction,
  }
};
preLocalize("Action", { key: "label" });


export const attackTypes = Object.seal({
  defence: {
    label: 'HOLLOWS_RPG.ACTION.attack.FIELDS.attackType.defence.label',
  },
  targetNumber: {
    label: 'HOLLOWS_RPG.ACTION.attack.FIELDS.attackType.targetNumber.label',
  }
});
preLocalize("attackTypes", { key: "label" });

export const spends = Object.seal({
  resource: {
    label: 'HOLLOWS_RPG.ACTION.Spend.resource.label',
  },
  resolve: {
    label: 'HOLLOWS_RPG.ACTION.Spend.resolve.label',
  },
  wounds: {
    label: 'HOLLOWS_RPG.ACTION.Spend.wounds.label',
  },
});
preLocalize("spends", { key: "label" });