import { getDatabase } from "./database";

import type { AppBehaviour } from "../types/behaviour";

import type {
    BehaviourProfile,
    ContextDistribution,
} from "../types/behaviour-profile";

type BehaviourObservationRow = {
  app_name: string;
  category: AppBehaviour["category"];

  session_duration_minutes: number;

  interaction_intensity: AppBehaviour["interactionIntensity"];

  screen_dependency: number;

  audio_dependency: number;

  network_dependency: number;

  preferred_brightness: number;

  usage_context: AppBehaviour["usageContext"];

  recorded_at: string;
};

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateDistribution(
  observations: BehaviourObservationRow[],
): ContextDistribution {
  const distribution: ContextDistribution = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  for (const observation of observations) {
    distribution[observation.usage_context] += 1;
  }

  const total = observations.length;

  if (total === 0) {
    return distribution;
  }

  return {
    morning: distribution.morning / total,

    afternoon: distribution.afternoon / total,

    evening: distribution.evening / total,

    night: distribution.night / total,
  };
}

function getDominantContext(
  distribution: ContextDistribution,
): BehaviourProfile["dominantContext"] {
  const contexts: BehaviourProfile["dominantContext"][] = [
    "morning",
    "afternoon",
    "evening",
    "night",
  ];

  return contexts.reduce(
    (dominant, context) =>
      distribution[context] > distribution[dominant] ? context : dominant,
    "morning",
  );
}

function getDominantInteractionIntensity(
  observations: BehaviourObservationRow[],
): BehaviourProfile["dominantInteractionIntensity"] {
  const counts = {
    low: 0,
    medium: 0,
    high: 0,
  };

  for (const observation of observations) {
    counts[observation.interaction_intensity] += 1;
  }

  if (counts.high >= counts.medium && counts.high >= counts.low) {
    return "high";
  }

  if (counts.medium >= counts.low) {
    return "medium";
  }

  return "low";
}

function calculateProfileConfidence(observationCount: number): number {
  /*
   * Confidence grows as more observations
   * become available, but approaches 1
   * asymptotically rather than reaching it
   * immediately.
   */

  return observationCount / (observationCount + 10);
}

export async function getBehaviourProfile(
  appName: string,
): Promise<BehaviourProfile | null> {
  const db = await getDatabase();

  const observations = await db.getAllAsync<BehaviourObservationRow>(
    `
      SELECT
        app_name,
        category,
        session_duration_minutes,
        interaction_intensity,
        screen_dependency,
        audio_dependency,
        network_dependency,
        preferred_brightness,
        usage_context,
        recorded_at
      FROM behaviour_observations
      WHERE app_name = ?
      ORDER BY recorded_at ASC
      `,
    appName,
  );

  if (observations.length === 0) {
    return null;
  }

  const contextDistribution = calculateDistribution(observations);

  return {
    appName,

    category: observations[0].category,

    observationCount: observations.length,

    averageSessionDurationMinutes: average(
      observations.map((observation) => observation.session_duration_minutes),
    ),

    averageScreenDependency: average(
      observations.map((observation) => observation.screen_dependency),
    ),

    averageAudioDependency: average(
      observations.map((observation) => observation.audio_dependency),
    ),

    averageNetworkDependency: average(
      observations.map((observation) => observation.network_dependency),
    ),

    averagePreferredBrightness: average(
      observations.map((observation) => observation.preferred_brightness),
    ),

    dominantInteractionIntensity: getDominantInteractionIntensity(observations),

    contextDistribution,

    dominantContext: getDominantContext(contextDistribution),

    profileConfidence: calculateProfileConfidence(observations.length),

    firstObservedAt: observations[0].recorded_at,

    lastObservedAt: observations[observations.length - 1].recorded_at,
  };
}

export async function getAllBehaviourProfiles(): Promise<BehaviourProfile[]> {
  const db = await getDatabase();

  const apps = await db.getAllAsync<{
    app_name: string;
  }>(
    `
      SELECT DISTINCT app_name
      FROM behaviour_observations
      ORDER BY app_name
      `,
  );

  const profiles: BehaviourProfile[] = [];

  for (const app of apps) {
    const profile = await getBehaviourProfile(app.app_name);

    if (profile) {
      profiles.push(profile);
    }
  }

  return profiles;
}
