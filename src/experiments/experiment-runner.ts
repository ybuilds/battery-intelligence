import { SessionObserver } from "../device/session-observer";
import { runRecommendationRuntime } from "../runtime/recommendation-runtime";
import type { AppCategory } from "../types/behaviour";
import type { Recommendation } from "../types/recommendation";
import { ExperimentController } from "./experiment-controller";

export type ExperimentRecommendationResult = {
  recommendation: Recommendation;
  experiment: ExperimentController;
};

export async function startRecommendationExperiment(
  appName: string,
  category: AppCategory,
  observer: SessionObserver,
): Promise<ExperimentRecommendationResult> {
  const runtimeResult = await runRecommendationRuntime({
    appName,
    category,
    observer,
  });

  const experiment = new ExperimentController({
    trialId: "manual-experiment",
    system: "personalized",
    appName,
    category,
    observer,
  });

  await experiment.start(runtimeResult.recommendation.selectedAction);

  return {
    recommendation: runtimeResult.recommendation,
    experiment,
  };
}
