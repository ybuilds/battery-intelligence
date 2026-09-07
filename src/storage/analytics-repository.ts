import { getDatabase } from "./database";

export type BehaviourObservationSummary = {
  totalObservations: number;
  uniqueApps: number;
  averageSessionDuration: number;
};

export type InterventionSummary = {
  totalInterventions: number;
  accepted: number;
  rejected: number;
};

export async function getBehaviourObservationSummary(): Promise<BehaviourObservationSummary> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{
    total_observations: number;
    unique_apps: number;
    average_session_duration: number | null;
  }>(
    `
    SELECT
      COUNT(*) AS total_observations,
      COUNT(DISTINCT app_name) AS unique_apps,
      AVG(session_duration_minutes) AS average_session_duration
    FROM behaviour_observations
    `,
  );

  return {
    totalObservations: result?.total_observations ?? 0,
    uniqueApps: result?.unique_apps ?? 0,
    averageSessionDuration: result?.average_session_duration ?? 0,
  };
}

export async function getInterventionSummary(): Promise<InterventionSummary> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{
    total_interventions: number;
    accepted: number;
    rejected: number;
  }>(
    `
    SELECT
      COUNT(*) AS total_interventions,
      SUM(
        CASE
          WHEN user_decision = 'accepted'
          THEN 1
          ELSE 0
        END
      ) AS accepted,
      SUM(
        CASE
          WHEN user_decision = 'rejected'
          THEN 1
          ELSE 0
        END
      ) AS rejected
    FROM intervention_events
    `,
  );

  return {
    totalInterventions: result?.total_interventions ?? 0,
    accepted: result?.accepted ?? 0,
    rejected: result?.rejected ?? 0,
  };
}
