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

    if (!CoreRoll.VALID_TYPES.has(this.options.type)) throw new Error("Core rolls must be an attack, defen or explore type");
  }

  static ADVANTAGE_MODE_FORMULA = {
    normal: "1d20",
    advantage: "2d20kl",
    disadvantage: "2d20kh"
  };

  /* -------------------------------------------------- */

  static DEFAULT_OPTIONS = Object.freeze({
    type: "explore",
    tn: 10,
    useTargetNumber: true,
    stat: "strong",
    advantageMode: "normal"
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
      label: "HOLLOWS_RPG.Roll.Types.Attack",
      icon: "fa-solid fa-bolt",
    },
    defend: {
      label: "HOLLOWS_RPG.Roll.Types.Defend",
      icon: "fa-solid fa-shield",
    },
    explore: {
      label: "HOLLOWS_RPG.Roll.Types.Explore",
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
      label: "HOLLOWS_RPG.Roll.Results.Success"
    },
    superiorSuccess: {
      label: "HOLLOWS_RPG.Roll.Results.SuperiorSuccess"
    },
    criticalSuccess: {
      label: "HOLLOWS_RPG.Roll.Results.CriticalSuccess"
    },
    failure: {
      label: "HOLLOWS_RPG.Roll.Results.Failure"
    },
    criticalFailure: {
      label: "HOLLOWS_RPG.Roll.Results.CriticalFailure"
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
    const stat = options.stat ?? "strong";
    const targetNumber = options.targetNumber ?? 10;
    const useTargetNumber = options.useTargetNumber ?? True;
    const target = options.target ?? []

    options.actor ??= HollowsRPGChatMessage.getSpeakerActor(HollowsRPGChatMessage.getSpeaker());

    if (!this.VALID_TYPES.has(type)) throw new Error("The `type` parameter must be 'attack', 'defend' or 'explore'");
    if (!["none", "evaluate", "message"].includes(evaluation)) throw new Error("The `evaluation` parameter must be 'none', 'evaluate', or 'message'");
    if (!["normal", "advantage", "disadvantage"].includes(advantageMode)) throw new Error("The `advantageMode` parameter must be 'none', 'advantage', or 'disadvantage'");
    if (!Object.keys(hollows.CONFIG.stats).includes(stat)) throw new Error("Stat must be 'strength', 'hard', 'quick', 'sharp', or 'wise'");
    if (!(typeof targetNumber === 'number')) throw new Error("Target Number must be number");
    if (!(typeof useTargetNumber === 'boolean')) throw new Error("Use Target Number must be either True or False");


    const typeLabel = game.i18n.localize(this.TYPES[type].label);
    let flavor = options.flavor ?? typeLabel;

    const context = {
      stat,
      targetNumber,
      useTargetNumber,
      advantageMode,
      type,
    };

    const promptValue = await hollows.applications.apps.CoreRollDialog.create({
      context,
      window: {
        title: game.i18n.format("HOLLOWS_RPG.Roll.Core.Prompt.Title", {typeLabel}),
      },
    });
    if (!promptValue) return null;

    const formula = this.ADVANTAGE_MODE_FORMULA[promptValue.advantageMode] ?? "1d20";
    const statValue = options.data.hunter.stats[stat].value;

    const coreRoll = new this(formula, options.data, { stat: promptValue.stat, statValue, targetNumber: promptValue.targetNumber, flavor:flavor, target});

    const speaker = HollowsRPGChatMessage.getSpeaker({actor: options.actor});

    let rolls = [];
    switch (evaluation) {
      case "none":
        rolls.push(coreRoll);
        break;
      case "evaluate":
        rolls.push(await coreRoll.evaluate());
        break;
      case "message":
        rolls.push(await coreRoll.toMessage({speaker}, {rollMode: promptValue.rollMode}));
        break;
    }
    return {rollMode: promptValue.rollMode, coreRolls: rolls};
  }

  /* -------------------------------------------------- */

  /**
   * Produces the result of a roll as a number.
   * @returns {1 | 2 | 3 | undefined} Returns a number for the tier or undefined if this isn't yet evaluated.
   */
  get result() {
    if (this._total === undefined) return undefined;
    const total = this.total;
    if (total == 20) return 'criticalFailure';
    if (total == this.options.statValue) return 'criticalSuccess';
    if (total > this.options.statValue) return 'failure';
    if (!this.options.useTargetNumber) return 'success';
    if (this.options.statValue > this.options.targetNumber && total >= this.options.targetNumber) return 'superiorSuccess';
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

    if (this.options.target && this.options.target.length != 0) context.target = await fromUuid(this.options.target);

    if (!isPrivate) {
      context.flavorlessFormula = this.flavorlessFormula;
    } else context.flavorlessFormula = "???";
    return context;
  }


}

