import { defaultPreferences } from "../data/default-preferences";
import { sampleBattery } from "../data/sample-battery";
import { sampleBehaviour } from "../data/sample-behaviour";

import { evaluateCandidateActions, selectBestAction } from "./decision-model";

export function testDecisionModel() {
  const candidates = evaluateCandidateActions(
    sampleBattery,
    sampleBehaviour,
    defaultPreferences,
  );

  console.log("Candidate evaluations:");

  for (const candidate of candidates) {
    console.log({
      action: candidate.action,
      energyBenefit: candidate.energyBenefit,
      uxQuality: candidate.uxQuality,
      preferenceFit: candidate.preferenceFit,
      overallScore: candidate.overallScore,
    });
  }

  const bestAction = selectBestAction(
    sampleBattery,
    sampleBehaviour,
    defaultPreferences,
  );

  console.log("Selected action:", bestAction.action);

  console.log("Selected action score:", bestAction.overallScore);
}
