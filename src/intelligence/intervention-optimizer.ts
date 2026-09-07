import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { InterventionAction } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";

import {
    LightweightOutcomePredictor,
    type PredictedOutcome,
} from "./outcome-predictor";

import { getPersonalizedPreferenceScore } from "./personalization-engine";

export type OptimizerWeights = {
  energy: number;
  ux: number;
  preference: number;
};

export type OptimizedIntervention = {
  action: InterventionAction;

  predictedEnergySaving: number;
  predictedUXImpact: number;
  predictedUserAcceptance: number;

  personalizedPreference: number;

  utilityScore: number;
  confidence: number;

  ranking: number;
};

export const defaultOptimizerWeights: OptimizerWeights = {
  energy: 0.45,
  ux: 0.3,
  preference: 0.25,
};

const ACTIONS: InterventionAction[] = [
  "reduce_brightness",
  "reduce_haptics",
  "reduce_audio",
  "limit_background_activity",
  "no_action",
];

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeWeights(weights: OptimizerWeights): OptimizerWeights {
  const total = weights.energy + weights.ux + weights.preference;

  if (total <= 0) {
    return defaultOptimizerWeights;
  }

  return {
    energy: weights.energy / total,
    ux: weights.ux / total,
    preference: weights.preference / total,
  };
}

function calculateUtility(
  outcome: PredictedOutcome,
  personalizedPreference: number,
  weights: OptimizerWeights,
): number {
  const energyScore = clamp(outcome.energySaving);

  const uxScore = clamp(1 - outcome.uxImpact);

  const predictedAcceptance = clamp(outcome.userAcceptance);

  /*
   * Combine:
   *
   * 1. predicted energy benefit
   * 2. predicted UX quality
   * 3. model-predicted acceptance
   * 4. observed personalized preference
   *
   * The observed preference acts as a
   * personalization correction rather
   * than completely replacing the model.
   */

  const modelUtility =
    energyScore * weights.energy +
    uxScore * weights.ux +
    predictedAcceptance * weights.preference;

  return clamp(modelUtility * 0.75 + personalizedPreference * 0.25);
}

export function optimizeInterventions(
  battery: BatteryState,
  behaviour: AppBehaviour,
  preferences: UserEnergyPreferences,
  predictor: LightweightOutcomePredictor,
  weights: OptimizerWeights = defaultOptimizerWeights,
): OptimizedIntervention[] {
  const normalizedWeights = normalizeWeights(weights);

  const predictedOutcomes = predictor.predictAll(
    battery,
    behaviour,
    preferences,
  );

  const evaluations = predictedOutcomes.map((outcome: PredictedOutcome) => {
    const personalizedPreference = getPersonalizedPreferenceScore(
      preferences,
      outcome.action,
    );

    const utilityScore = calculateUtility(
      outcome,
      personalizedPreference,
      normalizedWeights,
    );

    return {
      action: outcome.action,

      predictedEnergySaving: outcome.energySaving,

      predictedUXImpact: outcome.uxImpact,

      predictedUserAcceptance: outcome.userAcceptance,

      personalizedPreference,

      utilityScore,

      confidence: outcome.confidence,

      ranking: 0,
    };
  });

  evaluations.sort((first, second) => second.utilityScore - first.utilityScore);

  return evaluations.map((evaluation, index) => ({
    ...evaluation,
    ranking: index + 1,
  }));
}

export function selectOptimizedIntervention(
  battery: BatteryState,
  behaviour: AppBehaviour,
  preferences: UserEnergyPreferences,
  predictor: LightweightOutcomePredictor,
  weights: OptimizerWeights = defaultOptimizerWeights,
): OptimizedIntervention {
  const rankedInterventions = optimizeInterventions(
    battery,
    behaviour,
    preferences,
    predictor,
    weights,
  );

  return (
    rankedInterventions[0] ?? {
      action: "no_action",

      predictedEnergySaving: 0,
      predictedUXImpact: 0,
      predictedUserAcceptance: 1,

      personalizedPreference: 1,

      utilityScore: 0,
      confidence: 0,

      ranking: 1,
    }
  );
}

export function getAvailableActions(): InterventionAction[] {
  return [...ACTIONS];
}
