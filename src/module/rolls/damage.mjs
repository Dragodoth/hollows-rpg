import {systemPath} from "../constants.mjs";
import HOLLOWSRoll from "./base.mjs";

/**
 * Contains damage-specific info like damage types.
 */
export default class DamageRoll extends HOLLOWSRoll {
  constructor(formula, data = {}, options = {}) {
    super(formula, data, options);
  }

  /* -------------------------------------------------- */

  static CHAT_TEMPLATE = systemPath("templates/rolls/damage.hbs");

  /* -------------------------------------------------- */

  /**
   * Button callback to apply damage to selected actors.
   * @param {PointerEvent} event
   */
  static async applyDamageCallback(event) {
    if (!canvas.tokens.controlled.length) return void ui.notifications.error("HOLLOWS_RPG.ChatMessage.damage.NoTokenSelected", { localize: true });

    const li = event.currentTarget.closest("[data-message-id]");
    const message = game.messages.get(li.dataset.messageId);
    /** @type {DamageRoll} */
    const roll = message.rolls[event.currentTarget.dataset.index];
    const type = roll.options.type;
    let amount = roll.total;
    for (const actor of hollows.utils.tokensToActors()) {
      if (roll.isHeal) {
        const isTemp = roll.healingType !== "value";
        if (isTemp && (amount < actor.system.health[type].temporary)) ui.notifications.warn("HOLLOWS_RPG.ChatMessage.base.Buttons.ApplyHeal.TempCapped", {
          format: { name: actor.name },
        });
        else await actor.modifyTokenAttribute(isTemp ? "health." + type + ".temporary" : "health." + type, amount, !isTemp, !isTemp);
      }
      else await actor.system.takeDamage(amount, type );
    }
  }

  /* -------------------------------------------------- */

  /**
   * The damage type.
   * @type {string}
   */
  get type() {
    return this.options.type ?? "";
  }

  /**
   * The healing type.
   * @type {string}
   */
  get healingType() {
    return this.isHeal && this.options.healingType ? this.options.healingType : "";
  }

  /* -------------------------------------------------- */

  /**
   * The localized label for this damage roll's type.
   * @type {string}
   */
  get typeLabel() {
    return hollows.CONFIG.health[this.type]?.label ?? "";
  }

  /**
   * The localized label for this damage roll's type.
   * @type {string}
   */
  get healingTypeLabel() {
    if (this.isHeal) return hollows.CONFIG.healingTypes[[this.healingType]]?.label;
  }

  /* -------------------------------------------------- */

  /**
   * Does this represent healing?
   * @type {boolean}
   */
  get isHeal() {
    return this.options.isHeal || false;
  }

  /* -------------------------------------------------- */

  /**
   * Produces a button with relevant data to applying this damage.
   * @param {number} index The index of this roll in the `rolls` array of the message.
   * @returns {HTMLButtonElement} A button that.
   */
  toRollButton(index) {
    const labelPath = this.isHeal ? "HOLLOWS_RPG.ChatMessage.base.Buttons.ApplyHeal.Label" : "HOLLOWS_RPG.ChatMessage.base.Buttons.ApplyDamage.Label";

    return hollows.utils.constructHTMLButton({
      label: game.i18n.format(labelPath, {
        type: this.healingTypeLabel ? " " + this.healingTypeLabel : " " + this.typeLabel,
        amount: this.total,
        health: this.healingTypeLabel ? this.typeLabel : ""
      }),
      dataset: {
        index
      },
      classes: ["apply-damage"],
      icon: this.isHeal ? "fa-solid fa-heart-pulse" : "fa-solid fa-burst",
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareChatRenderContext({ flavor, isPrivate = false, ...options } = {}) {
    const context = await super._prepareChatRenderContext({ flavor, isPrivate, ...options });

    context.health = {
     label: isPrivate ? "" : game.i18n.localize(hollows.CONFIG.health[this.type].label),
     class: this.result,
    };

    context.isHeal = this.isHeal;
    context.healingType = this.healingType

    if (!isPrivate) {
      context.flavorlessFormula = this.flavorlessFormula;
    } else context.flavorlessFormula = "???";
    return context;
  }
}