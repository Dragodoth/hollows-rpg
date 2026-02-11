import HollowsRPGChatMessage from "../../documents/chat-message.mjs";

declare module "./base.mjs" {
  export default interface BaseMessageModel {
    parent: HollowsRPGChatMessage;
    /** A set of HollowsRPGTokenDocument UUIDs. */
    targets: Set<string>;
  }
}
