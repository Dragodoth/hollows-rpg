import {systemPath} from "../../constants.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import {validateHOLLOWSID} from "../helpers.mjs";
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
      embedded: {
        Action: "system.actions",
      },
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
    schema._hollowsid = new fields.StringField({
      required: true,
      readonly: true,
      validate: validateHOLLOWSID,
      validationError: game.i18n.localize("DRAW_STEEL.SOURCE.InvalidDSID"),
    });

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

    if (!this._hollowsid && !data.name.startsWith(defaultName)) updates._dsid = this.parent.constructor.generateHOLLOWSID(data.name);
    console.log(data)
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
   * Use an ability, generating a chat message and potentially making a power roll.
   * @param {Partial<AbilityUseOptions>} [options={}] Configuration.
   * @returns {Promise<DrawSteelChatMessage[] | null>}
   * TODO: Add hooks based on discussion with module authors.
   */
  async use(options = {}) {
    const actions = this.actions;
    if (!actions.size) {
      ui.notifications.warn("HOLLOWS_RPG.Item.Error.NoActions", { localize: true });
      return;
    }

    let action = Array.from(actions)[0];
    if (actions.size > 1) {

      const context = {}
      context.actions = actions;

      const promptValue = await hollows.applications.apps.ActionChoiceDialog.create({
        context,
        window: {
          title: game.i18n.format("HOLLOWS_RPG.ROLL.Core.Prompt.Title"),
        },
      });
    if (!promptValue) return null;
    action = await fromUuid(promptValue.actionUuid);
    }
    await action.use();
  }

  /* -------------------------------------------------- */

  /**
   * An alias of {@linkcode use}.
   */
  async roll(options = {}) {
    this.system.use(options);
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