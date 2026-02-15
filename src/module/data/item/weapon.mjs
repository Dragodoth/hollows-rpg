import { systemPath } from "../../constants.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Classes provide the bulk of a hero's features and abilities.
 */
export default class WeaponModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "weapon",
      invalidActorTypes: ["entity"],
      detailsPartial: [systemPath("templates/sheets/item/partials/weapon.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("HOLLOWS_RPG.Item.weapon");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const config = hollows.CONFIG;

    schema.bonuses = new fields.SchemaField({
      statChanges: new fields.SchemaField({
        positive: new fields.SetField(setOptions()),
        negative: new fields.StringField({ required: true }),
        change: new fields.StringField({ required: true }),
      }),
      health: new fields.SchemaField({
        resolve: requiredInteger({ initial: 3 }),
        wounds: requiredInteger({ initial: 3 }),
      })
    });

    schema.resource = new fields.SchemaField({
      hasResource: new fields.BooleanField({ initial: false }),
      type: new fields.StringField({ required: true }),
      name: new fields.StringField({ required: true }),
      value: requiredInteger({ initial: 0 }),
      max: requiredInteger({ initial: 0 }),
      state: new fields.BooleanField({ initial: true })
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    const stats = Object.entries(hollows.CONFIG.stats).map(([value, { label }]) => ({ value, label }));
    context.stats = stats;
    const showChoice = this.bonuses.statChanges.positive.size == 2;
    context.showChoice = showChoice;
    if (showChoice){
      const [first, second] = this.bonuses.statChanges.positive;
      context.choices = [
        {value:"both", label: stats.filter(s => s.value == first)[0].label + " and " + stats.filter(s => s.value == second)[0].label + " + 1"},
        {value:first, label: stats.filter(s => s.value == first)[0].label + " + 2"},
        {value:second, label: stats.filter(s => s.value == second)[0].label + " + 2"}
      ];
    }

    context.resourceType = [
      {value: "token", label: hollows.CONFIG.itemResourceTypes.token.label},
      {value: "counter", label: hollows.CONFIG.itemResourceTypes.counter.label}
    ]


  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    if (this.actor && (this.actor.type === "hunter") && (game.userId === userId)) {

    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.actor) {

    }
  }
}