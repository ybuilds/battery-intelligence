import { getCurrentBatteryState } from "../device/battery-monitor";
import { SessionObserver } from "../device/session-observer";
import { buildBehaviourObservation } from "../intelligence/observation-builder";

import {
  completeExperimentSession,
  createExperimentSession,
  recordOutcomeMeasurement,
  updateExperimentDecision,
} from "../storage/experiment-repository";

import { recordBehaviourObservation } from "../storage/behaviour-repository";
import { recordPreferenceDecision } from "../storage/preference-repository";

import type { BaselineSystem } from "../baselines/baseline-types";
import type { BatteryState } from "../types/battery";
import type { AppBehaviour, AppCategory } from "../types/behaviour";
import type { ExperimentCondition } from "../types/experiment";
import type { InterventionAction } from "../types/intervention";
import type { UXMeasurement } from "../types/ux-measurement";

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

  private uxMeasurement: UXMeasurement | undefined;

  constructor(config: ExperimentControllerConfig) {
    this.trialId = config.trialId;
    this.system = config.system;
    this.appName = config.appName;
    this.category = config.category;
    this.observer = config.observer;
  }

  public recordUXMeasurement(measurement: UXMeasurement): void {
    if (!this.session) {
      throw new Error("No active experiment session.");
    }

    this.uxMeasurement = measurement;
  }

  public getUXMeasurement(): UXMeasurement | undefined {
    return this.uxMeasurement;
  }

  public async start(
    selectedAction: InterventionAction,
    condition: ExperimentCondition = "intervention",
  ): Promise<ExperimentControllerState> {
    if (this.session) {
      throw new Error("An experiment session is already active.");
    }

    /*
     * Capture the actual battery level at the
     * beginning of the experimental session.
     */
    const batteryBefore = await getCurrentBatteryState();

    const sessionId = generateSessionId();

    const startedAt = new Date().toISOString();

    /*
     * Reset all observation counters before
     * beginning a new trial.
     */
    this.observer.reset();

    /*
     * Clear any previous UX measurement.
     */
    this.uxMeasurement = undefined;

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

    /*
     * Persist the experimental session before
     * returning the session ID to the caller.
     *
     * This allows TrialDeviceController to associate
     * subsequent intervention-execution events with
     * this exact experimental session.
     */
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

    /*
     * Accepted and rejected decisions provide
     * explicit preference evidence.
     *
     * Ignored decisions are deliberately excluded
     * because they do not establish a clear preference.
     *
     * no_action is also safely ignored by
     * recordPreferenceDecision().
     */
    if (decision === "accepted" || decision === "rejected") {
      await recordPreferenceDecision(this.session.selectedAction, decision);
    }
  }

  public async complete(): Promise<InterventionMeasurementResult> {
    if (!this.session) {
      throw new Error(
        "Cannot complete an experiment session before starting one.",
      );
    }

    /*
     * Capture the battery level BEFORE any external
     * intervention restoration is performed.
     *
     * This is important experimentally:
     *
     * intervention active
     *       ↓
     * battery measurement
     *       ↓
     * outcome recorded
     *       ↓
     * intervention restored
     *
     * Therefore batteryAfter represents the actual
     * experimental condition rather than the restored
     * device state.
     */
    const batteryAfter = await getCurrentBatteryState();

    const interaction = this.observer.getState();

    /*
     * Build behaviour from the actual observed
     * device session.
     */
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

    /*
     * This value represents observed battery
     * percentage change during the trial.
     *
     * It should NOT be interpreted as causal
     * energy saving. Treatment effects are
     * calculated later through matched comparisons
     * between experimental conditions.
     */
    const observedBatteryDrain = Math.max(0, batteryDelta);

    const userAcceptance =
      this.session.decision === "accepted"
        ? 1
        : this.session.decision === "rejected"
          ? 0
          : undefined;

    /*
     * Persist the measured experimental outcome.
     */
    await recordOutcomeMeasurement({
      sessionId: this.session.sessionId,

      batteryLevelBefore: this.session.batteryBefore.level,

      batteryLevelAfter: batteryAfter.level,

      energySaving: observedBatteryDrain,

      userAcceptance,

      measuredDurationMinutes,

      recordedAt: new Date().toISOString(),
    });

    /*
     * Persist the actual behavioural observation.
     *
     * This observation contributes to future
     * BehaviourProfile personalization.
     */
    await recordBehaviourObservation(behaviour);

    /*
     * Mark the experiment as genuinely completed
     * only after the measured outcome and behaviour
     * have successfully been persisted.
     */
    await completeExperimentSession(this.session.sessionId);

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
