import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalTrial } from "./trial";

export type ExperimentCampaignStatus =
  | "planned"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export type ExperimentCampaign = {
  campaignId: string;
  name: string;

  systems: BaselineSystem[];

  totalTrials: number;
  completedTrials: number;

  status: ExperimentCampaignStatus;

  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

export type PersistedTrial = ExperimentalTrial & {
  campaignId: string;
};
