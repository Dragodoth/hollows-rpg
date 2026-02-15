import HollowsRPGActor from "../../documents/actor.mjs";

interface BarAttribute {
  value: number,
  max: number
}

interface Biography {
  value: string;
  director: string;
}


declare module "./base.mjs" {
  export default interface BaseActorModel {
    parent: HollowsRPGActor;
    stamina: BarAttribute & {
      temporary: number;
      winded: number;
      bonuses: {
        echelon: number;
        level: number;
      }
    },

    biography: Biography;
  }
}

declare module "./hunter.mjs" {
  export default interface HunterModel {
    characteristics: Record<string, { value: number }>;
  }
}