import {defences} from "../config.mjs";
import {systemPath} from "../constants.mjs";
import HollowsRPGChatMessage from "../documents/chat-message.mjs";
import HOLLOWSRoll from "./base.mjs";

/** @import { PowerRollPrompt, PowerRollPromptOptions } from "../_types.js" */

/**
 * Augments the Roll class with specific functionality for power rolls.
 */
export default class CoreRoll extends HOLLOWSRoll {
  constructor(formula = "1d20", data = {}, options = {}) {
    super(formula, data, options);
    foundry.utils.mergeObject(this.options, this.constructor.DEFAULT_OPTIONS, {
      insertKeys: true,
      insertValues: true,
      overwrite: false,
    });

    if (!CoreRoll.VALID_TYPES.has(this.options.type)) throw new Error("Core rolls must be an attack, defend or explore type");
  }

  static ADVANTAGE_MODE_FORMULA = {
    normal: "1d20",
    advantage: "2d20kl",
    disadvantage: "2d20kh"
  };

  /* -------------------------------------------------- */

  static DEFAULT_OPTIONS = Object.freeze({
    type: "explore",
    targetNumber: 10,
    useTargetNumber: true,
    stat: "strong",
    stats: ["strong"],
    defence: "close",
    defences: ["close"],
    advantageMode: "normal",
    spend: false,
    spendAmount: 0
  });

  /* -------------------------------------------------- */

  static CHAT_TEMPLATE = systemPath("templates/rolls/core.hbs");

  /* -------------------------------------------------- */

  /**
   * Types of Core Rolls.
   * @returns A key-value pair of the valid types and their i18n strings.
   */
  static get TYPES() {
    return CoreRoll.#TYPES;
  }

  /* -------------------------------------------------- */

