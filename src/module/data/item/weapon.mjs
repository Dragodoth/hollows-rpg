import { systemPath } from "../../constants.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseItemModel from "./base.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";

/**
 * Classes provide the bulk of a hero's features and abilities.
 */
export default class WeaponModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "weapon",
      invalidActorTypes: ["entity"],
      detailsPartial: [systemPath("templates/sheets/item/partials/weapon.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("HOLLOWS_RPG.Item.weapon");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const bonus = { initial: 0, integer: true, nullable: false };

    schema.bonuses = new fields.SchemaField({
      stats: new fields.SchemaField({
        modifiedStats: new fields.SetField(setOptions()),
        statBonuses: new fields.SchemaField(
          Object.entries(hollows.CONFIG.stats).reduce((obj, [st, {label}]) => {
            obj[st] = new fields.SchemaField({
              bonus: new fields.NumberField({ ...bonus, label}),
            });
            return obj;
          }, {})
        )
      }),
      health: new fields.SchemaField({
        resolve: requiredInteger({ initial: 3 }),
        wounds: requiredInteger({ initial: 3 }),
      })
    });

    schema.resource = new fields.SchemaField({
      hasResource: new fields.BooleanField({ initial: false }),
      type: new fields.StringField({ required: true }),
      name: new fields.StringField({ required: true }),
      value: requiredInteger({ initial: 0 }),
      max: requiredInteger({ initial: 0 }),
      state: new fields.BooleanField({ initial: true }),
      tossable: new fields.BooleanField({ initial: false })
    });

    schema.actions = new hollows.data.fields.CollectionField(hollows.data.pseudoDocuments.actions.BaseAction);


    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    const stats = Object.entries(hollows.CONFIG.stats).map(([value, { label }]) => ({ value, label }));
    context.stats = stats;

    context.modifiedStatsSize = this.bonuses.stats.modifiedStats.size;
    const statBonuses = this.bonuses.stats.statBonuses;
    const statBonusesFields = this.schema.fields.bonuses.fields.stats.fields.statBonuses.fields;

    context.statBonuses = Array.from(this.bonuses.stats.modifiedStats).reduce((obj, st) => {
      obj[st] = statBonuses[st];
      obj[st].field = statBonusesFields[st].fields;
      return obj;
    }, {});

    if (this.form){
      context.form = this.form;
    }

    context.resourceType = Object.entries(hollows.CONFIG.itemResourceTypes).map(([value, { label }]) => ({ value, label }));
    console.log(context)
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    const form = this.form;
    if (form?.system.resource.modifiesResource){
      this.resource.max = form.system.resource.max;
      this.resource.tossable = form.system.resource.tossable;
    }

  }

  /* -------------------------------------------------- */

    /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
  }

  /* -------------------------------------------------- */

  /**
   * Convenient access to the weapon's form, if it exists.
   * @returns {HollowsRPGActor | null}
   */
  get form() {
    return this.actor ? this.actor.system.forms.find(f => f.system.weaponLink === this.parent.hollowsid) : null;
  }

  /* -------------------------------------------------- */

  /**
   * Convenient access to the weapon's attack, if it exists.
   * @returns {HollowsRPGActor | null}
   */
  get attack() {
    return this.parent.pseudoCollections.Action.find(a => a.type === "attack") ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    const embed = document.createElement("div");
    embed.classList.add("draw-steel", "weapon");
    if (config.includeName !== false) embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const context = {
      system: this,
      systemFields: this.schema.fields,
      config: hollows.CONFIG,
      showDescription: true, // used to prevent showing the description on the details tab of the kit sheet
    };
    context.enrichedDescription = await enrichHTML(this.description.value, { ...options, relativeTo: this.parent });
    await this.getSheetContext(context);
    const weaponBody = await foundry.applications.handlebars.renderTemplate(systemPath("templates/embeds/item/weapon.hbs"), context);
    embed.insertAdjacentHTML("beforeend", weaponBody);
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
    await super.use();
  }

  /* -------------------------------------------------- */

  /**
   * An alias of {@linkcode use}.
   */
  async roll(options = {}) {
    await super.roll();
  }

  /* -------------------------------------------------- */

  /**
   * An alias of {@linkcode use}.
   */
  async spendResource(amount = 0) {
    if (!this.resource.hasResource) return;
    if (this.resource.type === "counter") {
      if (this.resource.value === 0) {
        ui.notifications.warn("HOLLOWS_RPG.Item.weapon.Error.ResourceZero", { localize: true });
        return;
      }
      const resourceUpdate = this.resource.value - amount;
      return this.parent.update({ "system.resource.value": resourceUpdate });
    }
    if (this.resource.type === "token") {
      if (this.resource.value === 0) {
        ui.notifications.warn("HOLLOWS_RPG.Item.weapon.Error.ResourceZero", { localize: true });
        return;
      }
      const resourceUpdate = this.resource.value - amount;
      return this.parent.update({ "system.resource.value": resourceUpdate });
    }
  }

}