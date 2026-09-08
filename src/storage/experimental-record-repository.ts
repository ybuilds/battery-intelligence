import { getDatabase } from "./database";

import type { ExperimentalRecord } from "../evaluation/experimental-record";

export async function saveExperimentalRecord(
  record: ExperimentalRecord,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    INSERT INTO experimental_records (
      trial_id,
      system,
      condition,
      app_name,
      block,
      repetition,
      battery_before,
      battery_after,
      duration_minutes,
      battery_delta,
      battery_drain_rate,
      ux_impact,
      user_acceptance,
      recorded_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    record.trialId,
    record.system,
    record.condition,
    record.appName,
    record.block,
    record.repetition,
    record.batteryBefore,
    record.batteryAfter,
    record.durationMinutes,
    record.batteryDelta,
    record.batteryDrainRate,
    record.uxImpact ?? null,
    record.userAcceptance ?? null,
    record.recordedAt,
  );
}

export async function getExperimentalRecords(): Promise<ExperimentalRecord[]> {
  const db = await getDatabase();

  return db.getAllAsync<ExperimentalRecord>(
    `
    SELECT
      trial_id AS trialId,
      system,
      block,
      repetition,
      condition,
      app_name AS appName,
      battery_before AS batteryBefore,
      battery_after AS batteryAfter,
      duration_minutes AS durationMinutes,
      battery_delta AS batteryDelta,
      battery_drain_rate AS batteryDrainRate,
      ux_impact AS uxImpact,
      user_acceptance AS userAcceptance,
      recorded_at AS recordedAt
    FROM experimental_records
    ORDER BY recorded_at ASC
    `,
  );
}
