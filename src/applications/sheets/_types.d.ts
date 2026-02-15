import * as documents from "../../documents/_module.mjs";
import * as data from "../../data/_module.mjs";

// TODO: Remove the extends if/when Foundry updates HBSMixin to use @template

declare module "./hunter.mjs" {
  export default interface HollowsRPGHunterSheet {
    actor: documents.HollowsRPGActor & { system: data.Actor.HunterModel };
  }
}

export interface ActorSheetItemContext {
  item: documents.HollowsRPGItem;
  expanded: boolean;
  embed?: HTMLDivElement;
}

interface AdvancementModelContext {
  name: string;
  img: string;
  sort: number;
  id: string;
  canReconfigure: boolean;
  enrichedDescription: string;
}

export interface AdvancementContext {
  level: number;
  section: string;
  documents: AdvancementModelContext[];
}