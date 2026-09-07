import { generateOutcomeDataset } from "./outcome-dataset";

import { LightweightOutcomePredictor } from "./outcome-predictor";

import {
  optimizeInterventions,
  selectOptimizedIntervention,
} from "./intervention-optimizer";

import { defaultPreferences } from "../data/default-preferences";
import { sampleBattery } from "../data/sample-battery";
import { sampleBehaviour } from "../data/sample-behaviour";

export function testInterventionOptimizer() {
  const dataset = generateOutcomeDataset(2000);

  const predictor = new LightweightOutcomePredictor();

  predictor.train(dataset);

  console.log("Outcome predictor training size:", predictor.getTrainingSize());

  const rankedInterventions = optimizeInterventions(
    sampleBattery,
    sampleBehaviour,
    defaultPreferences,
    predictor,
  );

  console.log("Ranked intervention candidates:");

  for (const intervention of rankedInterventions) {
    console.log({
      ranking: intervention.ranking,

      action: intervention.action,

      predictedEnergySaving: intervention.predictedEnergySaving,

      predictedUXImpact: intervention.predictedUXImpact,

      predictedUserAcceptance: intervention.predictedUserAcceptance,

      personalizedPreference: intervention.personalizedPreference,

      utilityScore: intervention.utilityScore,

      confidence: intervention.confidence,
    });
  }

  const selected = selectOptimizedIntervention(
    sampleBattery,
    sampleBehaviour,
    defaultPreferences,
    predictor,
  );

  console.log("Optimized intervention:");

  console.log({
    action: selected.action,

    predictedEnergySaving: selected.predictedEnergySaving,

    predictedUXImpact: selected.predictedUXImpact,

    predictedUserAcceptance: selected.predictedUserAcceptance,

    personalizedPreference: selected.personalizedPreference,

    utilityScore: selected.utilityScore,

    confidence: selected.confidence,
  });
}
