import type { InterventionAction } from "../types/intervention";
import type { InterventionFeatures } from "./feature-engine";

export type TrainingExample = {
  features: InterventionFeatures;
  targetAction: InterventionAction;
};
