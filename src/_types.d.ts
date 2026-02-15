import "./applications/_types";
import "./canvas/_types";
import "./data/_types";
import "./documents/_types";
import {
  HollowsRPGActor,
  HollowsRPGChatMessage,
} from "./documents/_module.mjs";

import {
  CoreRoll,
} from "./rolls/_module.mjs";


export interface CoreRollTarget {
  uuid: string;
}

export interface RollPromptOptions {
  evaluation: "none" | "evaluate" | "message";
  formula: string;
  actor: HollowsRPGActor;
  data: Record <string, unknown>;
}

export interface CoreRollPromptOptions extends RollPromptOptions {
  type: "ability" | "test";
  advantageMode: "normal" | "advantage" | "disadvantage";
  stat: string;
  targetNumber: number;
  useTargetNumber: boolean;
  target: CoreRollTargets[],
}

export interface CoreRollPrompt {
  rollMode: keyof typeof CONFIG["Dice"]["rollModes"];
  coreRolls: Array <CoreRoll | HollowsRPGChatMessage | object>;
}
