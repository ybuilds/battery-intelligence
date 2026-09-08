import type { BatteryState } from "./battery";

import type { AppBehaviour } from "./behaviour";

import type { BehaviourProfile } from "./behaviour-profile";

import type { UserEnergyPreferences } from "./preferences";

import type { InterventionAction } from "./intervention";

import type { InterventionExecutionMode } from "./intervention-capability";

export type RecommendationInput = {
  battery: BatteryState;

  behaviour: AppBehaviour;

  profile?: BehaviourProfile | null;

  preferences: UserEnergyPreferences;
};

export type RecommendationCandidate = {
  action: InterventionAction;

  predictedEnergySaving: number;

  predictedUXImpact: number;

  predictedUserAcceptance: number;

  personalizedPreference: number;

  utilityScore: number;

  confidence: number;

  ranking: number;

  executionMode: InterventionExecutionMode;

  canExecuteAutomatically: boolean;
};

export type Recommendation = {
  selectedAction: InterventionAction;

  candidates: RecommendationCandidate[];

  batteryLevel: number;

  profileConfidence: number;

  explanation: string;

  generatedAt: string;
};
