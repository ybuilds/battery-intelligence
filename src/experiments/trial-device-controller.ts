import { getCurrentBatteryState } from "../device/battery-monitor";
import { SessionObserver } from "../device/session-observer";

import { ExperimentController } from "./experiment-controller";

import type {
  ExperimentControllerState,
  InterventionMeasurementResult,
} from "./experiment-controller";

import type { BaselineDecision } from "../baselines/baseline-types";
import type { EvaluationScenario } from "../evaluation/evaluation-types";
import type { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";
import type { AppCategory } from "../types/behaviour";
import type { BehaviourProfile } from "../types/behaviour-profile";
import type { UserEnergyPreferences } from "../types/preferences";
import type { ExperimentalTrial } from "../types/trial";
import type { UXMeasurement } from "../types/ux-measurement";

import { getBehaviourProfile } from "../storage/behaviour-profile-repository";
import { loadPreferences } from "../storage/preference-repository";

import { createTrialDecision } from "./trial-policy-decision";

import {
  executeIntervention,
  restoreIntervention,
} from "../device/intervention-executor";

import type { InterventionExecution } from "../types/intervention-execution";

import {
  markInterventionRestored,
  recordInterventionExecution,
} from "../storage/intervention-execution-repository";

export class TrialDeviceController {
  private readonly trial: ExperimentalTrial;
  private readonly category: AppCategory;
  private readonly observer: SessionObserver;
  private readonly controller: ExperimentController;

  private latestDecision: BaselineDecision | null = null;

  private latestProfile: BehaviourProfile | null = null;

  private latestPreferences: UserEnergyPreferences | null = null;

  private interventionExecution: InterventionExecution | undefined;

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
    predictor: LightweightOutcomePredictor,
  ): Promise<ExperimentControllerState> {
    /*
     * Step 1:
     * Read the actual battery level immediately before
     * making the experimental policy decision.
     */
    const battery = await getCurrentBatteryState();

    /*
     * Step 2:
     * Load the user's learned behaviour profile.
     */
    const profile = await getBehaviourProfile(this.trial.appName);

    /*
     * Step 3:
     * Load intervention preferences.
     */
    const preferences = await loadPreferences();

    this.latestProfile = profile;

    this.latestPreferences = preferences;

    /*
     * Step 4:
     * Construct the current observation.
     */
    const behaviour = {
      appName: this.trial.appName,

      category: this.category,

      sessionDurationMinutes: 0,

      interactionIntensity: "medium" as const,

      screenDependency: 0.8,

      audioDependency:
        this.category === "music" || this.category === "video" ? 0.8 : 0.2,

      networkDependency: 0.7,

      typicalSessionDurationMinutes: this.trial.targetDurationMinutes,

      preferredBrightness: 0.7,

      usageContext: getCurrentUsageContext(),
    };

    /*
     * Step 5:
     * Build the exact scenario presented to
     * the experimental policy.
     */
    const scenario: EvaluationScenario = {
      scenarioId: `device-${this.trial.trialId}`,

      description: `Real-device experiment for ${this.trial.appName}.`,

      battery,

      behaviour,

      preferences,

      profile,
    };

    /*
     * Step 6:
     * Run the selected baseline policy.
     */
    const decision = createTrialDecision(this.trial, scenario, predictor);

    this.latestDecision = decision;

    /*
     * Control trials always receive no_action,
     * regardless of the policy recommendation.
     */
    const selectedAction =
      this.trial.condition === "control"
        ? "no_action"
        : decision.selectedAction;

    /*
     * Step 7:
     * Create the experiment session FIRST.
     *
     * This gives us the actual sessionId that will
     * be used to associate the intervention execution
     * record with this experiment.
     */
    const session = await this.controller.start(
      selectedAction,
      this.trial.condition,
    );

    /*
     * Step 8:
     * Execute the selected intervention.
     *
     * Unsupported interventions will return a
     * structured recommendation/observation result
     * instead of attempting prohibited system control.
     */
    const execution = await executeIntervention(selectedAction);

    this.interventionExecution = execution;

    /*
     * Store the execution against the exact
     * experiment session.
     */
    await recordInterventionExecution(session.sessionId, execution);

    console.log("Intervention execution:", execution);

    return session;
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
    /*
     * First complete the experiment measurement.
     *
     * ExperimentController.complete() measures the
     * battery while the intervention is still active.
     */
    const measurement = await this.controller.complete();

    /*
     * Only after the experimental outcome has been
     * captured do we restore the intervention.
     */
    if (this.interventionExecution) {
      const restored = await restoreIntervention(this.interventionExecution);

      this.interventionExecution = restored;

      const session = this.controller.getSession();

      await markInterventionRestored(session?.sessionId, restored.action);
    }

    return measurement;
  }

  public getSession(): ExperimentControllerState | null {
    return this.controller.getSession();
  }

  public getTrial(): ExperimentalTrial {
    return this.trial;
  }

  public getDecision(): BaselineDecision | null {
    return this.latestDecision;
  }

  public getProfile(): BehaviourProfile | null {
    return this.latestProfile;
  }

  public getPreferences(): UserEnergyPreferences | null {
    return this.latestPreferences;
  }

  public recordUXMeasurement(measurement: UXMeasurement): void {
    this.controller.recordUXMeasurement(measurement);
  }

  public getUXMeasurement(): UXMeasurement | undefined {
    return this.controller.getUXMeasurement();
  }

  public getInterventionExecution(): InterventionExecution | undefined {
    return this.interventionExecution;
  }
}

function getCurrentUsageContext():
  | "morning"
  | "afternoon"
  | "evening"
  | "night" {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 22) {
    return "evening";
  }

  return "night";
}
