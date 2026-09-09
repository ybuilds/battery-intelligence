import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useEffect, useMemo, useState } from "react";

import {
  createDefaultLongitudinalConfig,
  createLongitudinalExperimentPlan,
} from "../experiments/longitudinal-experiment";

import { LongitudinalExperimentController } from "../experiments/longitudinal-controller";

import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

import { generateOutcomeDataset } from "../intelligence/outcome-dataset";

import type { ExperimentalTrial } from "../types/trial";

import { UXMeasurementForm } from "../components/UXMeasurementForm";

import type { UXMeasurement } from "../types/ux-measurement";

type CampaignViewState =
  | "loading"
  | "ready"
  | "running"
  | "completed"
  | "error";

export default function CampaignScreen() {
  const [showUXForm, setShowUXForm] = useState(false);

  const [controller, setController] =
    useState<LongitudinalExperimentController | null>(null);

  const [currentTrial, setCurrentTrial] = useState<
    ExperimentalTrial | undefined
  >();

  const [viewState, setViewState] = useState<CampaignViewState>("loading");

  const [error, setError] = useState<string | null>(null);

  const [progressVersion, setProgressVersion] = useState(0);

  useEffect(() => {
    initializeCampaign();
  }, []);

  async function initializeCampaign() {
    try {
      setViewState("loading");
      setError(null);

      const config = createDefaultLongitudinalConfig();

      /*
       * Development configuration.
       *
       * Keep this small while validating the
       * real-device workflow.
       *
       * Change these values later for the
       * actual research campaign.
       */
      config.blocks = 2;
      config.repetitionsPerBlock = 1;

      const plan = createLongitudinalExperimentPlan(config);

      const predictor = new LightweightOutcomePredictor();

      const dataset = generateOutcomeDataset(2000);

      predictor.train(dataset);

      /*
       * Attempt to resume an existing campaign.
       *
       * If it does not exist, create a new one.
       */
      let experimentController: LongitudinalExperimentController;

      try {
        experimentController = await LongitudinalExperimentController.resume(
          plan,
          predictor,
        );
      } catch {
        experimentController = await LongitudinalExperimentController.create(
          plan,
          predictor,
        );
      }

      setController(experimentController);

      const nextTrial = experimentController.prepareNextTrial();

      setCurrentTrial(nextTrial);

      setViewState(nextTrial ? "ready" : "completed");
    } catch (err) {
      console.error("Campaign initialization failed:", err);

      setError(
        err instanceof Error ? err.message : "Unable to initialize campaign.",
      );

      setViewState("error");
    }
  }

  const progress = useMemo(() => {
    if (!controller) {
      return {
        completedPairs: 0,
        totalPairs: 0,
        completionRate: 0,
        completedTrials: 0,
        totalTrials: 0,
      };
    }

    return controller.getProgress();
  }, [controller, progressVersion]);

  const pair = controller?.getCurrentPair();

  const pairRecords = controller?.getCompletedRecords() ?? [];

  const currentPairRecords = pairRecords.filter(
    (record) =>
      record.appName === pair?.appName &&
      record.block === pair?.block &&
      record.repetition === pair?.repetition,
  );

  const currentPairHasB3 = currentPairRecords.some(
    (record) => record.system === "behaviour_aware",
  );

  const currentPairHasB4 = currentPairRecords.some(
    (record) => record.system === "personalized",
  );

  async function handleStart() {
    if (!controller || !currentTrial) {
      return;
    }

    try {
      setError(null);

      await controller.startCurrentTrial();

      setViewState("running");

      setProgressVersion((value) => value + 1);
    } catch (err) {
      console.error("Unable to start trial:", err);

      setError(err instanceof Error ? err.message : "Unable to start trial.");
    }
  }

  async function handleComplete() {
    if (!controller) {
      return;
    }

    setShowUXForm(true);
  }

  async function handleUXSubmit(measurement: UXMeasurement) {
    if (!controller) {
      return;
    }

    try {
      setError(null);

      controller.recordUXMeasurement(measurement);

      const record = await controller.completeCurrentTrial();

      console.log("Completed experimental record:", record);

      const nextTrial = controller.prepareNextTrial();

      setCurrentTrial(nextTrial);

      setShowUXForm(false);

      setProgressVersion((value) => value + 1);

      setViewState(nextTrial ? "ready" : "completed");
    } catch (err) {
      console.error("Unable to save UX measurement:", err);

      setError(
        err instanceof Error ? err.message : "Unable to complete trial.",
      );
    }
  }

  async function handlePause() {
    if (!controller) {
      return;
    }

    try {
      await controller.pause();

      setViewState("ready");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to pause campaign.",
      );
    }
  }

  if (viewState === "loading") {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading research campaign…</Text>
      </View>
    );
  }

  if (viewState === "error") {
    return (
      <View style={styles.center}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Campaign unavailable</Text>

          <Text style={styles.errorText}>{error}</Text>

          <Pressable style={styles.primaryButton} onPress={initializeCampaign}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (viewState === "completed") {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>BATTERY INTELLIGENCE</Text>

          <Text style={styles.title}>Campaign Complete</Text>

          <Text style={styles.subtitle}>
            The longitudinal experimental campaign has completed.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>FINAL PROGRESS</Text>

          <Text style={styles.progressValue}>
            {progress.completedPairs} / {progress.totalPairs}
          </Text>

          <Text style={styles.secondaryText}>
            Matched B3/B4 pairs completed
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>TRIALS</Text>

          <Text style={styles.progressValue}>
            {progress.completedTrials} / {progress.totalTrials}
          </Text>

          <Text style={styles.secondaryText}>Device trials completed</Text>
        </View>
      </ScrollView>
    );
  }

  if (showUXForm) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <UXMeasurementForm
          onSubmit={handleUXSubmit}
          onCancel={() => setShowUXForm(false)}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>RESEARCH CAMPAIGN</Text>

        <Text style={styles.title}>Longitudinal Experiment</Text>

        <Text style={styles.subtitle}>
          Behaviour-aware vs personalized intervention
        </Text>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.cardLabel}>CAMPAIGN PROGRESS</Text>

            <Text style={styles.progressValue}>
              {progress.completedPairs} / {progress.totalPairs}
            </Text>
          </View>

          <Text style={styles.percent}>
            {Math.round(progress.completionRate * 100)}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progress.completionRate * 100)}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.secondaryText}>
          {progress.completedTrials} of {progress.totalTrials} trials completed
        </Text>
      </View>

      {pair && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CURRENT MATCHED PAIR</Text>

          <Text style={styles.pairTitle}>{pair.appName}</Text>

          <Text style={styles.secondaryText}>
            Block {pair.block} · Repetition {pair.repetition}
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View
                style={[
                  styles.statusDot,
                  currentPairHasB3
                    ? styles.statusComplete
                    : styles.statusPending,
                ]}
              />

              <Text style={styles.statusText}>B3 Behaviour-aware</Text>
            </View>

            <View style={styles.statusItem}>
              <View
                style={[
                  styles.statusDot,
                  currentPairHasB4
                    ? styles.statusComplete
                    : styles.statusPending,
                ]}
              />

              <Text style={styles.statusText}>B4 Personalized</Text>
            </View>
          </View>
        </View>
      )}

      {currentTrial && (
        <View style={styles.trialCard}>
          <Text style={styles.cardLabel}>NEXT TRIAL</Text>

          <Text style={styles.trialSystem}>
            {currentTrial.system === "personalized"
              ? "B4 Personalized"
              : "B3 Behaviour-aware"}
          </Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {currentTrial.condition.toUpperCase()}
            </Text>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>APPLICATION</Text>

              <Text style={styles.detailValue}>{currentTrial.appName}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>TARGET</Text>

              <Text style={styles.detailValue}>
                {currentTrial.targetDurationMinutes} min
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>START BATTERY</Text>

              <Text style={styles.detailValue}>
                {currentTrial.startingBatteryLevel}%
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>TRIAL</Text>

              <Text style={styles.detailValue}>
                {currentTrial.allocation.repetition}
              </Text>
            </View>
          </View>

          {viewState === "ready" && (
            <Pressable style={styles.primaryButton} onPress={handleStart}>
              <Text style={styles.primaryButtonText}>START TRIAL</Text>
            </Pressable>
          )}

          {viewState === "running" && (
            <>
              <View style={styles.runningBanner}>
                <View style={styles.liveDot} />

                <Text style={styles.runningText}>Trial is running</Text>
              </View>

              <Text style={styles.instruction}>
                Use the observation controls during the trial. Complete the
                trial only after the target measurement period.
              </Text>

              <Pressable style={styles.completeButton} onPress={handleComplete}>
                <Text style={styles.completeButtonText}>COMPLETE TRIAL</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {!currentTrial && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No pending trial</Text>

          <Text style={styles.secondaryText}>
            The controller has no incomplete trial available.
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorInline}>
          <Text style={styles.errorInlineText}>{error}</Text>
        </View>
      )}

      {controller && viewState !== "running" && (
        <Pressable style={styles.pauseButton} onPress={handlePause}>
          <Text style={styles.pauseButtonText}>PAUSE CAMPAIGN</Text>
        </Pressable>
      )}

      <View style={styles.researchNote}>
        <Text style={styles.researchNoteTitle}>RESEARCH PROTOCOL</Text>

        <Text style={styles.researchNoteText}>
          Trials are matched by application, block and repetition. B3 and B4
          order is randomized during campaign generation. Measurements are
          stored locally for subsequent analysis.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 48,
    backgroundColor: "#F7FAFF",
    minHeight: "100%",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F7FAFF",
  },

  loadingText: {
    fontSize: 16,
    color: "#526071",
  },

  header: {
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "#2563EB",
    marginBottom: 8,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#10213F",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#607086",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E4EAF3",
  },

  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DCE6F7",
  },

  trialCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#CFE0FF",
  },

  cardLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#738197",
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#172B4D",
    marginBottom: 6,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  progressValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#173A72",
  },

  percent: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2563EB",
  },

  progressTrack: {
    height: 9,
    borderRadius: 10,
    backgroundColor: "#E8EEF8",
    overflow: "hidden",
    marginTop: 16,
    marginBottom: 10,
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },

  secondaryText: {
    fontSize: 14,
    color: "#69788E",
    lineHeight: 20,
  },

  pairTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#172B4D",
    marginBottom: 4,
  },

  statusRow: {
    marginTop: 18,
    gap: 12,
  },

  statusItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 9,
  },

  statusComplete: {
    backgroundColor: "#16A34A",
  },

  statusPending: {
    backgroundColor: "#CBD5E1",
  },

  statusText: {
    fontSize: 14,
    color: "#3D4D63",
  },

  trialSystem: {
    fontSize: 26,
    fontWeight: "800",
    color: "#173A72",
    marginBottom: 10,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F0FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 20,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#2563EB",
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },

  detailItem: {
    width: "50%",
    marginBottom: 18,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: "#8491A3",
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#263A57",
  },

  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  runningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
  },

  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#16A34A",
    marginRight: 9,
  },

  runningText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },

  instruction: {
    fontSize: 14,
    lineHeight: 21,
    color: "#66758A",
    marginBottom: 16,
  },

  completeButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  completeButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  pauseButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 18,
  },

  pauseButtonText: {
    color: "#68778C",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  researchNote: {
    backgroundColor: "#EEF5FF",
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
  },

  researchNoteTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#315A99",
    marginBottom: 7,
  },

  researchNoteText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#526985",
  },

  errorCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#F1D2D2",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#8A2727",
    marginBottom: 8,
  },

  errorText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6D4A4A",
    marginBottom: 18,
  },

  errorInline: {
    backgroundColor: "#FFF4F4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },

  errorInlineText: {
    color: "#8A2727",
    fontSize: 13,
    lineHeight: 19,
  },
});
