import {
  ActorData,
  ChatMessageData,
  SceneData,
  TokenData,
} from "@common/documents/_types.mjs";
import Collection from "@common/utils/collection.mjs";
import {
  Actor as ActorModels,
  ChatMessage as ChatMessageModels,
} from "../data/_module.mjs";

// Collator for the types
type ActorModel = typeof ActorModels[Exclude<keyof typeof ActorModels, "BaseActorModel">];
type MessageModel = typeof ChatMessageModels[keyof typeof ChatMessageModels];

type ClientDocument = ReturnType<typeof foundry.documents.abstract.ClientDocumentMixin>;

declare module "@client/documents/_module.mjs" {
  interface BaseActor<Model extends ActorModel = ActorModel> extends ActorData, InstanceType<ClientDocument> {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
    //items: Collection<string, HollowsRPGItem>;
    //effects: Collection<string, HollowsRPGActiveEffect>;
  }

  interface BaseChatMessage<Model extends MessageModel = MessageModel> extends ChatMessageData, InstanceType<ClientDocument> {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
  }

  interface BaseToken extends TokenData, InstanceType<ClientDocument> {}

}