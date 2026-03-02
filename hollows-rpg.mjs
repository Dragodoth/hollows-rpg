import * as applications from "./src/module/applications/_module.mjs";
import * as canvas from "./src/module/canvas/_module.mjs";
import * as data from "./src/module/data/_module.mjs";
import * as documents from "./src/module/documents/_module.mjs";
import * as helpers from "./src/module/helpers/_module.mjs";
import * as rolls from "./src/module/rolls/_module.mjs";
import * as utils from "./src/module/utils/_module.mjs";
import * as HOLLOWS_CONFIG from "./src/module/config.mjs";
import * as HOLLOWS_CONST from "./src/module/constants.mjs";

globalThis.hollows = {
  applications,
  canvas,
  data,
  documents,
  helpers,
  rolls,
  utils,
  CONST: HOLLOWS_CONST,
  CONFIG: HOLLOWS_CONFIG,
};

/* -------------------------------------------------- */

Hooks.once("init", () => {
  CONFIG.HOLLOWS_RPG = HOLLOWS_CONFIG;
  // helpers.HollowsRPGSettingsHandler.registerSettings();

  // Assign document classes
  for (const docCls of Object.values(documents)) {
    if (!foundry.utils.isSubclass(docCls, foundry.abstract.Document)) continue;
    CONFIG[docCls.documentName].documentClass = docCls;
  }

  helpers.registerHandlebars();

  const templates = ["templates/sheets/pseudo-documents/action-sheet/partials/attack.hbs","templates/sheets/pseudo-documents/action-sheet/partials/damage.hbs"].map(t => HOLLOWS_CONST.systemPath(t));

  //Assign data models & setup templates
  for (const [doc, models] of Object.entries(data)) {
    if (!CONST.ALL_DOCUMENT_TYPES.includes(doc)) continue;
    for (const modelCls of Object.values(models)) {
      if (modelCls.metadata?.type) CONFIG[doc].dataModels[modelCls.metadata.type] = modelCls;
      if (modelCls.metadata?.icon) CONFIG[doc].typeIcons[modelCls.metadata.type] = modelCls.metadata.icon;
      if (modelCls.metadata?.detailsPartial) templates.push(...modelCls.metadata.detailsPartial);
    }
  }

  foundry.applications.handlebars.loadTemplates(templates);

  //Remove Status Effects Not Available in DrawSteel
  const toRemove = ["sleep", "bleeding", "bless", "burning", "burrow", "corrode", "curse", "degen", "disease", "fly", "blind", "frozen", "target", "eye", "deaf",  "upgrade", "fireShield", "fear", "holyShield", "hover", "coldShield", "magicShield", "paralysis", "poison", "prone", "regen", "restrain", "shock", "silence", "stun", "unconscious", "downgrade"];
  CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => !toRemove.includes(effect.id));
  // Status Effect Transfer
  for (const [type, effect] of Object.entries(HOLLOWS_CONST.healthEffects)){
    for (const [id, value] of Object.entries(effect)){
      CONFIG.statusEffects.push({ id, _id: id.padEnd(16, "0"), ...value });
    }
  }


  // Destructuring some pieces for simplification
  const { Actors, Items } = foundry.documents.collections;
  const { DocumentSheetConfig } = foundry.applications.apps;

  // Register sheet application classes
  Actors.registerSheet(HOLLOWS_CONST.systemID, applications.sheets.HollowsRPGHunterSheet, {
    types: ["hunter"],
    makeDefault: true,
    label: "HOLLOWS_RPG.SHEET.Labels.Hunter",
  });
  Actors.registerSheet(HOLLOWS_CONST.systemID, applications.sheets.HollowsRPGEntitySheet, {
    types: ["entity"],
    makeDefault: true,
    label: "HOLLOWS_RPG.SHEET.Labels.Entity",
  });

  Items.registerSheet(HOLLOWS_CONST.systemID, applications.sheets.HollowsRPGItemSheet, {
    makeDefault: true,
    label: "HOLLOWS_RPG.SHEET.Labels.Item",
  });

  CONFIG.Token.objectClass = canvas.placeables.HollowsRPGToken;

  // Register dice rolls
  CONFIG.Dice.rolls = [rolls.CoreRoll, rolls.DamageRoll];

  // Register enrichers
  //CONFIG.TextEditor.enrichers = [applications.ux.enrichers.roll, applications.ux.enrichers.applyEffect];

});

/**
 * Perform one-time pre-localization and sorting of some configuration objects.
 */
Hooks.once("i18nInit", () => {
  helpers.localization.performPreLocalization(CONFIG.HOLLOWS_RPG);

  // These fields are not auto-localized due to having a different location in en.json
  for (const model of Object.values(CONFIG.Actor.dataModels)) {
    /** @type {foundry.data.fields.SchemaField} */
    const statsSchema = model.schema.getField(["hunter", "stats"]);
    if (statsSchema) {
      for (const [st, { label}] of Object.entries(hollows.CONFIG.stats)) {
        const field = statsSchema.getField(`${st}.value`);
        if (!field) continue;
        field.label = label;
      }
    }
    const defencesSchema = model.schema.getField(["entity", "defences"]);
    if (defencesSchema) {
      for (const [def, { label}] of Object.entries(hollows.CONFIG.defences)) {
        const field = defencesSchema.getField(`${def}.value`);
        if (!field) continue;
        field.label = label;
      }
    }
  }

  for (const model of Object.values(CONFIG.Item.dataModels)) {
      const statsBonusSchema = model.schema.getField(["bonuses", "stats", "statBonuses"]);
    if (statsBonusSchema) {
      for (const [st, { label}] of Object.entries(hollows.CONFIG.stats)) {
        const field = statsBonusSchema.getField(`${st}.bonus`);
        if (!field) continue;
        field.label = label;
      }
    }
  }

  // Localize pseudo-documents. Base first, then loop through the types in use
  foundry.helpers.Localization.localizeDataModel(data.pseudoDocuments.actions.BaseAction);

  const localizePseudos = record => {
    for (const cls of Object.values(record)) {
      foundry.helpers.Localization.localizeDataModel(cls);
    }
  };

  localizePseudos(data.pseudoDocuments.actions.BaseAction.TYPES);
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  // await data.migrations.migrateWorld();
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type === "Item") {
      //helpers.macros.createDocMacro(data, slot);
      return false;
    }
  });
  Hooks.callAll("hollows.ready");
  console.log(HOLLOWS_CONST.ASCII);
});

/**
 * Render hooks.
 */
Hooks.on("renderChatMessageHTML", applications.hooks.renderChatMessageHTML);
//Hooks.on("renderCombatantConfig", applications.hooks.renderCombatantConfig);
//Hooks.on("renderTokenApplication", applications.hooks.renderTokenApplication);

/**
 * Other hooks.
 */
//Hooks.on("diceSoNiceRollStart", helpers.diceSoNiceRollStart);
//Hooks.on("hotReload", helpers.hotReload);
