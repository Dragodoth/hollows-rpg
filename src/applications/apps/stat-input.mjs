import { systemID, systemPath } from "../../constants.mjs";
import DocumentInput from "../api/document-input.mjs";

/**
 * Simple live-updating input for characteristics.
 */
export default class StatInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["actor-stats"],
    window: {
      title: "HOLLOWS_RPG.Actor.hunter.StatInput.Title",
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
      template: systemPath("templates/apps/document-input/stat-input.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (partId === "body") {
      context.stats = Object.keys(hollows.CONFIG.stats).reduce((obj, st) => {
        obj[st] = {
          field: this.document.system.schema.getField(["hunter", "stats", st, "value"]),
          value: this.document.system._source.hunter.stats[st].value,
        };
        return obj;
      }, {});
    }

    return context;
  }
}