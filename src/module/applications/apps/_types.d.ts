export interface CoreRollDialogPrompt {
  stat: string,
  advantageMode: string,
  targetNumber: number,
  useTargetNumber: boolean,
  rollMode: keyof typeof CONFIG["Dice"]["rollModes"];
  damage?: string;
}