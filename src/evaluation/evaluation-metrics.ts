import type { BaselineSystem } from "../baselines/baseline-types";
import type {
    EvaluationSummary,
    ScenarioEvaluation,
    SystemEvaluationMetrics,
} from "./evaluation-types";

const SYSTEMS: BaselineSystem[] = [
  "battery_only",
  "rule_based",
  "behaviour_aware",
  "personalized",
];

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function calculateSystemMetrics(
  evaluations: ScenarioEvaluation[],
  system: BaselineSystem,
): SystemEvaluationMetrics {
  const decisions = evaluations
    .map((evaluation) =>
      evaluation.decisions.find((decision) => decision.system === system),
    )
    .filter(
      (decision): decision is NonNullable<typeof decision> =>
        decision !== undefined,
    );

  const actionCounts: Record<string, number> = {};

  for (const decision of decisions) {
    actionCounts[decision.selectedAction] =
      (actionCounts[decision.selectedAction] ?? 0) + 1;
  }

  const interventionCount = decisions.filter(
    (decision) => decision.selectedAction !== "no_action",
  ).length;

  const totalEnergySaving = decisions.reduce(
    (sum, decision) => sum + decision.estimatedEnergySaving,
    0,
  );

  const totalUXImpact = decisions.reduce(
    (sum, decision) => sum + decision.estimatedUXImpact,
    0,
  );

  const totalScore = decisions.reduce(
    (sum, decision) => sum + decision.score,
    0,
  );

  const scenarioCount = evaluations.length;

  return {
    system,
    scenarioCount,
    noActionRate:
      scenarioCount === 0
        ? 0
        : round((scenarioCount - interventionCount) / scenarioCount),
    averageEnergySaving:
      scenarioCount === 0 ? 0 : round(totalEnergySaving / scenarioCount),
    averageUXImpact:
      scenarioCount === 0 ? 0 : round(totalUXImpact / scenarioCount),
    averageScore: scenarioCount === 0 ? 0 : round(totalScore / scenarioCount),
    interventionRate:
      scenarioCount === 0 ? 0 : round(interventionCount / scenarioCount),
    actionCounts,
  };
}

function calculatePersonalizationDifference(
  evaluations: ScenarioEvaluation[],
): EvaluationSummary["personalizationDifference"] {
  let energySavingDifference = 0;
  let uxImpactDifference = 0;
  let scoreDifference = 0;
  let actionChanges = 0;

  for (const evaluation of evaluations) {
    const behaviourAware = evaluation.decisions.find(
      (decision) => decision.system === "behaviour_aware",
    );

    const personalized = evaluation.decisions.find(
      (decision) => decision.system === "personalized",
    );

    if (!behaviourAware || !personalized) {
      continue;
    }

    energySavingDifference +=
      personalized.estimatedEnergySaving - behaviourAware.estimatedEnergySaving;

    uxImpactDifference +=
      personalized.estimatedUXImpact - behaviourAware.estimatedUXImpact;

    scoreDifference += personalized.score - behaviourAware.score;

    if (personalized.selectedAction !== behaviourAware.selectedAction) {
      actionChanges += 1;
    }
  }

  const count = evaluations.length;

  return {
    energySavingDifference:
      count === 0 ? 0 : round(energySavingDifference / count),
    uxImpactDifference: count === 0 ? 0 : round(uxImpactDifference / count),
    scoreDifference: count === 0 ? 0 : round(scoreDifference / count),
    actionChangeRate: count === 0 ? 0 : round(actionChanges / count),
  };
}

export function calculateEvaluationSummary(
  evaluations: ScenarioEvaluation[],
): EvaluationSummary {
  return {
    scenarioCount: evaluations.length,
    systems: SYSTEMS.map((system) =>
      calculateSystemMetrics(evaluations, system),
    ),
    personalizationDifference: calculatePersonalizationDifference(evaluations),
  };
}
