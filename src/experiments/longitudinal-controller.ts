import type { ExperimentalRecord } from "../evaluation/experimental-record";
import type { AppCategory } from "../types/behaviour";
import type { ExperimentalTrial } from "../types/trial";

import type { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

import { TrialDeviceController } from "./trial-device-controller";

import { buildExperimentalRecordFromMeasurement } from "../evaluation/experimental-record-builder";

import type {
  LongitudinalExperimentPlan,
  LongitudinalTrialPair,
} from "./longitudinal-experiment";

import type { InterventionMeasurementResult } from "./experiment-controller";

import {
  createExperimentCampaign,
  getCampaignTrials,
  getExperimentCampaign,
  saveCampaignTrial,
  updateCampaignProgress,
  updateCampaignStatus,
} from "../storage/experiment-campaign-repository";

import type {
  ExperimentCampaign,
  PersistedTrial,
} from "../types/experiment-campaign";

import type { UXMeasurement } from "../types/ux-measurement";

export type LongitudinalControllerState =
  | "idle"
  | "ready"
  | "running"
  | "completed"
  | "finished";

export type LongitudinalControllerSnapshot = {
  state: LongitudinalControllerState;

  experimentId: string;

  campaignId: string;

  currentPairIndex: number;

  totalPairs: number;

  completedPairs: number;

  currentPair?: LongitudinalTrialPair;

  currentTrial?: ExperimentalTrial;

  completedRecords: ExperimentalRecord[];
};

export class LongitudinalExperimentController {
  private readonly plan: LongitudinalExperimentPlan;

  private readonly predictor: LightweightOutcomePredictor;

  private readonly categoryByApp: Map<string, AppCategory>;

  private state: LongitudinalControllerState = "idle";

  private currentPairIndex = 0;

  private currentTrial: ExperimentalTrial | undefined;

  private currentPair: LongitudinalTrialPair | undefined;

  private currentDeviceController: TrialDeviceController | undefined;

  private completedRecords: ExperimentalRecord[] = [];

  private completedPairKeys = new Set<string>();

  private persistedTrials: PersistedTrial[] | undefined;

  private constructor(
    plan: LongitudinalExperimentPlan,
    predictor: LightweightOutcomePredictor,
  ) {
    this.plan = plan;
    this.predictor = predictor;

    this.categoryByApp = new Map(
      plan.config.appNames.map((app) => [app.appName, app.category]),
    );
  }

  public recordUXMeasurement(measurement: UXMeasurement): void {
    if (!this.currentDeviceController) {
      throw new Error("No trial is currently running.");
    }

    this.currentDeviceController.recordUXMeasurement(measurement);
  }

  /**
   * Creates a new persistent campaign.
   *
   * The entire experimental plan is written
   * to SQLite before the controller becomes ready.
   */
  public static async create(
    plan: LongitudinalExperimentPlan,
    predictor: LightweightOutcomePredictor,
  ): Promise<LongitudinalExperimentController> {
    const controller = new LongitudinalExperimentController(plan, predictor);

    await controller.initializeNewCampaign();

    return controller;
  }

  /**
   * Resumes an existing campaign from SQLite.
   */
  public static async resume(
    plan: LongitudinalExperimentPlan,
    predictor: LightweightOutcomePredictor,
  ): Promise<LongitudinalExperimentController> {
    const controller = new LongitudinalExperimentController(plan, predictor);

    await controller.restoreCampaignState();

    return controller;
  }

  public getSnapshot(): LongitudinalControllerSnapshot {
    return {
      state: this.state,

      experimentId: this.plan.experimentId,

      campaignId: this.plan.experimentId,

      currentPairIndex: this.currentPairIndex,

      totalPairs: this.plan.totalMatchedPairs,

      completedPairs: this.completedPairKeys.size,

      currentPair: this.currentPair,

      currentTrial: this.currentTrial,

      completedRecords: [...this.completedRecords],
    };
  }

  public getPlan(): LongitudinalExperimentPlan {
    return this.plan;
  }

  public getCurrentPair(): LongitudinalTrialPair | undefined {
    return this.currentPair;
  }

  public getCurrentTrial(): ExperimentalTrial | undefined {
    return this.currentTrial;
  }

  public getCompletedRecords(): ExperimentalRecord[] {
    return [...this.completedRecords];
  }

  public hasFinished(): boolean {
    return this.completedPairKeys.size >= this.plan.totalMatchedPairs;
  }

  /**
   * Finds the next incomplete trial in the
   * randomized matched-pair sequence.
   */
  public prepareNextTrial(): ExperimentalTrial | undefined {
    if (this.hasFinished()) {
      this.state = "finished";

      this.currentPair = undefined;

      this.currentTrial = undefined;

      return undefined;
    }

    if (this.currentDeviceController) {
      throw new Error(
        "A trial is currently active. Complete the current trial before preparing another one.",
      );
    }

    for (
      let index = this.currentPairIndex;
      index < this.plan.pairs.length;
      index += 1
    ) {
      const pair = this.plan.pairs[index];

      const pairKey = this.createPairKey(pair);

      if (this.completedPairKeys.has(pairKey)) {
        continue;
      }

      const nextTrial = this.findNextTrialForPair(pair);

      if (!nextTrial) {
        continue;
      }

      this.currentPairIndex = index;

      this.currentPair = pair;

      this.currentTrial = nextTrial;

      this.state = "ready";

      return nextTrial;
    }

    this.state = "finished";

    return undefined;
  }

  /**
   * Starts the currently prepared trial.
   */
  public async startCurrentTrial(): Promise<void> {
    if (!this.currentTrial) {
      throw new Error("No trial is prepared. Call prepareNextTrial() first.");
    }

    if (this.currentDeviceController) {
      throw new Error("A trial is already running.");
    }

    const category = this.categoryByApp.get(this.currentTrial.appName);

    if (!category) {
      throw new Error(
        `No application category is configured for ${this.currentTrial.appName}.`,
      );
    }

    const controller = new TrialDeviceController(this.currentTrial, category);

    await controller.start(this.predictor);

    this.currentDeviceController = controller;

    this.state = "running";

    this.currentTrial = {
      ...this.currentTrial,
      status: "running",
      startedAt: new Date().toISOString(),
    };

    await saveCampaignTrial(this.plan.experimentId, this.currentTrial);

    await updateCampaignStatus(this.plan.experimentId, "running");
  }

  public getActiveDeviceController(): TrialDeviceController | undefined {
    return this.currentDeviceController;
  }

  public async recordDecision(
    decision: "accepted" | "rejected" | "ignored",
  ): Promise<void> {
    if (!this.currentDeviceController) {
      throw new Error("No trial is currently running.");
    }

    await this.currentDeviceController.recordDecision(decision);
  }

  public recordInteraction(): void {
    if (!this.currentDeviceController) {
      throw new Error("No trial is currently running.");
    }

    this.currentDeviceController.recordInteraction();
  }

  public recordAudioUsage(): void {
    if (!this.currentDeviceController) {
      throw new Error("No trial is currently running.");
    }

    this.currentDeviceController.recordAudioUsage();
  }

  public recordNetworkUsage(): void {
    if (!this.currentDeviceController) {
      throw new Error("No trial is currently running.");
    }

    this.currentDeviceController.recordNetworkUsage();
  }

  public recordHapticUsage(): void {
    if (!this.currentDeviceController) {
      throw new Error("No trial is currently running.");
    }

    this.currentDeviceController.recordHapticUsage();
  }

  /**
   * Completes the current device trial,
   * persists the result and updates campaign
   * progress.
   */
  public async completeCurrentTrial(): Promise<ExperimentalRecord> {
    if (!this.currentDeviceController) {
      throw new Error("No trial is currently running.");
    }

    if (!this.currentTrial) {
      throw new Error("No current trial is available.");
    }

    const trial = this.currentTrial;

    const measurement: InterventionMeasurementResult =
      await this.currentDeviceController.complete();

    const record = buildExperimentalRecordFromMeasurement(trial, measurement);

    this.completedRecords.push(record);

    const completedTrial: ExperimentalTrial = {
      ...trial,
      status: "completed",
      completedAt: new Date().toISOString(),
    };

    this.currentTrial = completedTrial;

    await saveCampaignTrial(this.plan.experimentId, completedTrial);

    this.currentDeviceController = undefined;

    if (this.currentPair) {
      const pair = this.currentPair;

      const pairRecords = this.getRecordsForPair(pair);

      const hasBehaviourAware = pairRecords.some(
        (item) =>
          item.system === "behaviour_aware" &&
          item.condition === "intervention",
      );

      const hasPersonalized = pairRecords.some(
        (item) =>
          item.system === "personalized" && item.condition === "intervention",
      );

      if (hasBehaviourAware && hasPersonalized) {
        this.completedPairKeys.add(this.createPairKey(pair));
      }
    }

    await updateCampaignProgress(
      this.plan.experimentId,
      this.completedRecords.length,
    );

    if (this.hasFinished()) {
      await updateCampaignStatus(this.plan.experimentId, "completed");

      this.state = "finished";
    } else {
      this.state = "completed";
    }

    return record;
  }

  public resetCurrentTrial(): void {
    if (this.currentDeviceController) {
      throw new Error("Cannot reset a running trial.");
    }

    this.currentTrial = undefined;

    this.currentPair = undefined;

    if (!this.hasFinished()) {
      this.state = "ready";
    }
  }

  public async pause(): Promise<void> {
    if (this.currentDeviceController) {
      throw new Error("Cannot pause while a trial is actively running.");
    }

    await updateCampaignStatus(this.plan.experimentId, "paused");

    this.state = "ready";
  }

  public async cancel(): Promise<void> {
    if (this.currentDeviceController) {
      throw new Error("Cannot cancel while a trial is actively running.");
    }

    await updateCampaignStatus(this.plan.experimentId, "cancelled");

    this.state = "finished";
  }

  public getProgress(): {
    completedPairs: number;
    totalPairs: number;
    completionRate: number;
    completedTrials: number;
    totalTrials: number;
  } {
    const completedTrials = this.completedRecords.length;

    const totalTrials = this.plan.totalTrials;

    return {
      completedPairs: this.completedPairKeys.size,

      totalPairs: this.plan.totalMatchedPairs,

      completionRate:
        this.plan.totalMatchedPairs > 0
          ? this.completedPairKeys.size / this.plan.totalMatchedPairs
          : 0,

      completedTrials,

      totalTrials,
    };
  }

  private async initializeNewCampaign(): Promise<void> {
    const now = new Date().toISOString();

    const campaign: ExperimentCampaign = {
      campaignId: this.plan.experimentId,

      name: `Battery Intelligence longitudinal experiment`,

      systems: ["behaviour_aware", "personalized"],

      totalTrials: this.plan.totalTrials,

      completedTrials: 0,

      status: "planned",

      createdAt: now,
    };

    await createExperimentCampaign(campaign);

    const trials = this.plan.pairs.flatMap((pair) => [
      pair.behaviourAwareTrial,
      pair.personalizedTrial,
    ]);

    for (const trial of trials) {
      await saveCampaignTrial(this.plan.experimentId, trial);
    }

    this.persistedTrials = trials.map((trial) => ({
      ...trial,
      campaignId: this.plan.experimentId,
    }));

    this.state = "ready";
  }

  private async restoreCampaignState(): Promise<void> {
    const campaign = await getExperimentCampaign(this.plan.experimentId);

    if (!campaign) {
      throw new Error(
        `No persisted campaign found for experiment ${this.plan.experimentId}.`,
      );
    }

    const trials = await getCampaignTrials(this.plan.experimentId);

    this.persistedTrials = trials;

    this.completedPairKeys.clear();

    for (const pair of this.plan.pairs) {
      const pairTrials = trials.filter(
        (trial) =>
          trial.appName === pair.appName &&
          trial.allocation.block === pair.block &&
          trial.allocation.repetition === pair.repetition,
      );

      const hasBehaviourAware = pairTrials.some(
        (trial) =>
          trial.system === "behaviour_aware" && trial.status === "completed",
      );

      const hasPersonalized = pairTrials.some(
        (trial) =>
          trial.system === "personalized" && trial.status === "completed",
      );

      if (hasBehaviourAware && hasPersonalized) {
        this.completedPairKeys.add(this.createPairKey(pair));
      }
    }

    /*
     * Find the first incomplete pair.
     */
    this.currentPairIndex = this.plan.pairs.findIndex(
      (pair) => !this.completedPairKeys.has(this.createPairKey(pair)),
    );

    if (this.currentPairIndex < 0) {
      this.currentPairIndex = this.plan.pairs.length;

      this.state = "finished";

      return;
    }

    /*
     * The controller intentionally does not
     * recreate an actively running TrialDeviceController
     * after an app restart.
     *
     * A trial that was interrupted must be
     * treated as incomplete and handled by the
     * experimental protocol rather than silently
     * pretending that the measurement continued.
     */
    const runningTrial = trials.find((trial) => trial.status === "running");

    if (runningTrial) {
      console.warn(
        `Found interrupted trial ${runningTrial.trialId}. It requires protocol-level handling before continuing.`,
      );
    }

    if (campaign.status === "cancelled") {
      this.state = "finished";

      return;
    }

    this.state = campaign.status === "paused" ? "ready" : "ready";
  }

  private findNextTrialForPair(
    pair: LongitudinalTrialPair,
  ): ExperimentalTrial | undefined {
    const pairTrials = this.getPersistedTrialsForPair(pair);

    const hasBehaviourAware = pairTrials.some(
      (trial) =>
        trial.system === "behaviour_aware" && trial.status === "completed",
    );

    const hasPersonalized = pairTrials.some(
      (trial) =>
        trial.system === "personalized" && trial.status === "completed",
    );

    for (const system of pair.randomizedOrder) {
      if (system === "behaviour_aware" && !hasBehaviourAware) {
        return this.getPersistedTrial(
          pair.behaviourAwareTrial.trialId,
          pair.behaviourAwareTrial,
        );
      }

      if (system === "personalized" && !hasPersonalized) {
        return this.getPersistedTrial(
          pair.personalizedTrial.trialId,
          pair.personalizedTrial,
        );
      }
    }

    return undefined;
  }

  private getPersistedTrial(
    trialId: string,
    fallback: ExperimentalTrial,
  ): ExperimentalTrial {
    const persisted = this.persistedTrials?.find(
      (trial) => trial.trialId === trialId,
    );

    if (!persisted) {
      return fallback;
    }

    return {
      trialId: persisted.trialId,

      system: persisted.system,

      condition: persisted.condition,

      appName: persisted.appName,

      startingBatteryLevel: persisted.startingBatteryLevel,

      targetDurationMinutes: persisted.targetDurationMinutes,

      status: persisted.status,

      allocation: persisted.allocation,

      startedAt: persisted.startedAt,

      completedAt: persisted.completedAt,
    };
  }

  private getPersistedTrialsForPair(
    pair: LongitudinalTrialPair,
  ): PersistedTrial[] {
    return (
      this.persistedTrials?.filter(
        (trial) =>
          trial.appName === pair.appName &&
          trial.allocation.block === pair.block &&
          trial.allocation.repetition === pair.repetition,
      ) ?? []
    );
  }

  private getRecordsForPair(pair: LongitudinalTrialPair): ExperimentalRecord[] {
    return this.completedRecords.filter(
      (record) =>
        record.appName === pair.appName &&
        record.block === pair.block &&
        record.repetition === pair.repetition,
    );
  }

  private createPairKey(pair: LongitudinalTrialPair): string {
    return [pair.appName, pair.block, pair.repetition].join("|");
  }
}
