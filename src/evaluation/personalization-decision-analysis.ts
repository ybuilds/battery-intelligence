import type { BaselineDecision } from "../baselines/baseline-types";
import type { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";
import type { BehaviourProfile } from "../types/behaviour-profile";
import type { UserEnergyPreferences } from "../types/preferences";
import type { EvaluationScenario } from "./evaluation-types";

import { executePolicy } from "../experiments/policy-executor";

export type PersonalizationDecisionCase = {
  name: string;
  profile: BehaviourProfile | null;
  preferences: UserEnergyPreferences;
};

export type PersonalizationDecisionResult = {
  caseName: string;

  behaviourAwareAction: BaselineDecision["selectedAction"];
  personalizedAction: BaselineDecision["selectedAction"];

  behaviourAwareScore: number;
  personalizedScore: number;

  scoreDifference: number;

  actionChanged: boolean;

  behaviourAwareEnergySaving: number;
  personalizedEnergySaving: number;

  energySavingDifference: number;

  behaviourAwareUXImpact: number;
  personalizedUXImpact: number;

  uxImpactDifference: number;
};

export type PersonalizationDecisionAnalysis = {
  results: PersonalizationDecisionResult[];

  totalCases: number;

  changedDecisionCount: number;

  decisionChangeRate: number;

  averageScoreDifference: number;

  averageEnergySavingDifference: number;

  averageUXImpactDifference: number;
};

function createNeutralPreferences(): UserEnergyPreferences {
  return {
    reduce_brightness: {
      accepted: 0,
      rejected: 0,
    },

    reduce_haptics: {
      accepted: 0,
      rejected: 0,
    },

    reduce_audio: {
      accepted: 0,
      rejected: 0,
    },

    limit_background_activity: {
      accepted: 0,
      rejected: 0,
    },
  };
}

function createPreferenceProfile(
  preferredAction:
    | "reduce_brightness"
    | "reduce_haptics"
    | "reduce_audio"
    | "limit_background_activity",
): UserEnergyPreferences {
  const preferences = createNeutralPreferences();

  preferences[preferredAction] = {
    accepted: 20,
    rejected: 0,
  };

  return preferences;
}

function createSyntheticProfile(
  observationCount: number,
  overrides?: Partial<BehaviourProfile>,
): BehaviourProfile {
  const confidence = observationCount / (observationCount + 10);

  return {
    appName: "Instagram",

    category: "social",

    observationCount,

    averageSessionDurationMinutes: 28,

    averageScreenDependency: 0.95,

    averageAudioDependency: 0.15,

    averageNetworkDependency: 0.9,

    averagePreferredBrightness: 0.35,

    dominantInteractionIntensity: "high",

    contextDistribution: {
      morning: 0.05,
      afternoon: 0.15,
      evening: 0.6,
      night: 0.2,
    },

    dominantContext: "evening",

    profileConfidence: confidence,

    firstObservedAt: new Date(Date.now() - 30 * 86400000).toISOString(),

    lastObservedAt: new Date().toISOString(),

    ...overrides,
  };
}

function createBaseScenario(
  profile: BehaviourProfile | null,
  preferences: UserEnergyPreferences,
): EvaluationScenario {
  return {
    scenarioId: "personalization-decision-analysis",

    description: "Controlled B3 versus B4 personalization analysis.",

    battery: {
      level: 25,
      isCharging: false,
      lowPowerMode: false,
      estimatedMinutesRemaining: 75,
    },

    behaviour: {
      appName: "Instagram",

      category: "social",

      sessionDurationMinutes: 18,

      interactionIntensity: "high",

      screenDependency: 0.8,

      audioDependency: 0.2,

      networkDependency: 0.85,

      typicalSessionDurationMinutes: 22,

      preferredBrightness: 0.7,

      usageContext: "evening",
    },

    preferences,

    profile,
  };
}

function getCandidateScore(decision: BaselineDecision): number {
  return decision.score;
}

function findPersonalizedDecision(
  predictor: LightweightOutcomePredictor,
  scenario: EvaluationScenario,
): BaselineDecision {
  return executePolicy("personalized", scenario, predictor);
}

function findBehaviourAwareDecision(
  predictor: LightweightOutcomePredictor,
  scenario: EvaluationScenario,
): BaselineDecision {
  return executePolicy("behaviour_aware", scenario, predictor);
}

export function runPersonalizationDecisionAnalysis(
  predictor: LightweightOutcomePredictor,
): PersonalizationDecisionAnalysis {
  const cases: PersonalizationDecisionCase[] = [
    {
      name: "No historical profile",
      profile: null,
      preferences: createNeutralPreferences(),
    },

    {
      name: "Weak profile",
      profile: createSyntheticProfile(1),
      preferences: createNeutralPreferences(),
    },

    {
      name: "Moderate profile",
      profile: createSyntheticProfile(10),
      preferences: createNeutralPreferences(),
    },

    {
      name: "Strong profile",
      profile: createSyntheticProfile(50),
      preferences: createNeutralPreferences(),
    },

    {
      name: "Strong brightness preference",
      profile: createSyntheticProfile(50),
      preferences: createPreferenceProfile("reduce_brightness"),
    },

    {
      name: "Strong haptic preference",
      profile: createSyntheticProfile(50, {
        averageScreenDependency: 0.45,
        averageAudioDependency: 0.3,
      }),
      preferences: createPreferenceProfile("reduce_haptics"),
    },

    {
      name: "Strong audio preference",
      profile: createSyntheticProfile(50, {
        averageAudioDependency: 0.9,
        averageScreenDependency: 0.65,
      }),
      preferences: createPreferenceProfile("reduce_audio"),
    },
  ];

  const results = cases.map((testCase) => {
    /*
     * B3 intentionally receives the same current
     * behaviour but does not use personalized
     * historical information.
     */
    const behaviourAwareScenario = createBaseScenario(
      null,
      createNeutralPreferences(),
    );

    /*
     * B4 receives the historical profile and
     * preference information.
     */
    const personalizedScenario = createBaseScenario(
      testCase.profile,
      testCase.preferences,
    );

    const behaviourAware = findBehaviourAwareDecision(
      predictor,
      behaviourAwareScenario,
    );

    const personalized = findPersonalizedDecision(
      predictor,
      personalizedScenario,
    );

    return {
      caseName: testCase.name,

      behaviourAwareAction: behaviourAware.selectedAction,

      personalizedAction: personalized.selectedAction,

      behaviourAwareScore: getCandidateScore(behaviourAware),

      personalizedScore: getCandidateScore(personalized),

      scoreDifference: personalized.score - behaviourAware.score,

      actionChanged:
        personalized.selectedAction !== behaviourAware.selectedAction,

      behaviourAwareEnergySaving: behaviourAware.estimatedEnergySaving,

      personalizedEnergySaving: personalized.estimatedEnergySaving,

      energySavingDifference:
        personalized.estimatedEnergySaving -
        behaviourAware.estimatedEnergySaving,

      behaviourAwareUXImpact: behaviourAware.estimatedUXImpact,

      personalizedUXImpact: personalized.estimatedUXImpact,

      uxImpactDifference:
        personalized.estimatedUXImpact - behaviourAware.estimatedUXImpact,
    };
  });

  const totalCases = results.length;

  const changedDecisionCount = results.filter(
    (result) => result.actionChanged,
  ).length;

  const decisionChangeRate =
    totalCases > 0 ? changedDecisionCount / totalCases : 0;

  const averageScoreDifference =
    totalCases > 0
      ? results.reduce((sum, result) => sum + result.scoreDifference, 0) /
        totalCases
      : 0;

  const averageEnergySavingDifference =
    totalCases > 0
      ? results.reduce(
          (sum, result) => sum + result.energySavingDifference,
          0,
        ) / totalCases
      : 0;

  const averageUXImpactDifference =
    totalCases > 0
      ? results.reduce((sum, result) => sum + result.uxImpactDifference, 0) /
        totalCases
      : 0;

  return {
    results,

    totalCases,

    changedDecisionCount,

    decisionChangeRate,

    averageScoreDifference,

    averageEnergySavingDifference,

    averageUXImpactDifference,
  };
}

export function printPersonalizationDecisionAnalysis(
  analysis: PersonalizationDecisionAnalysis,
): void {
  console.log("=== Personalization Decision Analysis ===");

  for (const result of analysis.results) {
    console.log({
      case: result.caseName,

      B3Action: result.behaviourAwareAction,

      B4Action: result.personalizedAction,

      actionChanged: result.actionChanged,

      B3Score: Number(result.behaviourAwareScore.toFixed(4)),

      B4Score: Number(result.personalizedScore.toFixed(4)),

      scoreDifference: Number(result.scoreDifference.toFixed(4)),

      B3EnergySaving: Number(result.behaviourAwareEnergySaving.toFixed(4)),

      B4EnergySaving: Number(result.personalizedEnergySaving.toFixed(4)),

      B3UXImpact: Number(result.behaviourAwareUXImpact.toFixed(4)),

      B4UXImpact: Number(result.personalizedUXImpact.toFixed(4)),
    });
  }

  console.log("Total cases:", analysis.totalCases);

  console.log("Changed decisions:", analysis.changedDecisionCount);

  console.log(
    "Decision change rate:",
    (analysis.decisionChangeRate * 100).toFixed(1) + "%",
  );

  console.log(
    "Average score difference:",
    analysis.averageScoreDifference.toFixed(4),
  );

  console.log(
    "Average energy-saving difference:",
    analysis.averageEnergySavingDifference.toFixed(4),
  );

  console.log(
    "Average UX-impact difference:",
    analysis.averageUXImpactDifference.toFixed(4),
  );
}
