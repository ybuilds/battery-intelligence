import { runPersonalizationSensitivityAnalysis } from "./personalization-sensitivity";

const analysis = runPersonalizationSensitivityAnalysis();

console.log("Personalization sensitivity test");

for (const point of analysis.points) {
  console.log(
    `Observations: ${point.observationCount}`,
    `| Confidence: ${(point.profileConfidence * 100).toFixed(1)}%`,
    `| General: ${(point.generalModelWeight * 100).toFixed(1)}%`,
    `| Personalized: ${(point.personalizedModelWeight * 100).toFixed(1)}%`,
    `| Blended value: ${point.blendedValue.toFixed(3)}`,
  );
}

console.log(
  "Personalization weight is monotonic:",
  analysis.monotonicConfidence,
);

console.log(
  "Initial personalized weight:",
  (analysis.initialPersonalizedWeight * 100).toFixed(1),
  "%",
);

console.log(
  "Final personalized weight:",
  (analysis.finalPersonalizedWeight * 100).toFixed(1),
  "%",
);
