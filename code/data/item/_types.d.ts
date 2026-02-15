import HollowsRPGItem from "../../documents/item.mjs";

export type ItemMetaData = Readonly<SubtypeMetadata & {
  /** Actor types that this item cannot be placed on. */
  invalidActorTypes: string[];
  /** Is this item type restricted to only appearing in compendium packs? */
  packOnly: boolean;
  /** Are there any partials to fill in the Details tab of the item? */
  detailsPartial?: string[];
}>;

declare module "./base.mjs" {
  export default interface BaseItemModel {
    parent: HollowsRPGItem;
    description: {
      value: string;
      director: string;
    }
    _hollowsid: string;
  }
}