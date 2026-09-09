import { getDatabase } from "./database";

import type {
    ExperimentCampaign,
    PersistedTrial,
} from "../types/experiment-campaign";

import type { ExperimentalTrial } from "../types/trial";

export async function createExperimentCampaign(
  campaign: ExperimentCampaign,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    INSERT INTO experiment_campaigns (
      campaign_id,
      name,
      systems,
      total_trials,
      completed_trials,
      status,
      created_at,
      started_at,
      completed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    campaign.campaignId,
    campaign.name,
    JSON.stringify(campaign.systems),
    campaign.totalTrials,
    campaign.completedTrials,
    campaign.status,
    campaign.createdAt,
    campaign.startedAt ?? null,
    campaign.completedAt ?? null,
  );
}

export async function getExperimentCampaign(
  campaignId: string,
): Promise<ExperimentCampaign | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    campaign_id: string;
    name: string;
    systems: string;
    total_trials: number;
    completed_trials: number;
    status: ExperimentCampaign["status"];
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
  }>(
    `
      SELECT
        campaign_id,
        name,
        systems,
        total_trials,
        completed_trials,
        status,
        created_at,
        started_at,
        completed_at
      FROM experiment_campaigns
      WHERE campaign_id = ?
      `,
    campaignId,
  );

  if (!row) {
    return null;
  }

  return {
    campaignId: row.campaign_id,
    name: row.name,
    systems: JSON.parse(row.systems),
    totalTrials: row.total_trials,
    completedTrials: row.completed_trials,
    status: row.status,
    createdAt: row.created_at,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

export async function saveCampaignTrial(
  campaignId: string,
  trial: ExperimentalTrial,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    INSERT OR REPLACE INTO campaign_trials (
      trial_id,
      campaign_id,
      system,
      condition,
      app_name,
      starting_battery_level,
      target_duration_minutes,
      status,
      block,
      repetition,
      randomized_order,
      started_at,
      completed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    trial.trialId,
    campaignId,
    trial.system,
    trial.condition,
    trial.appName,
    trial.startingBatteryLevel,
    trial.targetDurationMinutes,
    trial.status,
    trial.allocation.block,
    trial.allocation.repetition,
    trial.allocation.randomizedOrder,
    trial.startedAt ?? null,
    trial.completedAt ?? null,
  );
}

export async function getCampaignTrials(
  campaignId: string,
): Promise<PersistedTrial[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    trial_id: string;
    campaign_id: string;
    system: PersistedTrial["system"];
    condition: PersistedTrial["condition"];
    app_name: string;
    starting_battery_level: number;
    target_duration_minutes: number;
    status: ExperimentalTrial["status"];
    block: number;
    repetition: number;
    randomized_order: number;
    started_at: string | null;
    completed_at: string | null;
  }>(
    `
      SELECT
        trial_id,
        campaign_id,
        system,
        condition,
        app_name,
        starting_battery_level,
        target_duration_minutes,
        status,
        block,
        repetition,
        randomized_order,
        started_at,
        completed_at
      FROM campaign_trials
      WHERE campaign_id = ?
      ORDER BY block ASC, repetition ASC
      `,
    campaignId,
  );

  return rows.map((row) => ({
    trialId: row.trial_id,
    campaignId: row.campaign_id,
    system: row.system,
    condition: row.condition,
    appName: row.app_name,
    startingBatteryLevel: row.starting_battery_level,
    targetDurationMinutes: row.target_duration_minutes,
    status: row.status,
    allocation: {
      block: row.block,
      repetition: row.repetition,
      randomizedOrder: row.randomized_order,
    },
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  }));
}

export async function updateCampaignStatus(
  campaignId: string,
  status: ExperimentCampaign["status"],
): Promise<void> {
  const db = await getDatabase();

  const now = new Date().toISOString();

  if (status === "running") {
    await db.runAsync(
      `
      UPDATE experiment_campaigns
      SET status = ?,
          started_at = COALESCE(started_at, ?)
      WHERE campaign_id = ?
      `,
      status,
      now,
      campaignId,
    );

    return;
  }

  if (status === "completed") {
    await db.runAsync(
      `
      UPDATE experiment_campaigns
      SET status = ?,
          completed_at = ?
      WHERE campaign_id = ?
      `,
      status,
      now,
      campaignId,
    );

    return;
  }

  await db.runAsync(
    `
    UPDATE experiment_campaigns
    SET status = ?
    WHERE campaign_id = ?
    `,
    status,
    campaignId,
  );
}

export async function updateCampaignProgress(
  campaignId: string,
  completedTrials: number,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE experiment_campaigns
    SET completed_trials = ?
    WHERE campaign_id = ?
    `,
    completedTrials,
    campaignId,
  );
}
