import type {
    UXMeasurement,
    UXMeasurementSummary,
    UXRating,
} from "../types/ux-measurement";

function clampRating(value: number): UXRating {
  const rounded = Math.round(value);

  if (rounded <= 1) {
    return 1;
  }

  if (rounded >= 5) {
    return 5;
  }

  return rounded as UXRating;
}

export function calculateUXComposite(measurement: UXMeasurement): number {
  const values = [
    measurement.visualImpact,
    measurement.audioImpact,
    measurement.interactionImpact,
    measurement.responsivenessImpact,
    measurement.overallImpact,
  ];

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function summarizeUXMeasurement(
  measurement: UXMeasurement,
): UXMeasurementSummary {
  return {
    visualImpact: measurement.visualImpact,

    audioImpact: measurement.audioImpact,

    interactionImpact: measurement.interactionImpact,

    responsivenessImpact: measurement.responsivenessImpact,

    overallImpact: measurement.overallImpact,

    compositeImpact: calculateUXComposite(measurement),
  };
}

export function createUXMeasurement(
  input: Omit<UXMeasurement, "measuredAt">,
): UXMeasurement {
  return {
    visualImpact: clampRating(input.visualImpact),

    audioImpact: clampRating(input.audioImpact),

    interactionImpact: clampRating(input.interactionImpact),

    responsivenessImpact: clampRating(input.responsivenessImpact),

    overallImpact: clampRating(input.overallImpact),

    measuredAt: new Date().toISOString(),
  };
}
