import { SessionObserver } from "../device/session-observer";

import { ExperimentController } from "./experiment-controller";

import type { BaselineDecision } from "../baselines/baseline-types";
import type { AppCategory } from "../types/behaviour";
import type { ExperimentalTrial } from "../types/trial";
import type {
  ExperimentControllerState,
  InterventionMeasurementResult,
} from "./experiment-controller";

import { buildExperimentalRecordFromMeasurement } from "../evaluation/experimental-record-builder";

import { saveExperimentalRecord } from "../storage/experimental-record-repository";

export class TrialDeviceController {
  private readonly trial: ExperimentalTrial;
  private readonly category: AppCategory;
  private readonly observer: SessionObserver;
  private readonly controller: ExperimentController;

  constructor(trial: ExperimentalTrial, category: AppCategory) {
    this.trial = trial;
    this.category = category;

    this.observer = new SessionObserver();

    this.controller = new ExperimentController({
      trialId: trial.trialId,
      system: trial.system,
      appName: trial.appName,
      category: this.category,
      observer: this.observer,
    });
  }

  public async start(
    decision: BaselineDecision,
  ): Promise<ExperimentControllerState> {
    const selectedAction =
      this.trial.condition === "control"
        ? "no_action"
        : decision.selectedAction;

    return this.controller.start(selectedAction, this.trial.condition);
  }

  public async recordDecision(
    decision: "accepted" | "rejected" | "ignored",
  ): Promise<void> {
    await this.controller.recordDecision(decision);
  }

  public recordInteraction(): void {
    this.controller.recordInteraction();
  }

  public recordAudioUsage(): void {
    this.controller.recordAudioUsage();
  }

  public recordNetworkUsage(): void {
    this.controller.recordNetworkUsage();
  }

  public recordHapticUsage(): void {
    this.controller.recordHapticUsage();
  }

  public async complete(): Promise<InterventionMeasurementResult> {
    const measurement = await this.controller.complete();

    const record = buildExperimentalRecordFromMeasurement(
      this.trial,
      measurement,
    );

    await saveExperimentalRecord(record);

    return measurement;
  }

  public getSession(): ExperimentControllerState | null {
    return this.controller.getSession();
  }

  public getTrial(): ExperimentalTrial {
    return this.trial;
  }
}
