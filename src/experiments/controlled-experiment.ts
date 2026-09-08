import { SessionObserver } from "../device/session-observer";
import { runRecommendationRuntime } from "../runtime/recommendation-runtime";

import type { BaselineSystem } from "../baselines/baseline-types";
import type { AppCategory } from "../types/behaviour";

import { ExperimentController } from "./experiment-controller";
import type { ExperimentResult } from "./experiment-result";

export class ControlledExperiment {
  private readonly trialId: string;
  private readonly system: BaselineSystem;
  private readonly appName: string;
  private readonly category: AppCategory;

  private readonly observer: SessionObserver;
  private readonly controller: ExperimentController;

  private recommendation:
    | Awaited<ReturnType<typeof runRecommendationRuntime>>["recommendation"]
    | null = null;

  constructor(
    trialId: string,
    system: BaselineSystem,
    appName: string,
    category: AppCategory,
  ) {
    this.trialId = trialId;
    this.system = system;
    this.appName = appName;
    this.category = category;

    this.observer = new SessionObserver();

    this.controller = new ExperimentController({
      trialId: this.trialId,
      system: this.system,
      appName: this.appName,
      category: this.category,
      observer: this.observer,
    });
  }

  public async start(): Promise<void> {
    const runtimeResult = await runRecommendationRuntime({
      appName: this.appName,
      category: this.category,
      observer: this.observer,
    });

    this.recommendation = runtimeResult.recommendation;

    await this.controller.start(
      this.recommendation.selectedAction,
      "intervention",
    );
  }

  public accept(): Promise<void> {
    return this.controller.recordDecision("accepted");
  }

  public reject(): Promise<void> {
    return this.controller.recordDecision("rejected");
  }

  public ignore(): Promise<void> {
    return this.controller.recordDecision("ignored");
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

  public async complete(): Promise<ExperimentResult> {
    if (!this.recommendation) {
      throw new Error("Cannot complete an experiment before starting it.");
    }

    const measurement = await this.controller.complete();

    return {
      sessionId: measurement.sessionId,
      selectedAction: this.recommendation.selectedAction,
      condition: this.controller.getSession()?.condition ?? "intervention",
      recommendation: this.recommendation,
      measurement,
    };
  }

  public async startControl(): Promise<void> {
    const runtimeResult = await runRecommendationRuntime({
      appName: this.appName,
      category: this.category,
      observer: this.observer,
    });

    this.recommendation = runtimeResult.recommendation;

    await this.controller.start("no_action", "control");
  }
}
