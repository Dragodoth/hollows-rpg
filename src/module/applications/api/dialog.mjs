/**
 * An extension of DialogV2 that adjusts the defaults for the system.
 */
export default class HollowsDialog extends foundry.applications.api.Dialog {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["holoows-rpg"],
    position: {
      width: 400,
      height: "auto",
    },
  };
}