import { systemPath } from "../../constants.mjs";
// import { AdvancementModel, TreasureModel, KitModel, ProjectModel } from "../../data/item/_module.mjs";
// import FillTraitDialog from "../apps/advancement/fill-trait-dialog.mjs";
import HollowsRPGActorSheet from "./actor-sheet.mjs";
import { WeaponModel, FormModel } from "../../data/item/_module.mjs";
import DefenceInput from "../apps/defence-input.mjs";

/**
 * @import HollowsRPGItem from "../../documents/item.mjs";
 * @import { hunterTokenModel } from "../../data/settings/hunter-tokens.mjs";
 * @import { ActorSheetItemContext, ActorSheetTreasureContext, ActorSheetComplicationsContext } from "./_types.js";
 */

const { sheets } = foundry.applications;

export default class HollowsRPGEntitySheet extends HollowsRPGActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["entity"],
    actions: {
      editDefences: this.#editDefences,
    },
    position: {
      height: 780,
    }
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/sheets/actor/entity-sheet/header.hbs"),
      templates: ["templates/sheets/actor/entity-sheet/header.hbs"].map(t => systemPath(t)),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    /*
    abilities: {
      template: systemPath("templates/sheets/actor/hunter-sheet/abilities.hbs"),
      scrollable: [""],
    },
    equipment: {
      template: systemPath("templates/sheets/actor/hunter-sheet/equipment.hbs"),
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
      template: systemPath("templates/sheets/actor/entity-sheet/biography.hbs"),
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
        context.defences = this._getDefences(false);
        break;
    }
    return context;
  }

    /* -------------------------------------------------- */

  /**
   * Constructs a record of valid defences and their associated field.
   * @param {boolean} edit Are the defences editable inline?
   * @returns {Record<string, {field: NumberField, value: number}>}
   * @protected
   */
  _getDefences(edit) {
    const isEdit = this.isEditMode && edit;
    const data = isEdit ? this.actor._source : this.actor;
    return Object.keys(hollows.CONFIG.defences).reduce((obj, def) => {
      const value = foundry.utils.getProperty(data, `system.entity.defences.${def}.value`);
      obj[def] = {
        isEdit,
        field: this.actor.system.schema.getField(["entity", "defences", def, "value"]),
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
  async _getWeapons() {
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
  static async #editDefences(event, target) {
    return new DefenceInput({ document: this.document }).render({ force: true });
  }

}