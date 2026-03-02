import { requiredInteger } from "../../helpers.mjs";
import BaseAction from "./base-action.mjs";
import DamageRoll from "../../../rolls/damage.mjs";
import {systemPath} from "../../../constants.mjs";
import HollowsPRGChatMessage from "../../../documents/chat-message.mjs";

const { SetField } = foundry.data.fields;

/**
 * For abilities that do damage.
 */
export default class DamageAction extends BaseAction {
  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.damage = new fields.SchemaField({
      type: new fields.StringField({ required: true}),
      resolve: requiredInteger({ initial: 0}),
      wounds: requiredInteger({ initial: 0})
    })

    return schema;
  }

   /* -------------------------------------------------- */

  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("HOLLOWS_RPG.ACTION.damage");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "damage";
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

  /** @inheritdoc */
  preparePostAbilityPrepData() {
    super.preparePostAbilityPrepData();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context, options) {
    await super._tierRenderingContext(context, options);

  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _actionRenderingContext(context, options) {
    await super._actionRenderingContext(context, options);
    context.detailsPartial = [systemPath("templates/sheets/pseudo-documents/action-sheet/partials/damage.hbs")];
    context.types = Object.entries(hollows.CONFIG.health).map(([value, { label }]) => ({ value, label }));
  }

  /* -------------------------------------------------- */

  /**
   * @param {1 | 2 | 3} tier
   * @inheritdoc
   */
  toText(tier) {

    let result = `<span data-tooltip="${value}" data-tooltip-direction="UP">${formattedDamageString}</span>`;

    if (ignoredImmunities.size > 0) {
      const ignoredTypes = Array.from(ignoredImmunities);
      // Special case for "all" immunity
      if (ignoredImmunities.has("all")) {
        result += ` <em>(${game.i18n.localize("DRAW_STEEL.POWER_ROLL_EFFECT.DAMAGE.IgnoresAllImmunities")})</em>`;
      } else {
        const formatter = game.i18n.getListFormatter({ type: "conjunction" });
        const typeLabels = ignoredTypes.map(t => ds.CONFIG.damageTypes[t]?.label).filter(_ => _);
        if (typeLabels.length > 0) {
          result += ` <em>(${game.i18n.format("DRAW_STEEL.POWER_ROLL_EFFECT.DAMAGE.IgnoresImmunities", { types: formatter.format(typeLabels) })})</em>`;
        }
      }
    }

    if (potency.characteristic === "none") return result;

    const potencyString = this.toPotencyHTML(tier);

  }

  /* -------------------------------------------------- */

  /**
   * Produce a damage roll.
   * @param {1 | 2 | 3} tier        The tier of this effects' data to fetch.
   * @param {object} [options]
   * @param {string} [options.damageSelection] Pick between this damage effect's multiple damage types.
   * @returns {DamageRoll | null} Returns null if there would be no damage from that tier.
   */
  toDamageRoll(tier, options = {}) {
    const effectTier = this.damage[`tier${tier}`];
    if (Number(effectTier.value) === 0) return null;

    let damageType = "";
    if (effectTier.types.size === 1) damageType = effectTier.types.first();
    else if (effectTier.types.size > 1) damageType = options.damageSelection;

    const damageLabel = ds.CONFIG.damageTypes[damageType]?.label ?? damageType ?? "";
    const flavor = game.i18n.format("DRAW_STEEL.Item.ability.DamageFlavor", { type: damageLabel });

    // Extract ignoredImmunities from the damage effect
    const ignoredImmunities = Array.from(effectTier.ignoredImmunities);

    return new DamageRoll(String(effectTier.value), this.item.getRollData(), {
      flavor,
      type: damageType,
      ignoredImmunities,
    });
  }

    /* -------------------------------------------------- */

  /**
   * Use an ability, generating a chat message and potentially making a power roll.
   * @param {Partial<AbilityUseOptions>} [options={}] Configuration.
   * @returns {Promise<DrawSteelChatMessage[] | null>}
   * TODO: Add hooks based on discussion with module authors.
   */
  async use(options = {}) {
    if (!this.actor) {
      ui.notifications.warn("HOLLOWS_RPG.ACTION.Error.NoActor", { localize: true });
      return;
    }

    if (!this.damage.type) {
      ui.notifications.warn("HOLLOWS_RPG.ACTION.Error.NoTarget", { localize: true });
      return;
    }

    const flavor = 'Damage';

    const messageData = {
      speaker: HollowsPRGChatMessage.getSpeaker({ actor: this.parent }),
      title: flavor,
      rolls: [],
      sound: CONFIG.sounds.dice,
      flags: { core: { canPopout: true } },
    };

    const formula = String(this.damage[this.damage.type]);

    if (formula) {
      const damageRoll = new DamageRoll(formula, this.item, options = {type: this.damage.type});
      await damageRoll.evaluate();
      messageData.rolls.push(damageRoll);
    }

    return HollowsPRGChatMessage.create(messageData);
  }

  /* -------------------------------------------------- */

  /**
   * An alias of {@linkcode use}.
   */
  async roll(options = {}) {
    this.system.use(options);
  }
}