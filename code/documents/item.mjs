import { systemID, systemPath } from "../constants.mjs";
import BaseDocumentMixin from "./base-document-mixin.mjs";

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Item.documentClass.
 */
export default class HollowsRPGItem extends BaseDocumentMixin(foundry.documents.Item) {
  /** @inheritdoc */
  static migrateData(data) {
    return super.migrateData(data);
  }

  /** @inheritdoc */
  static async createDialog(data = {}, { pack, ...createOptions } = {}, { types, template, ...dialogOptions } = {}) {
    if (!pack) {
      types ??= this.TYPES;
      types = types.filter(t => !CONFIG.Item.dataModels[t].metadata?.packOnly);
      template = systemPath("templates/sidebar/tabs/item/document-create.hbs");
    }
    return super.createDialog(data, { pack, ...createOptions }, { types, template, ...dialogOptions });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getRollData() {
    const rollData = this.actor?.getRollData() ?? {};

    // Shallow copy
    rollData.item = { ...this.system, flags: this.flags, name: this.name };

    if (this.system.modifyRollData instanceof Function) {
      this.system.modifyRollData(rollData);
    }

    return rollData;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("hollows.prepareItemData", this);
  }

  /* -------------------------------------------------- */

  /**
   * Return an item's Draw Steel ID.
   * @type {string}
   */
  get hollowsid() {
    if (this.system._hollowsid) return this.system._hollowsid;
    const hollowsid = this.name.replaceAll(/(\w+)([\\|/])(\w+)/g, "$1-$3");
    return hollowsid.slugify({ strict: true });
  }
}