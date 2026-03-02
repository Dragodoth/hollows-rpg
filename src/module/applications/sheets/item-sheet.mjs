import { systemPath } from "../../constants.mjs";
import { HollowsRPGChatMessage } from "../../documents/_module.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import HollowsDocumentSheet from "../api/document-sheet.mjs";
import BaseAction from "../../data/pseudo-documents/actions/base-action.mjs";

/**
 * @import ProseMirrorEditor from "@client/applications/ux/prosemirror-editor.mjs";
 * @import { HollowsRPGActiveEffect, HollowsRPGItem } from "../../documents/_module.mjs";
 * @import BaseItemModel from "../../data/item/base.mjs";
 * @import PseudoDocument from "../../data/pseudo-documents/pseudo-document.mjs";
 */

const { ux } = foundry.applications;

/**
 * AppV2-based sheet for all item subtypes.
 */
export default class HollowsRPGItemSheet extends HollowsDocumentSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["item"],
    position: {
      // Allows "Allow Me to Introduce Tonight’s Players" to fit in two lines
      // Also ensures the prosemirror editor bar doesn't overflow to a second line when selecting a paragraph element
      width: 580,
    },
    actions: {
      showImage: this.#showImage,
      updateSource: this.#updateSource,
      editHTML: this.#editHTML,
      toggleEffect: this.#toggleEffect,
    }
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "description" },
        { id: "details" },
        { id: "actions" },
        { id: "effects" },
      ],
      initial: "description",
      labelPrefix: "HOLLOWS_RPG.Item.Tabs",
    },
  };

  /* -------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/sheets/item/header.hbs"),
      templates: ["templates/sheets/item/header.hbs"].map(t => systemPath(t)),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    description: {
      template: systemPath("templates/sheets/item/description.hbs"),
      scrollable: [""],
    },
    details: {
      template: systemPath("templates/sheets/item/details.hbs"),
      scrollable: [""],
    },
    actions: {
      template: systemPath("templates/sheets/item/actions.hbs"),
      scrollable: [""],
    }
  };

  /* -------------------------------------------------- */

  /**
   * The Item document managed by this sheet.
   * @type {HollowsRPGItem}
   */
  get item() {
    return this.document;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const { header, tabs, description, details, actions} = super._configureRenderParts(options);

    const parts = { header, tabs };

    /** @type {typeof BaseItemModel} */
    const itemModel = this.item.system.constructor;

    // Don't re-render the description tab if there's an active editor
    if (!this.#editor && itemModel.schema.has("description")) parts.description = description;
    if (this.item.limited) return;
    if (this.item.system.constructor.metadata.detailsPartial) parts.details = details;
    parts.actions = actions;
    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    // If there's no description, set the active tab to details
    if ((this.tabGroups.primary === "description") && !this.item.system.constructor.schema.has("description")) this.tabGroups.primary = "details";

    // One tab group means ApplicationV2#_prepareContext will populate `tabs`
    const context = await super._prepareContext(options);

    Object.assign(context, {
      system: context.isPlay ? context.system : context.systemSource,
      tabGroups: this.tabGroups,
    });
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    if (partId in context.tabs) context.tab = context.tabs[partId];

    switch (partId) {
      case "description":
        context.enrichedDescription = await enrichHTML(this.item.system.description.value, { relativeTo: this.item });
        context.enrichedDirectorNotes = await enrichHTML(this.item.system.description.director, { relativeTo: this.item });
        break;
      case "details":
        context.detailsPartial = this.item.system.constructor.metadata.detailsPartial ?? null;
        await this.item.system.getSheetContext(context);
        break;
      case "advancement":
        break;
      case "actions":
        context.actionIcon = BaseAction.metadata.icon;
        break;
      case "effects":
        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);
    if (group === "primary") {
      /** @type {typeof BaseItemModel} */
      const itemModel = this.item.system.constructor;
      if (!itemModel.schema.has("description")) delete tabs.description;
      if (!itemModel.metadata.detailsPartial) delete tabs.details;
    }

    return tabs;
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
  }

  /* -------------------------------------------------- */

  /**
   * Get context menu entries for embedded document lists.
   * @returns {ContextMenuEntry[]}
   * @protected
   */
  _getDocumentListContextOptions() {
    return [
      {
        name: "HOLLOWS_RPG.SHEET.View",
        icon: "<i class=\"fa-solid fa-fw fa-eye\"></i>",
        condition: () => this.isPlayMode,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await document.sheet.render({ force: true });
        },
      },
      {
        name: "HOLLOWS_RPG.SHEET.Edit",
        icon: "<i class=\"fa-solid fa-fw fa-edit\"></i>",
        condition: () => this.isEditMode,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await document.sheet.render({ force: true });
        },
      },
      {
        name: "HOLLOWS_RPG.SHEET.Share",
        icon: "<i class=\"fa-solid fa-fw fa-share-from-square\"></i>",
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await HollowsRPGChatMessage.create({
            content: `@Embed[${document.uuid} caption=false]`,
            speaker: HollowsRPGChatMessage.getSpeaker({ actor: this.item.actor }),
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
        condition: () => this.item.isOwner,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          document.deleteDialog();
        },
      },
    ];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Bubble editor active class state to containing formGroup
    /** @type {Array<HTMLButtonElement>} */
    const editorButtons = this.element.querySelectorAll("prose-mirror button[type=\"button\"]");
    for (const button of editorButtons) {
      const formGroup = button.closest(".form-group");
      const tabSection = button.closest("section.tab");
      button.addEventListener("click", (ev) => {
        formGroup.classList.add("active");
        tabSection.classList.add("editorActive");
      });
    }
    /** @type {Array<HTMLElement>} */
    const editors = this.element.querySelectorAll("prose-mirror");
    for (const ed of editors) {
      const formGroup = ed.closest(".form-group");
      const tabSection = ed.closest("section.tab");
      ed.addEventListener("close", (ev) => {
        formGroup.classList.remove("active");
        tabSection.classList.remove("editorActive");
      });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onClose(options) {
    super._onClose(options);
    if (this.#editor) this.#saveEditor();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _attachPartListeners(partId, htmlElement, options) {
    super._attachPartListeners(partId, htmlElement, options);

    if (partId === "details") this.item.system._attachPartListeners(htmlElement, options);
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Display the item image.
   *
   * @this HollowsRPGItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #showImage(event, target) {
    const { img, name, uuid } = this.item;
    new foundry.applications.apps.ImagePopout({ src: img, uuid, window: { title: name } }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Open the update source dialog.
   *
   * @this HollowsRPGItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #updateSource(event, target) {
    new DocumentSourceInput({ document: this.item }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Active editor instance in the description tab.
   * @type {ProseMirrorEditor}
   */
  #editor = null;

  /* -------------------------------------------------- */

  /**
   * Handle saving the editor content.
   */
  async #saveEditor() {
    const newValue = ProseMirror.dom.serializeString(this.#editor.view.state.doc.content);
    const [uuid, fieldName] = this.#editor.uuid.split("#");
    this.#editor.destroy();
    this.#editor = null;
    const currentValue = foundry.utils.getProperty(this.item, fieldName);
    if (newValue !== currentValue) {
      await this.item.update({ [fieldName]: newValue });
    } else await this.render();
  }

  /* -------------------------------------------------- */

  /**
   * Create a TextEditor instance that takes up the whole tab.
   *
   * @this HollowsRPGItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #editHTML(event, target) {
    /** @type {HTMLDivElement} */
    const tab = target.closest("section.tab");
    /** @type {HTMLDivElement} */
    const wrapper = target.closest(".prosemirror.editor");
    tab.classList.add("editorActive");
    wrapper.classList.add("active");
    /** @type {HTMLDivElement} */
    const editorContainer = wrapper.querySelector(".editor-content");
    const content = foundry.utils.getProperty(this.item, target.dataset.fieldName);
    this.#editor = await ux.ProseMirrorEditor.create(editorContainer, content, {
      document: this.item,
      fieldName: target.dataset.fieldName,
      relativeLinks: true,
      collaborate: true,
      plugins: {
        menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
          destroyOnSave: true,
          onSave: this.#saveEditor.bind(this),
        }),
        keyMaps: ProseMirror.ProseMirrorKeyMaps.build(ProseMirror.defaultSchema, {
          onSave: this.#saveEditor.bind(this),
        }),
        highlightDocumentMatches: ProseMirror.ProseMirrorHighlightMatchesPlugin.build(ProseMirror.defaultSchema, {
          onSave: this.#saveEditor.bind(this),
        }),
      },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Determines effect parent to pass to helper.
   *
   * @this HollowsRPGItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #toggleEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /* -------------------------------------------------- */
  /*   Drag and Drop                                    */
  /* -------------------------------------------------- */


  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropPseudoDocument(event, pseudo) {
    if (!this.item.pseudoCollections[pseudo.documentName]) return;
    switch (pseudo.documentName) {
      case "Advancement":
        return (await this._onDropAdvancement(event, pseudo)) ?? null;
      case "Action":
        return (await this._onDropAction(event, pseudo)) ?? null;
    }
    return null;
  }

  /**
   * Handle a drop event for an existing embedded PseudoDocument to sort that PseudoDocument relative to its siblings.
   *
   * @param {DragEvent} event       The initiating drop event.
   * @param {PseudoDocument} pseudo   The dropped PseudoDocument.
   * @returns {Promise<PseudoDocument[]>|void}
   * @protected
   */
  _onSortPseudoDocument(event, pseudo) {
    const dropTarget = event.target.closest("[data-pseudo-id]");
    if (!dropTarget) return null;
    const target = this._getPseudoDocument(dropTarget);

    // Don't sort on yourself
    if (pseudo.id === target.id) return null;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      if (!el.dataset?.pseudoId) continue;
      const sibling = this._getPseudoDocument(el);
      if (sibling.id !== pseudo.id) siblings.push(sibling);
    }

    // Perform the sort
    const sortUpdates = foundry.utils.performIntegerSort(pseudo, {
      target,
      siblings,
    });
    const updateData = sortUpdates.reduce((update, obj) => {
      update[obj.target.id] = obj.update;
      return update;
    }, {});

    return this.item.update({ [pseudo.fieldPath]: updateData });
  }
}