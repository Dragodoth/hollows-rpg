import {requiredInteger} from "../../helpers.mjs";
import TypedPseudoDocument from "../typed-pseudo-document.mjs";

/**
 * @import { DataSchema } from "@common/abstract/_types.mjs";
 * @import { DrawSteelActor, DrawSteelItem } from "../../../documents/_module.mjs";
 */

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Pseudodocument used by abilities to represent the tiered results of a power roll.
 */
export default class BaseAction extends TypedPseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "Action",
      icon: "fa-solid fa-dice-d20",
      sheetClass: hollows.applications.sheets.pseudoDocuments.ActionSheet,
    };
  }


  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("HOLLOWS_RPG.ACTION");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema()

    schema.description = new fields.StringField({ required: true});

    schema.spend = new fields.SchemaField({
      spend: new fields.StringField({ required: true }),
      value: requiredInteger({ initial: 0 }),
      max: requiredInteger({ initial: 0 }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /**
   * Reference to the grandparent item.
   * @type {DrawSteelItem}
   */
  get item() {
    return this.document;
  }

  /* -------------------------------------------------- */

  /**
   * Reference to the great-grandparent actor.
   * @type {DrawSteelActor}
   */
  get actor() {
    return this.item?.actor;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare derived power roll effect data that requires ability data prep to be completed.
   */
  preparePostAbilityPrepData() {}

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _actionRenderingContext(context, options) {
    context.spends = Object.entries(hollows.CONFIG.spends).map(([value, { label }]) => ({ value, label }));
  }

   /* -------------------------------------------------- */

  /**
   * Define how an effect renders on sheets and embeds.
   * @param {1 | 2 | 3} tier   The specific tier.
   * @returns {string}
   * @abstract
   */
  toText(tier) {}

  /* -------------------------------------------------- */

  /**
   * Constructs button for an Ability Use chat message.
   * @param {1 | 2 | 3} tier    The specific tier.
   * @returns {HTMLButtonElement[] | null} An array of buttons to add to the footer of the message, or null if there are none.
   */
  constructButtons(tier) {
    return null;
  }
}