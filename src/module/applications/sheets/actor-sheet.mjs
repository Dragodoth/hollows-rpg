import HollowsDocumentSheet from "../api/document-sheet.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import { HollowsRPGChatMessage } from "../../documents/_module.mjs";
/**
 * @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs"
 * @import { NumberField } from "@common/data/fields.mjs";
 * @import { FormSelectOption } from "@client/applications/forms/fields.mjs";
 * @import { ActiveEffectCategory, ActorSheetItemContext, ActorSheetAbilitiesContext } from "./_types.js";
 * @import { HollowsRPGActor, HollowsRPGItem, HollowsRPGTokenDocument } from "../../documents/_module.mjs";
 */

const { sheets } = foundry.applications;

/**
 * AppV2-based sheet that each actor subtype is expected to be extended for each actor subtype.
 */
export default class HollowsRPGActorSheet extends HollowsDocumentSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["actor"],
    position: {
      width: 800,
      height: 600,
    },
        actions: {
      // We're not extending ActorSheetV2 because we ultimately don't want to inherit most of the framework Foundry defaults to
      // Because these actions are all hard private, the best place to access them is via static DEFAULT_OPTIONS
      ...sheets.ActorSheet.DEFAULT_OPTIONS.actions,
      toggleStatus: this.#toggleStatus,
      toggleEffect: this.#toggleEffect,
      roll: this.#onRoll,
      useItem: this.#useItem,
    },
    window: {
      controls: [
        {
          action: "configureToken",
          icon: "fa-regular fa-circle-user",
          label: "DOCUMENT.Token",
          visible: this.#canConfigureToken,
          ownership: "OWNER",
        },
        {
          action: "configurePrototypeToken",
          icon: "fa-solid fa-circle-user",
          label: "TOKEN.TitlePrototype",
          visible: this.#canConfigurePrototype,
          ownership: "OWNER",
        },
        {
          action: "showPortraitArtwork",
          icon: "fa-solid fa-image",
          label: "SIDEBAR.CharArt",
          visible: this.#canViewCharacterArt,
          ownership: "OWNER",
        },
        {
          action: "showTokenArtwork",
          icon: "fa-solid fa-image",
          label: "SIDEBAR.TokenArt",
          visible: this.#canViewTokenArt,
          ownership: "OWNER",
        },
      ],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "weapons" },
        { id: "abilities" },
        { id: "equipment" },
        { id: "echoes" },
        { id: "effects" },
        { id: "biography" },
      ],
      initial: "weapons",
      labelPrefix: "HOLLOWS_RPG.Actor.Tabs",
    },
  };

  /* -------------------------------------------- */

  /**
   * The Actor document managed by this sheet.
   * @type {HollowsRPGActor}
   */
  get actor() {
    return this.document;
  }

  /* -------------------------------------------- */

  /**
   * If this sheet manages the ActorDelta of an unlinked Token, reference that Token document.
   * @type {HollowsRPGTokenDocument | null}
   */
  get token() {
    return this.document.token;
  }
  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);

    if (this.actor.limited) {
      const { header, tabs, biography } = parts;
      return { header, tabs, biography };
    }

    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    Object.assign(context, {
      datasets: this._getDatasets(),
    });
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);

    if (group === "primary") {
      if (this.actor.limited) {
        tabs.biography.active = true;
        tabs.biography.cssClass = "active";
        return { biography: tabs.biography };
      }

      if (this.actor.type !== "hunter") {
        delete tabs.weapons;
        delete tabs.equipment;
        delete tabs.echoes;
      }
    }

    return tabs;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "header":
        context.avatarProperties = this._prepareAvatarCSS();
        break;
      case "biography":
        context.enrichedBiography = await enrichHTML(this.actor.system.biography.value, { relativeTo: this.actor });
        context.enrichedDirectorNotes = await enrichHTML(this.actor.system.biography.director, { relativeTo: this.actor });
        break;
      case "effects":
        context.statuses = await this._prepareStatusEffects();
        context.effects = await this._prepareActiveEffectCategories();
        break;
    }
    if (partId in context.tabs) context.tab = context.tabs[partId];
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare avatar adjustments context.
   * @returns {object}
   */
  _prepareAvatarCSS() {
    const { objectFit, objectPosition } = this.document.getFlag(hollows.CONST.systemID, "avatarProperties") ?? {};
    return {
      objectFit: CSS.supports("object-fit", objectFit) ? objectFit : null,
      objectPosition: CSS.supports("object-position", objectPosition) ? objectPosition : null,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Helper to compose datasets available in the hbs.
   * @returns {Record<string, unknown>}
   * @protected
   */
  _getDatasets() {
    return {
      isSource: { source: true },
      notSource: { source: false },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Generate the context data shared between item types.
   * @param {HollowsRPGItem} item
   * @returns {Promise<ActorSheetItemContext>}
   */
  async _prepareItemContext(item) {
    const context = {
      item,
      expanded: this._expandedDocumentDescriptions.has(item.uuid),
    };

    // only generate the item embed when it's expanded
    if (context.expanded) context.embed = await item.system.toEmbed({ includeName: false });

    return context;
  }

  /* -------------------------------------------------- */

    /**
   * @typedef StatusInfo
   * @property {string} _id
   * @property {string} name
   * @property {string} img
   * @property {boolean} disabled
   * @property {"active" | ""} active
   * @property {string} [tooltip]
   */

  /**
   * Prepare the data structure for status effects and whether they are active.
   * @protected
   */
  async _prepareStatusEffects() {
    /** @type {Record<string, StatusInfo>} */
    const statusInfo = {};
    for (const status of CONFIG.statusEffects) {
      // Only display if it would show in the token HUD, is marked for sheet display, *and* it has an assigned _id

      if ((!status._id) || (status.sheet === false)) continue;
      statusInfo[status.id] = {
        _id: status._id,
        name: status.name,
        img: status.img,
        disabled: false,
        active: "",
      };

      if (status.rule) {
        const page = await fromUuid(status.rule);
        statusInfo[status.id].tooltip = await enrichHTML(page.text.content, { relativeTo: this.actor });
      }
    }

    // If the actor has the status and it's not from the canonical statusEffect
    // Then we want to force more individual control rather than allow toggleStatusEffect
    for (const effect of this.actor.allApplicableEffects()) {
      for (const id of effect.statuses) {
        if (!(id in statusInfo)) continue;
        statusInfo[id].active = "active";
        if (!Object.values(statusInfo).some(s => s._id === effect._id)) statusInfo[id].disabled = true;
      }
    }

    return statusInfo;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
   * @return {Record<string, ActiveEffectCategory>} Data for rendering.
   * @protected
   */
  async _prepareActiveEffectCategories() {
    /** @type {Record<string, ActiveEffectCategory>} */
    const categories = {
      temporary: {
        type: "temporary",
        label: game.i18n.localize("HOLLOWS_RPG.Effect.Temporary"),
        effects: [],
      },
      passive: {
        type: "passive",
        label: game.i18n.localize("HOLLOWS_RPG.Effect.Passive"),
        effects: [],
      },
      inactive: {
        type: "inactive",
        label: game.i18n.localize("HOLLOWS_RPG.Effect.Inactive"),
        effects: [],
      },
    };

    // Iterate over active effects, classifying them into categories
    const applicableEffects = [...this.actor.allApplicableEffects()].sort((a, b) => a.sort - b.sort);
    for (const e of applicableEffects) {
      const effectContext = {
        id: e.id,
        uuid: e.uuid,
        name: e.name,
        img: e.img,
        parent: e.parent,
        sourceName: e.sourceName,
        duration: e.duration,
        disabled: e.disabled,
        expanded: false,
      };

      if (this._expandedDocumentDescriptions.has(e.uuid)) {
        effectContext.expanded = true;
        effectContext.enrichedDescription = await e.system.toEmbed({});
      }

      if (!e.active) categories.inactive.effects.push(effectContext);
      else if (e.isTemporary) categories.temporary.effects.push(effectContext);
      else categories.passive.effects.push(effectContext);
    }

    // Sort each category
    for (const c of Object.values(categories)) {
      c.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    }
    return categories;
  }

  /* -------------------------------------------------- */
  /*   Application Life-Cycle Events                    */
  /* -------------------------------------------------- */

  /** @inheritdoc*/
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    // General right click on row
    this._createContextMenu(this._getDocumentListContextOptions, "[data-document-uuid]", {
      hookName: "getDocumentListContextOptions",
      parentClassHooks: false,
      fixed: true,
    });

    // Same menu but for the specific vertical ellipsis control
    this._createContextMenu(this._getDocumentListContextOptions, "[data-action=\"documentListContext\"]", {
      hookName: "getDocumentListContextOptions",
      parentClassHooks: false,
      fixed: true,
      eventName: "click",
    });

    this._createContextMenu(this._createEffectContextOptions, ".effect-list-container .effect-create", {
      hookName: "createEffectContextOptions",
      parentClassHooks: false,
      fixed: true,
      eventName: "click",
    });
  }

  /* -------------------------------------------------- */

  /**
   * Get context menu entries for embedded document lists.
   * @returns {ContextMenuEntry[]}
   * @protected
   */
  _getDocumentListContextOptions() {
    // name is auto-localized
    return [
      // Active Effect options
      {
        name: "HOLLOWS_RPG.Effect.Toggle",
        icon: "<i class=\"fa-solid fa-fw fa-check\"></i>",
        condition: (target) => {
          const effect = this._getEmbeddedDocument(target);
          return (effect.documentName === "ActiveEffect") && !effect.active;
        },
        callback: async (target) => {
          const effect = this._getEmbeddedDocument(target);
          const updateData = HollowsRPGActiveEffect.getInitialDuration();

          updateData.disabled = false;

          await effect.update(updateData);
        },
      },
      {
        name: "HOLLOWS_RPG.Effect.Toggle",
        icon: "<i class=\"fa-solid fa-fw fa-times\"></i>",
        condition: (target) => {
          const effect = this._getEmbeddedDocument(target);
          return (effect.documentName === "ActiveEffect") && effect.active;
        },
        callback: async (target) => {
          const effect = this._getEmbeddedDocument(target);
          await effect.update({ disabled: true });
        },
      },
      // All applicable options
      {
        name: "HOLLOWS_RPG.SHEET.View",
        icon: "<i class=\"fa-solid fa-fw fa-eye\"></i>",
        condition: () => this.isPlayMode,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await document.sheet.render({ force: true, mode: HollowsDocumentSheet.MODES.PLAY });
        },
      },
      {
        name: "HOLLOWS_RPG.SHEET.Edit",
        icon: "<i class=\"fa-solid fa-fw fa-edit\"></i>",
        condition: () => this.isEditMode,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await document.sheet.render({ force: true, mode: HollowsDocumentSheet.MODES.EDIT });
        },
      },
      {
        name: "HOLLOWS_RPG.SHEET.Share",
        icon: "<i class=\"fa-solid fa-fw fa-share-from-square\"></i>",
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await HollowsRPGChatMessage.create({
            content: `@Embed[${document.uuid} caption=false]`,
            speaker: HollowsRPGChatMessage.getSpeaker({ actor: this.actor }),
            title: document.name,
            flags: {
              core: { canPopout: true },
            },
          });
        },
      },
      {
        name: "HOLLOWS_RPG.SHEET.Delete",
        icon: "<i class=\"fa-solid fa-fw fa-trash\"></i>",
        condition: () => this.actor.isOwner,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          if (document.hasGrantedItems) await document.advancementDeletionPrompt();
          else await document.deleteDialog();
        },
      },
    ];
  }

  /* -------------------------------------------------- */

    /**
   * Get context menu entries for creating Active Effects.
   * @returns {ContextMenuEntry[]}
   */
  _createEffectContextOptions() {
    return [
      {
        name: game.i18n.format("DOCUMENT.Create", { type: game.i18n.localize("DOCUMENT.ActiveEffect") }),
        icon: `<i class="${CONFIG.ActiveEffect.typeIcons.base}"></i>`,
        condition: () => this.isEditable,
        callback: (target) => {
          const effectClass = getDocumentClass("ActiveEffect");
          const effectData = {
            name: effectClass.defaultName({ parent: this.actor }),
            img: "icons/svg/aura.svg",
            type: "base",
            origin: this.actor.uuid,
          };
          for (const [dataKey, value] of Object.entries(target.dataset)) {
            if (["action", "documentClass", "renderSheet"].includes(dataKey)) continue;
            foundry.utils.setProperty(effectData, dataKey, value);
          }

          effectClass.create(effectData, { parent: this.actor, renderSheet: true });
        },
      }
    ];
  }

  /* -------------------------------------------------- */

    /**
   * Actions performed after any render of the Application.
   * @param {ApplicationRenderContext} context      Prepared context data.
   * @param {RenderOptions} options                 Provided render options.
   * @protected
   * @inheritdoc
   */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#disableOverrides();
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Include "Prototype Token" in the window controls.
   * @this HollowsRPGActorSheet
   */
  static #canConfigurePrototype() {
    return this.isEditable && !this.actor.isToken;
  }

  /* -------------------------------------------------- */

  /**
   * Include "Token" in the window controls.
   * @this HollowsRPGActorSheet
   */
  static #canConfigureToken() {
    return this.isEditable && this.actor.isToken;
  }

  /* -------------------------------------------------- */

  /**
   * Include "View Character Artwork" in the window controls.
   * @this HollowsRPGActorSheet
   */
  static #canViewCharacterArt() {
    return this.actor.img !== CONST.DEFAULT_TOKEN;
  }

  /* -------------------------------------------------- */

  /**
   * Include "View Token Artwork" in the window controls.
   * @this HollowsRPGActorSheet
   */
  static #canViewTokenArt() {
    const prototypeToken = this.actor.prototypeToken;
    const tex = prototypeToken.texture.src;
    return (!prototypeToken.randomImg && ![null, undefined, CONST.DEFAULT_TOKEN].includes(tex));
  }

  /* -------------------------------------------------- */

  /**
   * Creates or deletes a configured status effect.
   *
   * @this HollowsRPGActorSheet
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
   * @this HollowsRPGActorSheet
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
   * @this HollowsRPGActorSheet
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
        const stat = dataset.stat;
        return this.actor.rollStat({stat});
      case "item":
        const item = this._getEmbeddedDocument(target);
        await item.system.use()
        break;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Open a dialog to edit niche combat data.
   *
   * @this HollowsRPGActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #editCombat(event, target) {
    return new ActorCombatStatsInput({ document: this.actor }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Handle clickable rolls.
   *
   * @this HollowsRPGActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #useItem(event, target) {
    const item = this._getEmbeddedDocument(target);
    if (item?.type !== "weapon") {
      console.error("This is not an weapon!", item);
      return;
    }
    await item.system.use({ event });
  }

  /* -------------------------------------------------- */
  /*   Drag and Drop                                    */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropItem(event, item) {
    if (!this.actor.isOwner) return null;
    if (this.actor.uuid === item.parent?.uuid) {
      const result = await this._onSortItem(event, item);
      return result?.length ? item : null;
    }
    const keepId = !this.actor.items.has(item.id);
    const itemData = game.items.fromCompendium(item, { keepId, clearFolder: true });
    const result = await Item.implementation.create(itemData, { parent: this.actor, keepId });
    return result ?? null;
  }

  /* -------------------------------------------- */

  /**
   * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings.
   * @param {DragEvent} event     The initiating drop event.
   * @param {HollowsRPGItem} item           The dropped Item document.
   * @returns {Promise<HollowsRPGItem[]>|void}
   * @protected
   */
  _onSortItem(event, item) {
    // Confirm the drop target
    const dropTarget = event.target.closest("[data-document-uuid]");
    if (!dropTarget) return;
    const target = this._getEmbeddedDocument(dropTarget);

    // Don't sort on yourself
    if (item.id === target.id) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      if (!el.dataset.documentUuid) continue;
      const sibling = this._getEmbeddedDocument(el);
      if (sibling.id !== item.id) siblings.push(sibling);
    }

    // Perform the sort
    const sortUpdates = foundry.utils.performIntegerSort(item, { target, siblings });
    const updateData = sortUpdates.map(u => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.actor.updateEmbeddedDocuments("Item", updateData);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropActiveEffect(event, effect) {
    if (!this.actor.isOwner || !effect) return;
    if (effect.target === this.actor) {
      const result = await this._onSortActiveEffect(event, effect);
      return result?.length ? effect : null;
    }
    const keepId = !this.actor.effects.has(effect.id);
    const effectData = game.items.fromCompendium(effect);
    const result = await ActiveEffect.implementation.create(effectData, { parent: this.actor, keepId });
    return result ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings.
   *
   * @param {DragEvent} event       The initiating drop event.
   * @param {HollowsRPGActiveEffect} effect   The dropped ActiveEffect document.
   * @returns {Promise<HollowsRPGActiveEffect[]>|void}
   * @protected
   */
  async _onSortActiveEffect(event, effect) {
    /** @type {HTMLElement} */
    const dropTarget = event.target.closest("[data-document-uuid]");
    if (!dropTarget) return;
    const target = this._getEmbeddedDocument(dropTarget);

    // Don't sort on yourself
    if (effect.uuid === target.uuid) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      if (!el.dataset.documentUuid) continue;
      const sibling = this._getEmbeddedDocument(el);
      if (sibling.uuid !== effect.uuid) siblings.push(sibling);
    }

    // Perform the sort
    const sortUpdates = foundry.utils.performIntegerSort(effect, {
      target,
      siblings,
    });

    // Split the updates up by parent document
    const directUpdates = [];

    const grandchildUpdateData = sortUpdates.reduce((effects, u) => {
      const parentId = u.target.parent.id;
      const update = { _id: u.target.id, ...u.update };
      if (parentId === this.actor.id) {
        directUpdates.push(update);
        return effects;
      }
      if (effects[parentId]) effects[parentId].push(update);
      else effects[parentId] = [update];
      return effects;
    }, {});

    // Effects-on-items updates
    for (const [itemId, updates] of Object.entries(grandchildUpdateData)) {
      await this.actor.items
        .get(itemId)
        .updateEmbeddedDocuments("ActiveEffect", updates);
    }

    // Update on the main actor
    return this.actor.updateEmbeddedDocuments("ActiveEffect", directUpdates);
  }

  /* -------------------------------------------------- */

  /**
   * Handle a dropped Folder on the Actor SHEET.
   * @param {DragEvent} event     The initiating drop event.
   * @param {Folder} folder       The dropped Folder document.
   * @returns {Promise<Folder|null|undefined>} A Promise resolving to the dropped Folder indicate success, or a nullish
   *                                           value to indicate failure or no action being taken.
   * @protected
   */
  async _onDropFolder(event, folder) {
    if (!this.actor.isOwner) return [];
    if (folder.type !== "Item") return []; // V14 - handle ActiveEffect
    const droppedItemData = await Promise.all(
      folder.contents.map(async (item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);

        const keepId = !this.actor.items.has(item.id);

        return game.items.fromCompendium(item, { keepId, clearFolder: true });
      }),
    );
    this.actor.createEmbeddedDocuments("Item", droppedItemData, { keepId: true });
    return folder;
  }

  /* -------------------------------------------------- */
  /*   Actor Override Handling                          */
  /* -------------------------------------------------- */

  /**
   * Disables inputs subject to active effects.
   */
  #disableOverrides() {
    const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
    for (const override of Object.keys(flatOverrides)) {
      const input = this.element.querySelector(`[name="${override}"][data-source="false"]`);
      if (input) {
        input.disabled = true;
      }
    }
  }
}
