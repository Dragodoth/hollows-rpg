import BaseDocumentMixin from "./base-document-mixin.mjs";


/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Actor.documentClass.
 */
export default class HollowsRPGActor extends BaseDocumentMixin(foundry.documents.Actor) {
  /** @inheritdoc */
  static migrateData(data) {
    if (data.type === "character") {
      data.type = "hunter";
      foundry.utils.setProperty(data, "flags.hollows-rpg.migrateType", true);
    }
    return super.migrateData(data);
  }

  /** @inheritdoc */
  getRollData() {
    // Shallow copy
    const rollData = { ...this.system, flags: this.flags, name: this.name, statuses: {} };

    for (const status of this.statuses) {
      rollData.statuses[status] = 1;
    }

    if (this.system.modifyRollData instanceof Function) {
      this.system.modifyRollData(rollData);
    }

    return rollData;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    // prepare derived item data that relies on derived actor values (i.e. ability potencies)
    for (const item of this.items) {
      // item.system.preparePostActorPrepData();
    }

    Hooks.callAll("hollows.prepareActorData", this);
  }

  /* -------------------------------------------------- */

  /**
   * Rolls a given actor's stat.
   * @param {string} stat
   * @param {object} [options] Pass through options object.
   * @returns
   */
  async rollStat(stat, options) {
    if (this.system.rollStat instanceof Function) return this.system.rollStat(stat, options);
    throw new Error(`Actors of type ${this.type} cannot roll stats`);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc /
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    switch (attribute) {
      case "stamina": return this.#modifyStamina(value, isDelta);
      case "hero.primary.value": return this.#modifyHeroicResource(value, isDelta);
      default: return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
    }
  }

  / -------------------------------------------------- */


}