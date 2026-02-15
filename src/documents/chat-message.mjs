/**
 * A document subclass adding system-specific behavior and registered in CONFIG.ChatMessage.documentClass.
 */
export default class HollowsRPGChatMessage extends foundry.documents.ChatMessage {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("hollows.prepareChatMessageData", this);
  }
}