import HollowsPRGChatMessage from "../../documents/chat-message.mjs";
import CoreRoll from "../../rolls/core.mjs";
import BaseActorModel from "./base.mjs";

/**
 * @import { DamageSchema } from "../pseudo-documents/power-roll-effects/_types";
 * @import DrawSteelItem from "../../documents/item.mjs";
 * @import ActiveEffectData from "@common/documents/_types.mjs";
 * @import AdvancementChain from "../../utils/advancement-chain.mjs";
 * @import { ActorData, ItemData } from "@common/documents/_types.mjs";
 */

const fields = foundry.data.fields;

/**
 * Heroes are controlled by players and have heroic resources and advancement.
 */
export default class HunterModel extends BaseActorModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "hunter",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("HOLLOWS_RPG.Actor.hunter");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();
    const stat = { initial: 10, integer: true, nullable: false };

    schema.health = new fields.SchemaField({
      resolve: new fields.SchemaField({
        value: new fields.NumberField({ initial: 5, nullable: false, integer: true }),
        max: new fields.NumberField({ initial: 5, nullable: false, integer: true }),
        temporary: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
      }),
      wounds: new fields.SchemaField({
        value: new fields.NumberField({ initial: 5, nullable: false, integer: true }),
        max: new fields.NumberField({ initial: 5, nullable: false, integer: true }),
        temporary: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
      })
    });

    schema.hunter = new fields.SchemaField({
      stats: new fields.SchemaField(
        Object.entries(hollows.CONFIG.stats).reduce((obj, [st, {label}]) => {
          obj[st] = new fields.SchemaField({
            value: new fields.NumberField({ ...stat, label}),
          });
          return obj;
        }, {})
      )
    })

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static actorBiography() {
    const bio = super.actorBiography();

    return bio;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const updates = {
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: true,
        },
      },
    };

    const stats = this.parent._stats;

    this.parent.updateSource(updates);
  }

  /**
   * Prompt the user for what types.
   * @param {string} stat   The stat to roll.
   * @param {object} [options]        Options to modify the stat roll.
   * @param {Array<"attack" | "defend" | "explore">} [options.types] Valid roll types for the characteristic.
   * @param {string} advantageMode   Advantage mode
   * @returns {Promise<DrawSteelChatMessage | null>}
  */
  async rollStat(stat, options = {}) {
    const types = options.types ?? ["explore"];
    let type = types[0];

    if (types.length > 1) {
      const buttons = types.reduce((b, action) => {
        const { label, icon } = CoreRoll.TYPES[action];
        b.push({ label, icon, action });
        return b;
      }, []);
      type = await hollows.applications.api.DSDialog.wait({
        window: { title: game.i18n.localize("DRAW_STEEL.ROLL.Power.ChooseType.Title") },
        content: game.i18n.localize("DRAW_STEEL.ROLL.Power.ChooseType.Content"),
        buttons,
        rejectClose: true,
      });
    }

    const evaluation = "evaluate";
    const advantageMode = options.advantageMode ?? "normal";
    const targetNumber = options.targetNumber ?? 10;
    const useTargetNumber = options.useTargetNumber ?? true;
    const data = this.parent.getRollData();
    const flavor = `${game.i18n.localize(`HOLLOWS_RPG.Actor.Stat.${stat}`)} ${game.i18n.localize(CoreRoll.TYPES[type].label)}`;

    const promptValue = await CoreRoll.prompt({ type, evaluation, data, flavor, stat, targetNumber, useTargetNumber, advantageMode, actor: this.parent, });

    if (!promptValue) return null;
    const { rollMode, coreRolls } = promptValue;

    const messageData = {
      speaker: HollowsPRGChatMessage.getSpeaker({ actor: this.parent }),
      title: flavor,
      rolls: coreRolls,
      sound: CONFIG.sounds.dice,
      flags: { core: { canPopout: true } },
    };
    HollowsPRGChatMessage.applyRollMode(messageData, rollMode);
    return HollowsPRGChatMessage.create(messageData);
  }

  /* -------------------------------------------------- */

}