  /** @enum {{label: string; icon: string}} */
  static #TYPES = Object.freeze({
    attack: {
      label: "HOLLOWS_RPG.ROLL.Core.Types.Attack",
      icon: "fa-solid fa-bolt",
    },
    defend: {
      label: "HOLLOWS_RPG.ROLL.Core.Types.Defend",
      icon: "fa-solid fa-shield",
    },
    explore: {
      label: "HOLLOWS_RPG.ROLL.Core.Types.Explore",
      icon: "fa-solid fa-dice",
    }
  });

  /* -------------------------------------------------- */

  /**
   * Set of core roll types.
   * @type {Set<"ability" | "test">}
   */
  static get VALID_TYPES() {
    return new Set(Object.keys(this.#TYPES));
  }

  /* -------------------------------------------------- */

  /**
   * Core roll results.
   */
  static get RESULTS() {
    return this.#RESULTS;
  }

  /* -------------------------------------------------- */

  /**
   * Names of the results.
   * @type {Array<"success" | "superior success" | "critical success" | "failure" | "critical failure">}
   */
  static get RESULTS_NAMES() {
    return Object.keys(this.#RESULTS);
  }

  /* -------------------------------------------------- */

  /** @enum {{label: string; threshold: number}} */
  static #RESULTS = {
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
  };

  /* -------------------------------------------------- */

  /**
 * Prompt the user with a roll configuration dialog.
 * @param {Partial<CoreRollPromptOptions>} [options] Options for the dialog.
 * @return {Promise<CoreRollDialogPrompt>} Based on evaluation made can either return an array of power rolls or chat messages.
 */
  static async prompt(options = {}) {
    const type = options.type ?? "explore";
    const evaluation = options.evaluation ?? "message";
    const advantageMode = options.advantageMode ?? "normal";
    const stats = options.stats ?? ["strong"];
    const stat = options.stat ?? stats[0];
    const targetNumber = options.targetNumber ?? 10;
    const useTargetNumber = options.useTargetNumber ?? true;
    const defences = options.defences ?? ["close"];
    const defence = defences[0];
    const target = options.target ?? [];
    const spend = options.spend ?? false;
    const spendAmount = options.spendAmount ?? 0;

    options.actor ??= HollowsRPGChatMessage.getSpeakerActor(HollowsRPGChatMessage.getSpeaker());

    if (!this.VALID_TYPES.has(type)) throw new Error("The `type` parameter must be 'attack', 'defend' or 'explore'");
    if (!["none", "evaluate", "message"].includes(evaluation)) throw new Error("The `evaluation` parameter must be 'none', 'evaluate', or 'message'");
    if (!["normal", "advantage", "disadvantage"].includes(advantageMode)) throw new Error("The `advantageMode` parameter must be 'none', 'advantage', or 'disadvantage'");
    if (!Object.keys(hollows.CONFIG.stats).includes(stat)) throw new Error("Stat must be 'strength', 'hard', 'quick', 'sharp', or 'wise'");
    if (!(typeof targetNumber === 'number')) throw new Error("Target Number must be number");
    if (!(typeof useTargetNumber === 'boolean')) throw new Error("Use Target Number must be either True or False");


    const typeLabel = game.i18n.localize(this.TYPES[type].label);

    const context = {
      stats,
      stat,
      targetNumber,
      useTargetNumber,
      defences,
      defence,
      advantageMode,
      type,
      spend,
      spendAmount,
    };

    const promptValue = await hollows.applications.apps.CoreRollDialog.create({
      context,
      window: {
        title: game.i18n.format("HOLLOWS_RPG.ROLL.Core.Prompt.Title", {typeLabel}),
      },
    });
    if (!promptValue) return null;


    const weapon = await fromUuid(options.weaponUuid);
    if (weapon){
      await weapon.system.spendResource(spendAmount);
    }
    const formula = this.ADVANTAGE_MODE_FORMULA[promptValue.advantageMode] ?? "1d20";
    const statValue = options.data.hunter.stats[promptValue.stat].value;
    let targetNumberValue = promptValue.targetNumber;

    if (type === "attack" && target && target.actor){
      targetNumberValue = target.actor.system.entity.defences[promptValue.defence].value;
    }

    let flavor = `${game.i18n.localize(`HOLLOWS_RPG.Actor.Stat.${stat}`)} (${statValue}) ${game.i18n.localize(CoreRoll.TYPES[type].label)}`;
    if (type === "attack" && defence){
      flavor = flavor + ` vs. ${game.i18n.localize(`HOLLOWS_RPG.Actor.Defence.${defence}`)} (${targetNumberValue})`
    }
    if ((type === "explore" || type === "defend") && useTargetNumber) {
      flavor = flavor + ` vs. TN ${targetNumberValue}`
    }

    const coreRoll = new this(formula, options.data, { stat: promptValue.stat, statValue, targetNumberValue, flavor: flavor, target: target.uuid});

    const speaker = HollowsRPGChatMessage.getSpeaker({actor: options.actor});

    switch (evaluation) {
      case "evaluate":
        return {rollMode: promptValue.rollMode, coreRoll: await coreRoll.evaluate(), flavor};
      case "message":
        return {rollMode: promptValue.rollMode, coreRoll: await coreRoll.toMessage({speaker}, {rollMode: promptValue.rollMode}), flavor};
    }
    return {rollMode: promptValue.rollMode, coreRoll: coreRoll, flavor};
  }

  /* -------------------------------------------------- */

  /**
   * Produces the result of a roll as a number.
   * @returns {criticalFailure | criticalSuccess | failure | success | superiorSuccess | undefined} Returns a string for the result or undefined if this isn't yet evaluated.
   */
  get result() {
    if (this._total === undefined) return undefined;
    const total = this.total;
    if (total == 20) return 'criticalFailure';
    if (total == this.options.statValue) return 'criticalSuccess';
    if (total > this.options.statValue) return 'failure';
    if (!this.options.useTargetNumber) return 'success';
    if (this.options.statValue > this.options.targetNumberValue && total >= this.options.targetNumberValue) return 'superiorSuccess';
    return 'success';
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareChatRenderContext({ flavor, isPrivate = false, ...options } = {}) {
    const context = await super._prepareChatRenderContext({ flavor, isPrivate, ...options });
    context.result = {
     label: isPrivate ? "" : game.i18n.localize(this.constructor.RESULTS[this.result].label),
     class: this.result,
    };

    if (!isPrivate) {
      context.flavorlessFormula = this.flavorlessFormula;
    } else context.flavorlessFormula = "???";
    return context;
  }


}

