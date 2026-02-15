import { systemPath } from "../../constants.mjs";
import CoreRoll from "../../rolls/core.mjs";
import RollDialog from "../api/roll-dialog.mjs";

/** @import DrawSteelToken  from "../../canvas/placeables/token.mjs" */

const { FormDataExtended } = foundry.applications.ux;

/**
 * A roll dialog for Power Rolls.
 * @see {@link CoreRoll}
 */
export default class CoreRollDialog extends RollDialog {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["core-roll-dialog"],
    position: {
      width: 400,
    },
    actions: {
      updateAdvantageMode: this.#updateAdvantageMode,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    content: {
      template: systemPath("templates/apps/core-roll-dialog.hbs"),
    },
    footer: super.PARTS.footer,
  };

  /* -------------------------------------------------- */

  /**
   * The currently highlighted token.
   * @type {HollowsRPGToken | null}
   */
  #highlightedToken = null;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    if (partId === "content") {
      await this._prepareStatOptions(context);

      if (context.type === "explore") await this._prepareEquipmentOptions(context);
    }

    return context;
  }

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the ability context by generating the ability Item and damageOptions.
   * @param {object} context
   */
  async _prepareStatOptions(context) {
    const stats = hollows.CONFIG.stats;
    context.statOptions = hollows.CONFIG.stats
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the exploration equipment select options.
   * @param {object} context The context from _prepareContext.
   */
  _prepareEquipmentOptions(context) {
    const equipment = hollows.CONFIG.explorationEquipmentList;
    context.skillOptions = Object.values(equipment).map(e => e.label)
  }

  /* -------------------------------------------------- */

  /**
   * Amend the global modifiers and target specific modifiers based on changed values.
   * @inheritdoc
   */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    const formData = foundry.utils.expandObject(new FormDataExtended(this.element).object);

    const newStat = formData.stat;
    this.options.context.stat = newStat;

    let newTargetNumber = formData.targetNumber;
    if (newTargetNumber < 1 || newTargetNumber > 20){
      ui.notifications.error(game.i18n.localize("HOLLOWS_RPG.ROLL.Core.Prompt.tnError"));
      newTargetNumber = 10;
    }
    this.options.context.targetNumber = newTargetNumber;

    const newUseTargetNumber = formData.useTargetNumber;
    this.options.context.useTargetNumber = newUseTargetNumber;

    this.render();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    formData = super._processFormData(event, form, formData);

    const config = {
      stat: formData.stat,
      advantageMode: this.options.context.advantageMode,
      targetNumber: formData.targetNumber,
      useTargetNumber: formData.useTargetNumber,
      damage: null,
      rollMode: this.options.context.rollMode,
    };

    return config;
  }

  static #updateAdvantageMode(_, button) {
    const newAdvantageMode = String(button.dataset.advantagemode);
    const oldAdvantageMode = this.options.context.advantageMode;

    this.options.context.advantageMode = newAdvantageMode === oldAdvantageMode ? "normal" : newAdvantageMode;
    this.render();
  }
}