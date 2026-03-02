import HollowsPRGChatMessage from "../../documents/chat-message.mjs";
import { CoreRoll, DamageRoll } from "../../rolls/_module.mjs";
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

    for (const item of this.parent.items) {
      const bonuses = item.system?.bonuses;
      if (bonuses) {
        if (bonuses?.health) {
          this.health.resolve.max += bonuses.health.resolve;
          this.health.wounds.max += bonuses.health.wounds;
        }

        if (bonuses?.stats) {
          for (const stat of bonuses.stats.modifiedStats){
          this.hunter.stats[stat].value += bonuses.stats.statBonuses[stat].bonus;
          }
        }
      }
    }

    if (this.health.resolve.value > this.health.resolve.max) this.health.resolve.value = this.health.resolve.max
    if (this.health.wounds.value > this.health.wounds.max) this.health.wounds.value = this.health.wounds.max
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
  async rollStat(options = {}) {
    const stats = options.stats ? [...options.stats] : ["strong"];
    const stat = options.stat ??[...stats][0];
    const types = options.types ?? ["explore"];
    const defences = options.defences ? [...options.defences] : ["close"];
    const defence = defences[0];
    const target = options.target ?? [];
    const spend = options.spend ?? false;
    const spendAmount = options.spendAmount ?? 0;
    let type = options.type ?? types[0];

    if (types.length > 1) {
      const buttons = types.reduce((b, action) => {
        const { label, icon } = CoreRoll.TYPES[action];
        b.push({ label, icon, action });
        return b;
      }, []);
      type = await hollows.applications.api.HollowsDialog.wait({
        window: { title: game.i18n.localize("HOLLOWS_RPG.ROLL.Core.ChooseType.Title") },
        content: game.i18n.localize("HOLLOWS_RPG.ROLL.Core.ChooseType.Content"),
        buttons,
        rejectClose: true,
      });
    }

    const evaluation = "evaluate";
    const advantageMode = options.advantageMode ?? "normal";
    const useTargetNumber = options.useTargetNumber ?? true;
    const targetNumber = options.targetNumber ?? 10;
    const data = this.parent.getRollData();

    const promptValue = await CoreRoll.prompt({ type, evaluation, data, stats, stat, defences, defence, targetNumber, useTargetNumber, advantageMode, spend, spendAmount, weaponUuid: options.weaponUuid, actor: this.parent, target });

    if (!promptValue) return null;
    const { rollMode, coreRoll, flavor } = promptValue;

    const messageData = {
      speaker: HollowsPRGChatMessage.getSpeaker({ actor: this.parent }),
      title: flavor,
      rolls: [coreRoll],
      sound: CONFIG.sounds.dice,
      flags: { core: { canPopout: true } },
    };

    let weaponData = {}
    if (options.weaponUuid) {
      const weapon = await fromUuid(options.weaponUuid);
      weaponData = weapon.getRollData();
    }


    let formula;
    let damageType;
    if (options.damage) {
      switch (coreRoll.result) {
        case "success":
          formula = String(options.damage.resolve);
          damageType = "resolve";
          break;
        case "superiorSuccess":
          formula = type === "attack" ? String(options.damage.wounds) : null;
          damageType = "wounds";
          break;
        case "criticalSuccess":
          formula = type === "attack" ? String(options.damage.wounds + 1) : null;
          damageType = "wounds";
          break;
        case "criticalFailure":
          formula = type != "attack" ? String(options.damage.wounds) : null;
          damageType = "wounds";
          break;
        case "failure":
          formula = type != "attack" ? String(options.damage.wounds) : null;
          damageType = "wounds";
          break;
      }
      if (formula) {
        const damageRoll = new DamageRoll(formula, weaponData, options = {type: damageType, result: coreRoll.result});
        await damageRoll.evaluate();
        messageData.rolls.push(damageRoll)
      }
    }
    HollowsPRGChatMessage.applyRollMode(messageData, rollMode);
    return HollowsPRGChatMessage.create(messageData);
  }

  /* -------------------------------------------------- */

}