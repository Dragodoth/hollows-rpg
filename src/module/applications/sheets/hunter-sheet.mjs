import { systemPath } from "../../constants.mjs";
import StatInput from "../apps/stat-input.mjs";
// import FillTraitDialog from "../apps/advancement/fill-trait-dialog.mjs";
import HollowsRPGActorSheet from "./actor-sheet.mjs";
import { WeaponModel, FormModel } from "../../data/item/_module.mjs";

/**
 * @import HollowsRPGItem from "../../documents/item.mjs";
 * @import { hunterTokenModel } from "../../data/settings/hunter-tokens.mjs";
 * @import { ActorSheetItemContext, ActorSheetTreasureContext, ActorSheetComplicationsContext } from "./_types.js";
 */

const { sheets } = foundry.applications;

export default class HollowsRPGHunterSheet extends HollowsRPGActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["hunter"],
    actions: {
      editStats: this.#editStats,
    },
    position: {
      // Skills section is visible by default
      height: 800,
    }
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/sheets/actor/hunter-sheet/header.hbs"),
      templates: ["templates/sheets/actor/hunter-sheet/header.hbs"].map(t => systemPath(t)),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    weapons: {
      template: systemPath("templates/sheets/actor/hunter-sheet/weapons.hbs"),
      scrollable: [""],
    },
    abilities: {
      template: systemPath("templates/sheets/actor/shared/abilities.hbs"),
      scrollable: [""],
    },
    equipment: {
      template: systemPath("templates/sheets/actor/hunter-sheet/equipment.hbs"),
      scrollable: [""],
    },
    echoes: {
      template: systemPath("templates/sheets/actor/hunter-sheet/echoes.hbs"),
      scrollable: [""],
    },
    effects: {
      template: systemPath("templates/sheets/actor/shared/effects.hbs"),
      scrollable: [""],
    },
    biography: {
      template: systemPath("templates/sheets/actor/hunter-sheet/biography.hbs"),
      templates: ["biography.hbs", "director-notes.hbs"].map(t => systemPath(`templates/sheets/actor/shared/partials/biography/${t}`)),
      scrollable: [""],
    }
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "header":
      case "weapons":
        context.stats = this._getStats(false);
        context.weapons = await this._prepareWeaponsContext();
        context.weaponsFields = WeaponModel.schema.fields;
        context.forms = await this._prepareFormsContext();
        context.formsFields = FormModel.schema.fields;
        break;
    }

    return context;
  }

    /* -------------------------------------------------- */

  /**
   * Constructs a record of valid stats and their associated field.
   * @param {boolean} edit Are the stats editable inline?
   * @returns {Record<string, {field: NumberField, value: number}>}
   * @protected
   */
  _getStats(edit) {
    const isEdit = this.isEditMode && edit;
    const data = isEdit ? this.actor._source : this.actor;
    return Object.keys(hollows.CONFIG.stats).reduce((obj, st) => {
      const value = foundry.utils.getProperty(data, `system.hunter.stats.${st}.value`);
      obj[st] = {
        isEdit,
        field: this.actor.system.schema.getField(["hunter", "stats", st, "value"]),
        value: isEdit ? (value || null) : (value ?? 10),
      };
      return obj;
    }, {});
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the context for weapons.
   * @returns {Array<ActorSheetItemContext>}
   * @protected
   */
  async _prepareWeaponsContext() {
    const weapons = [
      ...this.actor.itemTypes.weapon,
    ].sort((a, b) => a.sort - b.sort);
    const context = [];

    for (const weapon of weapons) {
      const weaponContext = await super._prepareItemContext(weapon);
      weaponContext.typeLabel = CONFIG.Item.typeLabels[weapon.type];
      context.push(weaponContext);
    }

    return context;
  }

  /**
   * Prepare the context for forms.
   * @returns {Array<ActorSheetItemContext>}
   * @protected
   */
  async _prepareFormsContext() {
    const forms = [
      ...this.actor.itemTypes.form,
    ].sort((a, b) => a.sort - b.sort);
    const context = [];

    for (const form of forms) {
      const formContext = await super._prepareItemContext(form);
      formContext.typeLabel = CONFIG.Item.typeLabels[form.type];
      context.push(formContext);
    }

    return context;
  }

  /**
   * Prepare the context for attacks.
   * @returns {Array<ActorSheetItemContext>}
   * @protected
   */
  async _prepareAttacksContext() {
    const attacks = [
      ...this.actor.itemTypes.attack,
    ].sort((a, b) => a.sort - b.sort);
    const context = [];

    for (const attack of attacks) {
      const attackContext = await super._prepareItemContext(attack);
      attackContext.typeLabel = CONFIG.Item.typeLabels[attack.type];
      context.push(attackContext);
    }

    return context;
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Creates or deletes a configured status effect.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #toggleStatus(event, target) {
    const status = target.dataset.statusId;
    await this.actor.toggleStatusEffect(status);
  }

  /* -------------------------------------------------- */

  /**
   * Toggles an active effect from disabled to enabled.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #toggleEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /* -------------------------------------------------- */

  /**
   * Handle clickable rolls.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #onRoll(event, target) {
    event.preventDefault();
    const dataset = target.dataset;

    // Handle item rolls.
    switch (dataset.rollType) {
      case "stat":
        return this.actor.rollStat(dataset.stat);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Open a configuration app to edit this hero's characteristics.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #editStats(event, target) {
    return new StatInput({ document: this.document }).render({ force: true });
  }

}