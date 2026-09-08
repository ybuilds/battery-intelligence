import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { BehaviourProfile } from "../types/behaviour-profile";
import type { InterventionAction } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";

export type BaselineSystem =
  | "battery_only"
  | "rule_based"
  | "behaviour_aware"
  | "personalized";

export type BaselineScenario = {
  battery: BatteryState;
  behaviour: AppBehaviour;
  preferences: UserEnergyPreferences;
  profile?: BehaviourProfile | null;
};

export type BaselineDecision = {
  system: BaselineSystem;
  selectedAction: InterventionAction;
  score: number;
  estimatedEnergySaving: number;
  estimatedUXImpact: number;
  reason: string;
};
