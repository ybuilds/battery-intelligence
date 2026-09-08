import type { ExperimentCondition } from "../types/experiment";
import type { InterventionAction } from "../types/intervention";
import type { Recommendation } from "../types/recommendation";
import type { InterventionMeasurementResult } from "./experiment-controller";

export type ExperimentResult = {
  sessionId: string;
  selectedAction: InterventionAction;
  recommendation: Recommendation;
  measurement: InterventionMeasurementResult;
  condition: ExperimentCondition;
};
