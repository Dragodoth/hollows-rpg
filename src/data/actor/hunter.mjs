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
        value: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
        max: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
        temporary: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
      }),
      wounds: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
        max: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
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
      ),
      corruption: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
      }),
    })

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static actorBiography() {
    const bio = super.actorBiography();

    bio.class = new fields.StringField({ required: true });
    bio.pronouns = new fields.StringField({ required: true });
    bio.gender = new fields.StringField({ required: true });
    bio.ethnicity = new fields.StringField({ required: true });
    bio.disability = new fields.StringField({ required: true });
    bio.hope = new fields.StringField({ required: true });
    bio.connections = new fields.StringField({ required: true });
    bio.appearance = new fields.StringField({ required: true });
    bio.possessions = new fields.StringField({ required: true });
    bio.passingTheTime = new fields.StringField({ required: true });

    bio.age = new fields.StringField({ required: true });
    return bio;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    const weaponBonuses = {
      resolve: 0,
      wounds: 0,
      statsPositive: {},
      statsNegative: "",
      statChange: 0,
    };

    for (const weapon of this.weapons) {
      const bonuses = weapon.system.bonuses;
      this.health.resolve.max += bonuses.health.resolve;
      this.health.wounds.max += bonuses.health.wounds;

      if (bonuses.statChanges.change === "both"){
        for (const stat of bonuses.statChanges.positive){
          this.hunter.stats[stat].value += 1;
        }
      }
      else {
        this.hunter.stats[bonuses.statChanges.change].value += 2;
      }
      this.hunter.stats[bonuses.statChanges.negative].value -= 1;
    }
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

  /* -------------------------------------------------- */

  /**
   * Returns all of the actor's weapons.
   * @returns {Array<Omit<HollowsRPGItem, "type" | "system"> & { type: "weapon", system: import("../item/weapon.mjs").default }>}
   */
  get weapons() {
    return this.parent.itemTypes.weapon;
  }

  /**
   * Returns all of the actor's forms.
   * @returns {Array<Omit<HollowsRPGItem, "type" | "system"> & { type: "fomr", system: import("../item/form.mjs").default }>}
   */
  get forms() {
    return this.parent.itemTypes.form;
  }

  /* -------------------------------------------------- */

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