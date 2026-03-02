import { systemPath } from "../../constants.mjs";
import DocumentInput from "../api/document-input.mjs";

/**
 * Simple live-updating input for characteristics.
 */
export default class DefenceInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["actor-stats"],
    window: {
      title: "HOLLOWS_RPG.Actor.wntity.DefenceInput.Title",
      icon: "fa-solid fa-dumbbell",
    },
    position: {
      width: 480,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/document-input/defence-input.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (partId === "body") {
      context.defences = Object.keys(hollows.CONFIG.defences).reduce((obj, def) => {
        obj[def] = {
          field: this.document.system.schema.getField(["entity", "defences", def, "value"]),
          value: this.document.system._source.entity.defences[def].value,
        };
        return obj;
      }, {});
    }

    return context;
  }
}