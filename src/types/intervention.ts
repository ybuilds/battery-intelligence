export type InterventionAction =
  | "reduce_brightness"
  | "reduce_haptics"
  | "reduce_audio"
  | "limit_background_activity"
  | "no_action";

export type Intervention = {
  action: InterventionAction;

  estimatedBatterySaving: number;

  estimatedUXImpact: number;

  confidence: number;

  reason: string;
};

export type UserDecision = "accepted" | "rejected" | "ignored";
