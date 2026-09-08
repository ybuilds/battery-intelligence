import { getCurrentBatteryState } from "../device/battery-monitor";
import { SessionObserver } from "../device/session-observer";
import { buildBehaviourObservation } from "../intelligence/observation-builder";

import {
  createExperimentSession,
  recordOutcomeMeasurement,
  updateExperimentDecision,
} from "../storage/experiment-repository";

import type { BaselineSystem } from "../baselines/baseline-types";
import type { BatteryState } from "../types/battery";
import type { AppBehaviour, AppCategory } from "../types/behaviour";
import type { ExperimentCondition } from "../types/experiment";
import type { InterventionAction } from "../types/intervention";

import { generateSessionId } from "../utils/session-id";

export type ExperimentControllerState = {
  sessionId: string;
  trialId: string;
  system: BaselineSystem;
  startedAt: string;
  batteryBefore: BatteryState;
  behaviour?: AppBehaviour;
  selectedAction: InterventionAction;
  decision: "pending" | "accepted" | "rejected" | "ignored";
  condition: ExperimentCondition;
};

export type ExperimentControllerConfig = {
  trialId: string;
  system: BaselineSystem;
  appName: string;
  category: AppCategory;
  observer: SessionObserver;
};

export class ExperimentController {
  private readonly trialId: string;
  private readonly system: BaselineSystem;
  private readonly appName: string;
  private readonly category: AppCategory;
  private readonly observer: SessionObserver;

  private session: ExperimentControllerState | null = null;

  constructor(config: ExperimentControllerConfig) {
    this.trialId = config.trialId;
    this.system = config.system;
    this.appName = config.appName;
    this.category = config.category;
    this.observer = config.observer;
  }

  public async start(
    selectedAction: InterventionAction,
    condition: ExperimentCondition = "intervention",
  ): Promise<ExperimentControllerState> {
    const batteryBefore = await getCurrentBatteryState();

    const sessionId = generateSessionId();
    const startedAt = new Date().toISOString();

    this.observer.reset();

    this.session = {
      sessionId,
      trialId: this.trialId,
      system: this.system,
      startedAt,
      batteryBefore,
      selectedAction,
      condition,
      decision: "pending",
    };

    await createExperimentSession({
      sessionId,
      trialId: this.trialId,
      system: this.system,
      startedAt,
      appName: this.appName,
      batteryLevelAtStart: batteryBefore.level,
      selectedAction,
      condition,
      userDecision: "pending",
    });

    return this.session;
  }

  public async recordDecision(
    decision: "accepted" | "rejected" | "ignored",
  ): Promise<void> {
    if (!this.session) {
      throw new Error(
        "Cannot record a decision before starting an experiment session.",
      );
    }

    this.session = {
      ...this.session,
      decision,
    };

    await updateExperimentDecision(this.session.sessionId, decision);
  }

  public async complete(): Promise<InterventionMeasurementResult> {
    if (!this.session) {
      throw new Error(
        "Cannot complete an experiment session before starting one.",
      );
    }

    const batteryAfter = await getCurrentBatteryState();

    const interaction = this.observer.getState();

    const behaviourObservation = buildBehaviourObservation(
      this.session.batteryBefore,
      interaction,
      this.appName,
      this.category,
    );

    const behaviour: AppBehaviour = {
      appName: behaviourObservation.appName,
      category: behaviourObservation.category as AppCategory,

      sessionDurationMinutes: behaviourObservation.sessionDurationMinutes,

      interactionIntensity:
        behaviourObservation.interactionIntensity as AppBehaviour["interactionIntensity"],

      screenDependency: behaviourObservation.screenDependency,

      audioDependency: behaviourObservation.audioDependency,

      networkDependency: behaviourObservation.networkDependency,

      typicalSessionDurationMinutes:
        behaviourObservation.typicalSessionDurationMinutes,

      preferredBrightness: behaviourObservation.preferredBrightness,

      usageContext:
        behaviourObservation.usageContext as AppBehaviour["usageContext"],
    };

    const measuredDurationMinutes = interaction.activeDurationSeconds / 60;

    const batteryDelta = this.session.batteryBefore.level - batteryAfter.level;

    const energySaving = Math.max(0, batteryDelta);

    const userAcceptance =
      this.session.decision === "accepted"
        ? 1
        : this.session.decision === "rejected"
          ? 0
          : undefined;

    await recordOutcomeMeasurement({
      sessionId: this.session.sessionId,
      batteryLevelBefore: this.session.batteryBefore.level,
      batteryLevelAfter: batteryAfter.level,
      energySaving,
      userAcceptance,
      measuredDurationMinutes,
      recordedAt: new Date().toISOString(),
    });

    this.session = {
      ...this.session,
      behaviour,
    };

    return {
      sessionId: this.session.sessionId,
      trialId: this.session.trialId,
      system: this.session.system,
      condition: this.session.condition,
      batteryBefore: this.session.batteryBefore.level,
      batteryAfter: batteryAfter.level,
      batteryDelta,
      measuredDurationMinutes,
      behaviour,
      userAcceptance,
    };
  }

  public getSession(): ExperimentControllerState | null {
    return this.session;
  }

  public recordInteraction(): void {
    this.observer.recordInteraction();
  }

  public recordAudioUsage(): void {
    this.observer.recordAudioUsage();
  }

  public recordNetworkUsage(): void {
    this.observer.recordNetworkUsage();
  }

  public recordHapticUsage(): void {
    this.observer.recordHapticUsage();
  }
}

export type InterventionMeasurementResult = {
  sessionId: string;
  trialId: string;
  system: BaselineSystem;
  condition: ExperimentCondition;
  batteryBefore: number;
  batteryAfter: number;
  batteryDelta: number;
  measuredDurationMinutes: number;
  behaviour: AppBehaviour;
  userAcceptance: 0 | 1 | undefined;
};
