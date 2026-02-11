import HollowsRPGTokenDocument from "../documents/token.mjs";

declare module "@client/canvas/placeables/token.mjs" {
  export default interface Token {
    document: HollowsRPGTokenDocument;
  }
}