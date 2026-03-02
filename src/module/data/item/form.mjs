import { systemPath } from "../../constants.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Classes provide the bulk of a hero's features and abilities.
 */
export default class FormModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "form",
      invalidActorTypes: ["entity"],
      detailsPartial: [systemPath("templates/sheets/item/partials/form.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("HOLLOWS_RPG.Item.form");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const bonus = { initial: 0, integer: true, nullable: false };

    schema.damage = new fields.SchemaField({
      resolve: requiredInteger({ initial: 0 }),
      wounds: requiredInteger({ initial: 0 }),
    })

    schema.bonuses = new fields.SchemaField({
      stats: new fields.SchemaField({
        modifiesStats:  new fields.BooleanField({ initial: false }),
        modifiedStats: new fields.SetField(setOptions()),
        statBonuses: new fields.SchemaField(
          Object.entries(hollows.CONFIG.stats).reduce((obj, [st, {label}]) => {
            obj[st] = new fields.SchemaField({
              bonus: new fields.NumberField({ ...bonus, label}),
            });
            return obj;
          }, {})
        )
      })
    });

    schema.resource = new fields.SchemaField({
      modifiesResource: new fields.BooleanField({ initial: false }),
      max: requiredInteger({ initial: 0 }),
      tossable: new fields.BooleanField({ initial: false })
    });

    schema.weaponLink = new fields.StringField({ required: true });

    schema.actions = new hollows.data.fields.CollectionField(hollows.data.pseudoDocuments.actions.BaseAction);

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    if (this.weapon) {
       context.resourceType = this.weapon.system.resource.type;
    }

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
   * Convenient access to the weapon's form, if it exists.
   * @returns {HollowsRPGActor | null}
   */
  get weapon() {
    return this.actor?.system.weapons.find(w => w.hollowsid === this.weaponLink) ?? null;
  }

  /* -------------------------------------------------- */

    /**
     * @inheritdoc
     * @param {DocumentHTMLEmbedConfig} config
     * @param {EnrichmentOptions} options
     */
    async toEmbed(config, options = {}) {
      const embed = document.createElement("div");
      embed.classList.add("hollows-rpg", "form");
      if (config.includeName !== false) embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
      const context = {
        system: this,
        systemFields: this.schema.fields,
        config: hollows.CONFIG,
        showDescription: true, // used to prevent showing the description on the details tab of the kit sheet
      };
      context.enrichedDescription = await enrichHTML(this.description.value, { ...options, relativeTo: this.parent });
      await this.getSheetContext(context);
      const weaponBody = await foundry.applications.handlebars.renderTemplate(systemPath("templates/embeds/item/form.hbs"), context);
      embed.insertAdjacentHTML("beforeend", weaponBody);
      return embed;
    }
}