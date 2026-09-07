import type { InterventionAction } from "../types/intervention";

import type { OutcomeTrainingExample } from "./outcome-dataset";

import {
  buildInterventionFeatures,
  featuresToVector,
  type InterventionFeatures,
} from "./feature-engine";

export type Prediction = {
  action: InterventionAction;
  confidence: number;
};

type StoredExample = {
  vector: number[];
  action: InterventionAction;
};

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

export class LightweightInterventionModel {
  private examples: StoredExample[] = [];

  public train(dataset: OutcomeTrainingExample[]): void {
    this.examples = dataset.map((example) => ({
      vector: featuresToVector(this.createFeatures(example)),

      action: example.scenario.action,
    }));
  }

  public predict(features: InterventionFeatures): Prediction {
    const queryVector = featuresToVector(features);

    if (this.examples.length === 0) {
      return {
        action: "no_action",
        confidence: 0,
      };
    }

    let bestExample: StoredExample | null = null;

    let bestDistance = Number.POSITIVE_INFINITY;

    for (const example of this.examples) {
      const distance = euclideanDistance(queryVector, example.vector);

      if (distance < bestDistance) {
        bestDistance = distance;

        bestExample = example;
      }
    }

    if (!bestExample) {
      return {
        action: "no_action",
        confidence: 0,
      };
    }

    return {
      action: bestExample.action,

      confidence: normalizeConfidence(bestDistance),
    };
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
