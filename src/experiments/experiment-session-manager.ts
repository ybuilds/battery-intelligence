import { SessionObserver } from "../device/session-observer";
import type { AppCategory } from "../types/behaviour";
import type { InterventionAction } from "../types/intervention";
import {
  ExperimentController,
  type ExperimentControllerState,
  type InterventionMeasurementResult,
} from "./experiment-controller";

export type ExperimentSessionManagerState = "idle" | "running" | "completed";

export class ExperimentSessionManager {
  private readonly controller: ExperimentController;

  private state: ExperimentSessionManagerState = "idle";

  constructor(appName: string, category: AppCategory) {
    this.controller = new ExperimentController({
      trialId: "manual-experiment",
      system: "personalized",
      appName,
      category,
      observer: new SessionObserver(),
    });
  }

  public async start(
    selectedAction: InterventionAction,
  ): Promise<ExperimentControllerState> {
    if (this.state === "running") {
      throw new Error("An experiment session is already running.");
    }

    const session = await this.controller.start(selectedAction);

    this.state = "running";

    return session;
  }

  public async recordDecision(
    decision: "accepted" | "rejected" | "ignored",
  ): Promise<void> {
    if (this.state !== "running") {
      throw new Error(
        "Cannot record a decision when no experiment is running.",
      );
    }

    await this.controller.recordDecision(decision);
  }

  public recordInteraction(): void {
    if (this.state !== "running") {
      return;
    }

    this.controller.recordInteraction();
  }

  public recordAudioUsage(): void {
    if (this.state !== "running") {
      return;
    }

    this.controller.recordAudioUsage();
  }

  public recordNetworkUsage(): void {
    if (this.state !== "running") {
      return;
    }

    this.controller.recordNetworkUsage();
  }

  public recordHapticUsage(): void {
    if (this.state !== "running") {
      return;
    }

    this.controller.recordHapticUsage();
  }

  public async complete(): Promise<InterventionMeasurementResult> {
    if (this.state !== "running") {
      throw new Error(
        "Cannot complete an experiment when no session is running.",
      );
    }

    const result = await this.controller.complete();

    this.state = "completed";

    return result;
  }

  public getState(): ExperimentSessionManagerState {
    return this.state;
  }

  public getSession(): ExperimentControllerState | null {
    return this.controller.getSession();
  }
}
