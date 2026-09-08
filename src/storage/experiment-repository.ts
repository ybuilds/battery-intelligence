import { getDatabase } from "./database";

import type {
  ExperimentSession,
  InterventionOutcomeMeasurement,
} from "../types/experiment";

export async function createExperimentSession(
  session: ExperimentSession,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    INSERT INTO experiment_sessions (
      session_id,
      trial_id,
      system,
      started_at,
      app_name,
      battery_level_at_start,
      selected_action,
      condition,
      user_decision,
      completed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    session.sessionId,
    session.trialId,
    session.system,
    session.startedAt,
    session.appName,
    session.batteryLevelAtStart,
    session.selectedAction,
    session.condition,
    session.userDecision,
    session.completedAt ?? null,
  );
}

export async function updateExperimentDecision(
  sessionId: string,
  decision: "accepted" | "rejected" | "ignored",
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE experiment_sessions
    SET user_decision = ?
    WHERE session_id = ?
    `,
    decision,
    sessionId,
  );
}

export async function completeExperimentSession(
  sessionId: string,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE experiment_sessions
    SET completed_at = ?
    WHERE session_id = ?
    `,
    new Date().toISOString(),
    sessionId,
  );
}

export async function recordOutcomeMeasurement(
  measurement: InterventionOutcomeMeasurement,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    INSERT INTO intervention_outcomes (
      session_id,
      battery_level_before,
      battery_level_after,
      energy_saving,
      ux_impact,
      user_acceptance,
      measured_duration_minutes,
      recorded_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    measurement.sessionId,
    measurement.batteryLevelBefore,
    measurement.batteryLevelAfter ?? null,
    measurement.energySaving ?? null,
    measurement.uxImpact ?? null,
    measurement.userAcceptance ?? null,
    measurement.measuredDurationMinutes ?? null,
    measurement.recordedAt,
  );
}
