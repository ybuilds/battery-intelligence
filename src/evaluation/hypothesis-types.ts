import type { BaselineSystem } from "../baselines/baseline-types";

export type ResearchHypothesis = {
  id: string;
  name: string;
  nullHypothesis: string;
  alternativeHypothesis: string;
  primaryMetric: string;
  direction: "lower" | "higher";
};

export const RESEARCH_HYPOTHESES: ResearchHypothesis[] = [
  {
    id: "H1",
    name: "Battery Efficiency",
    nullHypothesis:
      "There is no difference in measured battery drain rate between the personalized intelligence system and the baseline systems.",

    alternativeHypothesis:
      "The personalized intelligence system produces a lower measured battery drain rate than the baseline systems.",

    primaryMetric: "batteryDrainRate",

    direction: "lower",
  },

  {
    id: "H2",
    name: "Personalization Benefit",
    nullHypothesis:
      "Personalized historical behaviour information does not improve battery efficiency compared with behaviour-aware decision making without personalized history.",

    alternativeHypothesis:
      "Personalized historical behaviour information reduces measured battery drain rate compared with behaviour-aware decision making without personalized history.",

    primaryMetric: "batteryDrainRate",

    direction: "lower",
  },

  {
    id: "H3",
    name: "UX Preservation",
    nullHypothesis:
      "Personalized intervention does not reduce user-experienced UX impact compared with non-personalized intervention.",

    alternativeHypothesis:
      "Personalized intervention produces lower UX impact than non-personalized intervention.",

    primaryMetric: "uxImpact",

    direction: "lower",
  },

  {
    id: "H4",
    name: "User Acceptance",
    nullHypothesis:
      "Personalized intervention does not increase user acceptance compared with non-personalized intervention.",

    alternativeHypothesis:
      "Personalized intervention produces higher user acceptance than non-personalized intervention.",

    primaryMetric: "userAcceptance",

    direction: "higher",
  },
];

export const PERSONALIZED_SYSTEM: BaselineSystem = "personalized";

export const BEHAVIOUR_AWARE_SYSTEM: BaselineSystem = "behaviour_aware";
