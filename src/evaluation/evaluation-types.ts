import type {
    BaselineDecision,
    BaselineScenario,
} from "../baselines/baseline-types";

export type EvaluationScenario = BaselineScenario & {
  scenarioId: string;
  description: string;
};

export type ScenarioEvaluation = {
  scenario: EvaluationScenario;
  decisions: BaselineDecision[];
};

export type SystemEvaluationMetrics = {
  system: BaselineDecision["system"];
  scenarioCount: number;
  noActionRate: number;
  averageEnergySaving: number;
  averageUXImpact: number;
  averageScore: number;
  interventionRate: number;
  actionCounts: Record<string, number>;
};

export type EvaluationSummary = {
  scenarioCount: number;
  systems: SystemEvaluationMetrics[];
  personalizationDifference: {
    energySavingDifference: number;
    uxImpactDifference: number;
    scoreDifference: number;
    actionChangeRate: number;
  };
};
