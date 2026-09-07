import type { BatteryState } from "../types/battery";

import type { AppBehaviour } from "../types/behaviour";

import type { InterventionAction } from "../types/intervention";

import type { UserEnergyPreferences } from "../types/preferences";

import type { BehaviourProfile } from "../types/behaviour-profile";

import {
  buildInterventionFeatures,
  featuresToVector,
  type InterventionFeatures,
} from "./feature-engine";

import type { OutcomeTrainingExample } from "./outcome-dataset";

export type PredictedOutcome = {
  action: InterventionAction;

  energySaving: number;

  uxImpact: number;

  userAcceptance: number;

  confidence: number;
};

type StoredOutcomeExample = {
  vector: number[];

  action: InterventionAction;

  energySaving: number;

  uxImpact: number;

  userAcceptance: number;
};

const ACTIONS: InterventionAction[] = [
  "reduce_brightness",
  "reduce_haptics",
  "reduce_audio",
  "limit_background_activity",
  "no_action",
];

function euclideanDistance(first: number[], second: number[]): number {
  let total = 0;

  const length = Math.min(first.length, second.length);

  for (let index = 0; index < length; index += 1) {
    const difference = first[index] - second[index];

    total += difference * difference;
  }

  return Math.sqrt(total);
}

function normalizeConfidence(distance: number): number {
  return 1 / (1 + distance);
}

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export class LightweightOutcomePredictor {
  private examples: StoredOutcomeExample[] = [];

  public train(dataset: OutcomeTrainingExample[]): void {
    this.examples = dataset.map((example) => ({
      vector: featuresToVector(this.createFeatures(example)),

      action: example.scenario.action,

      energySaving: example.expectedOutcome.energySaving,

      uxImpact: example.expectedOutcome.uxImpact,

      userAcceptance: example.expectedOutcome.userAcceptance,
    }));
  }

  public predict(
    features: InterventionFeatures,
    action: InterventionAction,
    neighbourCount = 5,
  ): PredictedOutcome {
    const queryVector = featuresToVector(features);

    const actionExamples = this.examples.filter(
      (example) => example.action === action,
    );

    if (actionExamples.length === 0) {
      return {
        action,

        energySaving: 0,

        uxImpact: 0,

        userAcceptance: 0.5,

        confidence: 0,
      };
    }

    const nearestExamples = actionExamples
      .map((example) => ({
        ...example,

        distance: euclideanDistance(queryVector, example.vector),
      }))
      .sort((first, second) => first.distance - second.distance)
      .slice(0, Math.max(1, neighbourCount));

    let totalWeight = 0;

    let weightedEnergy = 0;

    let weightedUX = 0;

    let weightedAcceptance = 0;

    let totalDistance = 0;

    for (const example of nearestExamples) {
      const weight = 1 / (example.distance + 0.0001);

      totalWeight += weight;

      weightedEnergy += example.energySaving * weight;

      weightedUX += example.uxImpact * weight;

      weightedAcceptance += example.userAcceptance * weight;

      totalDistance += example.distance;
    }

    const energySaving = totalWeight === 0 ? 0 : weightedEnergy / totalWeight;

    const uxImpact = totalWeight === 0 ? 0 : weightedUX / totalWeight;

    const userAcceptance =
      totalWeight === 0 ? 0.5 : weightedAcceptance / totalWeight;

    const averageDistance = totalDistance / nearestExamples.length;

    const confidence = normalizeConfidence(averageDistance);

    return {
      action,

      energySaving: clamp(energySaving),

      uxImpact: clamp(uxImpact),

      userAcceptance: clamp(userAcceptance),

      confidence: clamp(confidence),
    };
  }

  public predictAll(
    battery: BatteryState,
    behaviour: AppBehaviour,
    preferences: UserEnergyPreferences,
    profile?: BehaviourProfile | null,
    neighbourCount = 5,
  ): PredictedOutcome[] {
    const features = buildInterventionFeatures(
      battery,
      behaviour,
      preferences,
      profile,
    );

    return ACTIONS.map((action) =>
      this.predict(features, action, neighbourCount),
    );
  }

  public predictAllFromFeatures(
    features: InterventionFeatures,
    neighbourCount = 5,
  ): PredictedOutcome[] {
    return ACTIONS.map((action) =>
      this.predict(features, action, neighbourCount),
    );
  }

  public getTrainingSize(): number {
    return this.examples.length;
  }

  private createFeatures(
    example: OutcomeTrainingExample,
  ): InterventionFeatures {
    return buildInterventionFeatures(
      example.scenario.battery,
      example.scenario.behaviour,
      example.scenario.preferences,
    );
  }
}
