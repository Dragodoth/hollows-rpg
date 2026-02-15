import enrichHTML from "../../utils/enrich-html.mjs";
import HollowsRPGSystemModel from "../system-model.mjs";

/** @import HollowsRPGActor from "../../documents/actor.mjs" */

const fields = foundry.data.fields;

/**
 * A base item model that provides basic description and source metadata for an item instance.
 */
export default class BaseItemModel extends HollowsRPGSystemModel {
  /**
   * Key information about this item subtype.
   * @type {import("./_types").ItemMetaData}
   */
  static get metadata() {
    return {
      ...super.metadata,
      type: "base",
      invalidActorTypes: [],
      packOnly: false,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = {};

    schema.description = new fields.SchemaField({
      value: new fields.HTMLField(),
      // gmOnly doesn't do anything client-side currently, handled in system.json declaration
      director: new fields.HTMLField({ gmOnly: true }),
    });

    /**
     * The Draw Steel ID, indicating a unique game rules element.
     * @remarks `readonly: true` makes this non-iterable
     */
    schema._hollowsid = new fields.StringField({ required: true, readonly: true });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "HOLLOWS_RPG.Item.base",
  ];

  /* -------------------------------------------------- */

  /**
   * Convenient access to the item's actor, if it exists.
   * @returns {HollowsRPGActor | null}
   */
  get actor() {
    return this.parent.actor;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

  }

  /* -------------------------------------------------- */

  /**
   * Prepare derived item data that requires actor derived actor data to be available.
   */
  preparePostActorPrepData() {}

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    if (this.constructor.metadata.invalidActorTypes?.includes(this.parent.actor?.type)) return false;

    const updates = {};

    const defaultName = game.i18n.localize(CONFIG.Item.typeLabels[data.type]);

    if (!this._hollowsid && !data.name.startsWith(defaultName)) updates._hollowsid = data.name.slugify({ strict: true });

    if (!foundry.utils.isEmpty(updates)) this.updateSource(updates);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options = {}) {
    const enriched = await enrichHTML(this.description.value, { ...options, relativeTo: this.parent });

    const embed = document.createElement("div");
    embed.classList.add("hollows-rpg", this.parent.type);
    embed.innerHTML = enriched;

    return embed;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare type-specific data for the Item sheet.
   * @param {Record<string, unknown>} context  Sheet context data.
   * @returns {Promise<void>}
   */
  async getSheetContext(context) {}

  /* -------------------------------------------------- */

  /**
   * Attach type-specific event listeners to details tab of the Item sheet.
   * @param {HTMLElement} htmlElement             The rendered HTML element for the part.
   * @param {ApplicationRenderOptions} options    Rendering options passed to the render method.
   * @protected
   */
  _attachPartListeners(htmlElement, options) {}

  /* -------------------------------------------------- */

  /**
   * Perform item subtype specific modifications to the actor roll data.
   * @param {object} rollData   Pointer to the roll data object.
   */
  modifyRollData(rollData) {}
}