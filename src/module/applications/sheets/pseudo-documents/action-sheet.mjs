import { systemPath } from "../../../constants.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";
import PseudoDocumentSheet from "../../api/pseudo-document-sheet.mjs";

/**
 * @import ActiveEffect from "@client/documents/active-effect.mjs"
 * @import BasePowerRollEffect from "../../../data/pseudo-documents/power-roll-effects/base-power-roll-effect.mjs";
 */

/**
 * A sheet representing power roll effects.
 * @extends PseudoDocumentSheet<BasePowerRollEffect>
 */
export default class ActionSheet extends PseudoDocumentSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      addAppliedEffect: this.#addAppliedEffect,
      deleteAppliedEffectEntry: this.#deleteAppliedEffectEntry,
      editAppliedEffect: this.#editAppliedEffect,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    ...super.TABS,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    description: {
      template: systemPath("templates/sheets/pseudo-documents/action-sheet/description.hbs"),
      classes: ["tab"],
    },
    details: {
      template: systemPath("templates/sheets/pseudo-documents/action-sheet/details.hbs"),
      classes: ["tab"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const pseudo = this.pseudoDocument;
    const context = {
      pseudo,
      tabs: this._prepareTabs("primary"),
      document: this.document,
      fields: {
        ...pseudo.schema.fields,
        name: {
          field: pseudo.schema.getField("name"),
          src: pseudo._source.name,
          name: "name",
          placeholder: game.i18n.localize(`TYPES.Action.${pseudo.type}`),
        },
      },
    };
    await pseudo._actionRenderingContext(context, options);

    console.log(context)
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    if (partId in context.tabs) context.tab = context.tabs[partId];
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Add an entry to `applied.effects`.
   * @this PowerRollEffectSheet
   * @param {PointerEvent} event        The initiating click event.
   * @param {HTMLButtonElement} target  The capturing HTML element which defined a [data-action].
   */
  static async #addAppliedEffect(event, target) {
    const path = target.dataset.path;
    const createSelect = this.element.querySelector(`select[data-name="${path}"]`);
    if (createSelect.value) {
      this.pseudoDocument.update({ [`${path}.${createSelect.value}.condition`]: "failure" });
    }
    else {
      const item = this.document;

      const effect = await ActiveEffect.implementation.create({
        name: ActiveEffect.implementation.defaultName({ parent: item }),
        img: item.img,
        origin: foundry.utils.parseUuid(item.uuid, { relative: item.actor }).uuid,
        transfer: false,
      }, { parent: item });

      if (effect) {
        this.pseudoDocument.update({ [`${path}.${effect.id}.condition`]: "failure" });
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Delete an entry in `applied.effects`.
   * @this PowerRollEffectSheet
   * @param {PointerEvent} event        The initiating click event.
   * @param {HTMLButtonElement} target  The capturing HTML element which defined a [data-action].
   */
  static async #deleteAppliedEffectEntry(event, target) {
    const fieldset = target.closest("fieldset");
    const path = fieldset.dataset.path;
    const effectId = fieldset.dataset.effectId;
    this.pseudoDocument.update({ [`${path}.-=${effectId}`]: null });
  }

  /* -------------------------------------------------- */

  /**
   * Open the ActiveEffectConfig for an entry in `applied.effects`.
   * @this PowerRollEffectSheet
   * @param {PointerEvent} event        The initiating click event.
   * @param {HTMLButtonElement} target  The capturing HTML element which defined a [data-action].
   */
  static async #editAppliedEffect(event, target) {
    const fieldset = target.closest("fieldset");
    const effectId = fieldset.dataset.effectId;
    this.document.effects.get(effectId).sheet.render({ force: true });
  }
}