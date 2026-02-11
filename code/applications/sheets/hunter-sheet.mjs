import { systemPath } from "../../constants.mjs";
// import { AdvancementModel, TreasureModel, KitModel, ProjectModel } from "../../data/item/_module.mjs";
// import CharacteristicInput from "../apps/characteristic-input.mjs";
// import FillTraitDialog from "../apps/advancement/fill-trait-dialog.mjs";
import HollowsRPGActorSheet from "./actor-sheet.mjs";

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
    },
    position: {
      // Skills section is visible by default
      height: 680,
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
    /*,
    stats: {
      template: systemPath("templates/sheets/actor/hunter-sheet/stats.hbs"),
      templates: ["characteristics.hbs", "combat.hbs", "movement.hbs", "immunities-weaknesses.hbs"].map(t => systemPath(`templates/sheets/actor/shared/partials/stats/${t}`)),
      scrollable: [""],
    },
    features: {
      template: systemPath("templates/sheets/actor/hunter-sheet/features.hbs"),
      templates: ["templates/sheets/actor/shared/partials/features/features.hbs"].map(t => systemPath(t)),
      scrollable: [""],
    },
    equipment: {
      template: systemPath("templates/sheets/actor/hunter-sheet/equipment.hbs"),
      scrollable: [""],
    },
    projects: {
      template: systemPath("templates/sheets/actor/hunter-sheet/projects.hbs"),
      scrollable: [""],
    },
    abilities: {
      template: systemPath("templates/sheets/actor/shared/abilities.hbs"),
      scrollable: [""],
    },*/
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
        context.stats = this._getStats(false);
        //context.characteristics = this._getCharacteristics(false);
        //context.unfilledSkill = !!this.actor.system._unfilledTraits.skill?.size;
        //context.skills = this._getSkills();
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

}