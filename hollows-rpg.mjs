import * as applications from "./code/applications/_module.mjs";
import * as canvas from "./code/canvas/_module.mjs";
import * as config from "./code/config.mjs";
import * as data from "./code/data/_module.mjs";
import * as documents from "./code/documents/_module.mjs";
import * as helpers from "./code/helpers/_module.mjs";
import * as rolls from "./code/rolls/_module.mjs";
import * as utils from "./code/utils/_module.mjs";
import * as HOLLOWS_CONFIG from "./code/config.mjs";
import * as HOLLOWS_CONST from "./code/constants.mjs";

globalThis.hollows = {
  applications,
  canvas,
  config,
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
    console.log(docCls)
  }

  helpers.registerHandlebars();

  //Assign data models & setup templates
  for (const [doc, models] of Object.entries(data)) {
    if (!CONST.ALL_DOCUMENT_TYPES.includes(doc)) continue;
    for (const modelCls of Object.values(models)) {
      if (modelCls.metadata?.type) CONFIG[doc].dataModels[modelCls.metadata.type] = modelCls;
      if (modelCls.metadata?.icon) CONFIG[doc].typeIcons[modelCls.metadata.type] = modelCls.metadata.icon;
      if (modelCls.metadata?.detailsPartial) templates.push(...modelCls.metadata.detailsPartial);
      console.log(doc, modelCls)
    }
  }

  // Status Effect Transfer
  for (const [id, value] of Object.entries(HOLLOWS_CONST.healthEffects)) {
    CONFIG.statusEffects.push({ id, _id: id.padEnd(16, "0"), ...value });
  }

  // Destructuring some pieces for simplification
  const { Actors, Items } = foundry.documents.collections;
  const { DocumentSheetConfig } = foundry.applications.apps;

  // Register sheet application classes
  Actors.registerSheet(HOLLOWS_CONST.systemID, applications.sheets.HollowsRPGHunterSheet, {
    types: ["hunter"],
    makeDefault: true,
    label: "HOLLOWS_RPG.Sheet.Labels.Character",
  });

  CONFIG.Token.objectClass = canvas.placeables.HollowsRPGToken;

  // Register dice rolls
  CONFIG.Dice.rolls = [rolls.CoreRoll];

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
      for (const [stat, { label}] of Object.entries(hollows.CONFIG.stats)) {
        const field = statsSchema.getField(`${stat}.value`);
        if (!field) continue;
        field.label = label;
      }
    }
  }
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  // await data.migrations.migrateWorld();
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type === "Item") {
      helpers.macros.createDocMacro(data, slot);
      return false;
    }
  });
  Hooks.callAll("hollows.ready");
  console.log(HOLLOWS_CONST.ASCII);
});

/**
 * Render hooks.
 */
//Hooks.on("renderChatMessageHTML", applications.hooks.renderChatMessageHTML);
//Hooks.on("renderCombatantConfig", applications.hooks.renderCombatantConfig);
//Hooks.on("renderTokenApplication", applications.hooks.renderTokenApplication);

/**
 * Other hooks.
 */
//Hooks.on("diceSoNiceRollStart", helpers.diceSoNiceRollStart);
//Hooks.on("hotReload", helpers.hotReload);
