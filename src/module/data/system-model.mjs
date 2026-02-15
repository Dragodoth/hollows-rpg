/**
 * @import { SubtypeMetadata } from "./_types";
 */

/**
 * Subclass of TypeDataModel that adds handling for pseudo documents.
 */
export default class HollowsRPGSystemModel extends foundry.abstract.TypeDataModel {
  /**
     * Metadata for this document subtype.
     * @type {SubtypeMetadata}
     */
  static get metadata() {
    return {
      embedded: {},
    };
  }
}