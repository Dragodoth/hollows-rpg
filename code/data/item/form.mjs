import { systemPath } from "../../constants.mjs";
import { requiredInteger } from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Classes provide the bulk of a hero's features and abilities.
 */
export default class FormModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "form",
      invalidActorTypes: ["entity"],
      detailsPartial: [systemPath("templates/sheets/item/partials/form.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("HOLLOWS_RPG.Item.form");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.damage = new fields.SchemaField({
        resolve: requiredInteger({ initial: 0 }),
        wounds: requiredInteger({ initial: 0 }),
    })

    schema.weaponLink = new fields.StringField({ required: true });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
  }
}