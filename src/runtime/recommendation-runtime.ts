import type { AppCategory } from "../types/behaviour";

import type { Recommendation } from "../types/recommendation";

import type { UserEnergyPreferences } from "../types/preferences";

import type { BatteryState } from "../types/battery";

import { getCurrentBatteryState } from "../device/battery-monitor";

import { SessionObserver } from "../device/session-observer";

import { collectCurrentObservation } from "../intelligence/observation-collector";

import { getBehaviourProfile } from "../storage/behaviour-profile-repository";

import { loadPreferences } from "../storage/preference-repository";

import { generateRecommendation } from "../intelligence/recommendation-engine";

import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

import { generateOutcomeDataset } from "../intelligence/outcome-dataset";

export type RecommendationRuntimeInput = {
  appName: string;
  category: AppCategory;
  observer: SessionObserver;
};

export type RecommendationRuntimeResult = {
  battery: BatteryState;
  recommendation: Recommendation;
  preferences: UserEnergyPreferences;
};

let predictor: LightweightOutcomePredictor | null = null;

function getPredictor(): LightweightOutcomePredictor {
  if (predictor) {
    return predictor;
  }

  /*
   * Synthetic data is used only to validate
   * the runtime/model pipeline.
   *
   * It is not experimental ground truth.
   */
  const dataset = generateOutcomeDataset(2000);

  predictor = new LightweightOutcomePredictor();

  predictor.train(dataset);

  return predictor;
}

export async function runRecommendationRuntime(
  input: RecommendationRuntimeInput,
): Promise<RecommendationRuntimeResult> {
  const model = getPredictor();

  const preferences = await loadPreferences();

  const observation = await collectCurrentObservation(
    input.appName,
    input.category,
    input.observer,
  );

  const profile = await getBehaviourProfile(input.appName);

  const recommendation = generateRecommendation(
    observation.battery,
    observation.behaviour,
    preferences,
    model,
    profile,
  );

  return {
    battery: observation.battery,

    recommendation,

    preferences,
  };
}

export async function getRuntimeBatteryState(): Promise<BatteryState> {
  return getCurrentBatteryState();
}

export function resetRuntimeModel(): void {
  predictor = null;
}
