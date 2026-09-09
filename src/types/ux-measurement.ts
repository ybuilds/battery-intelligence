export type UXRating = 1 | 2 | 3 | 4 | 5;

export type UXDimension =
  | "visual"
  | "audio"
  | "interaction"
  | "responsiveness"
  | "overall";

export type UXMeasurement = {
  visualImpact: UXRating;
  audioImpact: UXRating;
  interactionImpact: UXRating;
  responsivenessImpact: UXRating;
  overallImpact: UXRating;

  measuredAt: string;
};

export type UXMeasurementSummary = {
  visualImpact: number;
  audioImpact: number;
  interactionImpact: number;
  responsivenessImpact: number;
  overallImpact: number;

  compositeImpact: number;
};
