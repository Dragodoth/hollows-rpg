import { systemID } from "../../constants.mjs";
import HollowsPRGSystemModel from "../system-model.mjs";

const fields = foundry.data.fields;

/**
 * A base actor model that provides common properties for both heroes and npcs.
 */
export default class BaseActorModel extends HollowsPRGSystemModel {
  /** @inheritdoc */
  static defineSchema() {
    const schema = {};

    schema.health = new fields.SchemaField({
      resolve: new fields.SchemaField({
        value: new fields.NumberField({ initial: 5, nullable: false, integer: true }),
        max: new fields.NumberField({ initial: 5, nullable: false, integer: true }),
        temporary: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
      }),
      wounds: new fields.SchemaField({
        value: new fields.NumberField({ initial: 5, nullable: false, integer: true }),
        max: new fields.NumberField({ initial: 5, nullable: false, integer: true }),
        temporary: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
      })
    });

    schema.biography = new fields.SchemaField(this.actorBiography());

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["HOLLOWS_RPG.Actor.base"];

  /* -------------------------------------------------- */

  /**
   * Helper function to fill in the `biography` property.
   * @protected
   * @returns {Record<string, DataField>}
   */
  static actorBiography() {
    return {
      value: new fields.HTMLField(),
      director: new fields.HTMLField({ gmOnly: true })
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    // Object.assign(this.statuses, {});

    Object.assign(this.health.resolve, {
      min: 0,
    });

    Object.assign(this.health.wounds, {
      min: 0
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    // Apply resolve bonuses before calculating winded
    // this.resolve.max += this.stamina.bonuses;
  }

  /* -------------------------------------------------- */

  /**
   * Perform actor subtype specific modifications to the actor roll data.
   * @param {object} rollData   Pointer to the roll data object after all iterable properties of this class have been assigned as a shallow copy.
   */
  modifyRollData(rollData) {
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {Record<string, unknown>} changes
   * @param {import("@common/abstract/_types.mjs").DatabaseUpdateOperation} operation
   * @param {User} user
   */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    if (changes.system?.health?.resolve) {
      options.hollows ??= {};
      options.hollows.previousResolve = { ...this.health.resolve };
    }

    if (changes.system?.health?.wounds) {
      options.hollows ??= {};
      options.hollows.previousWounds = { ...this.health.wounds };
    }
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {object} changed            The differential data that was changed relative to the documents prior values.
   * @param {object} options            Additional options which modify the update request.
   * @param {string} userId             The id of the User requesting the document update.
   * @protected
   * @internal
   */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if ((game.userId === userId) && changed.system?.health?.resolve) this.updateHealthEffects("resolve");
    if ((game.userId === userId) && changed.system?.health?.wounds) this.updateHealthEffects("wounds");

    if (options.hollows?.previousResolve && changed.system?.health?.resolve) {
      const resDiff = options.hollows.previousResolve.value - (changed.system.health.resolve.value || options.hollows.previousResolve.value);
      const tempDiff = options.hollows.previousResolve.temporary - (changed.system.health.resolve.temporary || options.hollows.previousResolve.temporary);
      const diff = resDiff + tempDiff;
      const healthType = changed.system?.health ? Object.keys(changed.system.health) : null
      this.displayHealthChange(diff, Object.keys(changed.system?.health) ?? null);
    }

    if (options.hollows?.previousWounds && changed.system?.health?.wounds) {
      const woundDiff = options.hollows.previousWounds.value - (changed.system.health.wounds.value || options.hollows.previousWounds.value);
      const tempDiff = options.hollows.previousWounds.temporary - (changed.system.health.wounds.temporary || options.hollows.previousWounds.temporary);
      const diff = woundDiff + tempDiff;
      const healthType = changed.system?.health ? Object.keys(changed.system.health) : null
      this.displayHealthChange(diff, healthType);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Update the health type effects based on updated health type values.
   * @param {string} healthType   The type of health updated.
   */
  async updateHealthEffects(healthType) {
    for (const [key, value] of Object.entries(hollows.CONST.healthEffects[healthType])) {
      let threshold = (Number.isNumeric(value.threshold)) ? value.threshold : foundry.utils.getProperty(this.parent, value.threshold);
      threshold = Number(threshold);

      const active = Number.isNumeric(threshold) && (this.health[healthType].value <= threshold);
      await this.parent.toggleStatusEffect(key, { active });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Display actor health type changes on active tokens.
   *
   * @param {number} diff The amount the actor's health type has changed.
   * @param {string} healthType The type of health updated.
   */
  async displayHealthChange(diff, healthType) {
    if (!diff || !canvas.scene) {
      return;
    }

    const damageColor = hollows.CONFIG.health[healthType]?.color ?? null;
    const tokens = this.parent.getActiveTokens();
    const displayedDiff = (-1 * diff).signedString();
    const defaultFill = (diff < 0 ? "lightgreen" : "white");
    const displayArgs = {
      fill: damageColor ?? defaultFill,
      fontSize: 32,
      stroke: 0x000000,
      strokeThickness: 4,
    };

    tokens.forEach((token) => {
      if (!token.visible || token.document.isSecret) {
        return;
      }

      const scrollingTextArgs = [
        token.center,
        displayedDiff,
        displayArgs,
      ];

      canvas.interface.createScrollingText(...scrollingTextArgs);
    });
  }

  /* -------------------------------------------------- */


  /**
   * Deal damage to the actor, accounting for immunities and resistances.
   * @param {number} damage    The amount of damage to take.
   * @param {object} [options] Options to modify the damage application.
   * @param {string} [options.type]   Valid damage type.
   * @param {Array<string>} [options.ignoredImmunities]  Which damage immunities to ignore.
   * @returns {Promise<DrawSteelActor | DrawSteelCombatantGroup>}
   */
  async takeDamage(damage, options = {}) {

    if (damage === 0) {
      ui.notifications.info("DRAW_STEEL.Actor.DamageNotification.ImmunityReducedToZero", { format: { name: this.parent.name } });
      return this.parent;
    }

    const damageTypeOption = { hollows: { damageType: options.type } };
    if (this.isMinion) {
      const combatGroups = this.combatGroups;
      if (combatGroups.size === 1) {
        return this.combatGroup.update({ "system.staminaValue": this.combatGroup.system.staminaValue - damage }, damageTypeOption);
      }
      else if (combatGroups.size === 0) {
        ui.notifications.warn("DRAW_STEEL.CombatantGroup.Error.MinionNoSquad", { localize: true });
      }
      else {
        ui.notifications.warn("DRAW_STEEL.CombatantGroup.Error.TooManySquad", { localize: true });
      }
    }
    // If there's damage left after weakness/immunities, apply damage to temporary stamina then stamina value
    const staminaUpdates = {};
    const damageToTempStamina = Math.min(damage, this.stamina.temporary);
    staminaUpdates.temporary = Math.max(0, this.stamina.temporary - damageToTempStamina);

    const remainingDamage = Math.max(0, damage - damageToTempStamina);
    if (remainingDamage > 0) staminaUpdates.value = this.stamina.value - remainingDamage;

    return this.parent.update({ "system.stamina": staminaUpdates }, damageTypeOption);
  }

  /* -------------------------------------------------- */


}