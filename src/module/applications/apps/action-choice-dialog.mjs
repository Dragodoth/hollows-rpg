import { systemPath } from "../../constants.mjs";
import HollowsApplication from "../api/application.mjs";

/**
 * Provides basic framework for roll dialogs.
 * @abstract
 */
export default class ActionChoiceDialog extends HollowsApplication {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["action-choice-dialog"],
    window: {
      icon: "fa-solid fa-dice-d20",
    },
    position: {
      width: 350,
      height: "auto",
    },
    actions: {
      chooseAction: this.#chooseAction,
    },
    context: null,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    content: {
      template: systemPath("templates/apps/action-choice-dialog.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options.context ??= {};
    return super._initializeApplicationOptions(options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    return { ...this.options.context };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    formData = super._processFormData(event, form, formData);

    const config = {
      actionUuid: this.options.context.actioUuid
    };
    return config;
  }

  static #chooseAction(_, button) {

    this.options.context.actioUuid = button.dataset.actionuuid;
  }

}