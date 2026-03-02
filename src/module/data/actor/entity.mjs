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
export default class EntityModel extends BaseActorModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "entity",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("HOLLOWS_RPG.Actor.entity");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();
    const defence = { initial: 10, integer: true, nullable: false };

    schema.health = new fields.SchemaField({
      resolve: new fields.SchemaField({
        value: new fields.NumberField({ initial: 10, nullable: false, integer: true }),
        max: new fields.NumberField({ initial: 10, nullable: false, integer: true }),
        temporary: new fields.NumberField({ initial: 0, nullable: false, integer: true })
      }),
      wounds: new fields.SchemaField({
        value: new fields.NumberField({ initial: 10, nullable: false, integer: true }),
        max: new fields.NumberField({ initial: 10, nullable: false, integer: true }),
        temporary: new fields.NumberField({ initial: 0, nullable: false, integer: true })
      })
    });

    schema.entity = new fields.SchemaField({
      defences: new fields.SchemaField(
        Object.entries(hollows.CONFIG.defences).reduce((obj, [def, {label}]) => {
          obj[def] = new fields.SchemaField({
            value: new fields.NumberField({ ...defence, label}),
          });
          return obj;
        }, {})
      ),
      threat: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
        perRound: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
        cap: new fields.NumberField({ initial: 0, nullable: false, integer: true })
      }),
      terrain: new fields.SchemaField({
        elevated: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
        sheltered: new fields.NumberField({ initial: 0, nullable: false, integer: true })
      }),
    })

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static actorBiography() {
    const bio = super.actorBiography();

    bio.tactics = new fields.StringField({ required: true });

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
        actorLink: false,
        disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
        sight: {
          enabled: false,
        },
      },
    };

    this.parent.updateSource(updates);
  }

  /* -------------------------------------------------- */

  /**
   * Returns all of the actor's forms.
   * @returns {Array<Omit<HollowsRPGItem, "type" | "system"> & { type: "fomr", system: import("../item/form.mjs").default }>}
   */
  get forms() {
    return this.parent.itemTypes.form;
  }

}