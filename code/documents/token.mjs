import { systemID } from "../constants.mjs";

/** @import HollowsRPGToken from "../canvas/placeables/token.mjs"; */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Token.documentClass.
 */
export default class HollowsRPGTokenDocument extends foundry.documents.TokenDocument {

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getBarAttribute(barName, { alternative } = {}) {
    const bar = super.getBarAttribute(barName, { alternative });
    if (bar == null) return null;

    let { type, attribute, value, max, editable } = bar;

    // Adjustments made for things that use "spent" instead of "value" in the schema.
    if ((type === "value") && attribute.endsWith(".spent")) {
      const object = foundry.utils.getProperty(this.actor.system, attribute.slice(0, attribute.lastIndexOf(".")));
      value = object.value;
      max = object.max;
      type = "bar";
      editable = true;
    } else if (type === "bar") {
      editable = true;
    }

    const barData = { type, attribute, value, max, editable };
    if (barData?.attribute !== "stamina") return barData;

    barData.min = this.actor.system.stamina.min;

    // Set minion specific stamina bar data based on their combat squad
    if (!this.actor.isMinion || (this.actor.system.combatGroups.size !== 1)) return barData;

    const combatGroup = this.actor.system.combatGroup;
    barData.min = 0;
    barData.max = combatGroup.system.staminaMax;
    barData.value = combatGroup.system.staminaValue;

    return barData;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static _getTrackedAttributesFromSchema(schema, _path = []) {
    const attributes = { bar: [], value: [] };
    for (const [name, field] of Object.entries(schema.fields)) {
      const p = _path.concat([name]);
      if (field instanceof foundry.data.fields.NumberField) attributes.value.push(p);
      const isSchema = field instanceof foundry.data.fields.SchemaField;
      const isModel = field instanceof foundry.data.fields.EmbeddedDataField;
      if (isSchema || isModel) {
        const schema = isModel ? field.model.schema : field;
        const isBar = ((schema.has("value") || schema.has("spent")) && schema.has("max")) || schema.options.trackedAttribute;
        if (isBar) attributes.bar.push(p);
        else {
          const inner = this.getTrackedAttributes(schema, p);
          attributes.bar.push(...inner.bar);
          attributes.value.push(...inner.value);
        }
      }
    }
    return attributes;
  }
}