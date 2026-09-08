import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { BaselineDecision } from "../baselines/baseline-types";
import type { AppCategory } from "../types/behaviour";
import type { ExperimentalTrial } from "../types/trial";

import { TrialDeviceController } from "../experiments/trial-device-controller";
import { generateOutcomeDataset } from "../intelligence/outcome-dataset";
import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

export type ExperimentRunnerProps = {
  trial: ExperimentalTrial;
  category: AppCategory;
};

type RunnerStatus = "ready" | "running" | "completed" | "error";

export function ExperimentRunner({ trial, category }: ExperimentRunnerProps) {
  const [status, setStatus] = useState<RunnerStatus>("ready");

  const [decision, setDecision] = useState<
    "pending" | "accepted" | "rejected" | "ignored"
  >("pending");

  const [error, setError] = useState<string | null>(null);

  const [batteryBefore, setBatteryBefore] = useState<number | null>(null);

  const [batteryAfter, setBatteryAfter] = useState<number | null>(null);

  const [durationMinutes, setDurationMinutes] = useState(0);

  const [selectedAction, setSelectedAction] = useState("");

  const [decisionReason, setDecisionReason] = useState("");

  const [policyDecision, setPolicyDecision] = useState<BaselineDecision | null>(
    null,
  );

  const [measurementSaved, setMeasurementSaved] = useState(false);

  const controller = useMemo(
    () => new TrialDeviceController(trial, category),
    [trial, category],
  );

  const predictor = useMemo(() => {
    const model = new LightweightOutcomePredictor();

    const dataset = generateOutcomeDataset(2000);

    model.train(dataset);

    return model;
  }, []);

  async function handleStart() {
    try {
      setError(null);
      setStatus("running");
      setDecision("pending");
      setMeasurementSaved(false);

      const result = await controller.start(predictor);

      setBatteryBefore(result.batteryBefore.level);

      setSelectedAction(result.selectedAction);

      const selectedDecision = controller.getDecision();

      setPolicyDecision(selectedDecision);

      setDecisionReason(
        selectedDecision?.reason ?? "Experimental policy selected.",
      );
    } catch (startError) {
      setStatus("error");

      setError(
        startError instanceof Error
          ? startError.message
          : "Unable to start experiment.",
      );
    }
  }

  async function handleDecision(
    nextDecision: "accepted" | "rejected" | "ignored",
  ) {
    try {
      setError(null);

      await controller.recordDecision(nextDecision);

      setDecision(nextDecision);
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "Unable to record decision.",
      );
    }
  }

  function recordInteraction() {
    controller.recordInteraction();
  }

  function recordAudioUsage() {
    controller.recordAudioUsage();
  }

  function recordNetworkUsage() {
    controller.recordNetworkUsage();
  }

  function recordHapticUsage() {
    controller.recordHapticUsage();
  }

  async function handleComplete() {
    try {
      setError(null);

      const result = await controller.complete();

      setBatteryAfter(result.batteryAfter);

      setDurationMinutes(result.measuredDurationMinutes);

      setMeasurementSaved(true);
      setStatus("completed");
    } catch (completeError) {
      setStatus("error");

      setError(
        completeError instanceof Error
          ? completeError.message
          : "Unable to complete experiment.",
      );
    }
  }

  const batteryDelta =
    batteryBefore !== null && batteryAfter !== null
      ? batteryBefore - batteryAfter
      : null;

  const isControl = trial.condition === "control";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>BATTERY INTELLIGENCE</Text>

        <Text style={styles.title}>Real-Device Experiment</Text>

        <Text style={styles.subtitle}>
          Controlled evaluation of personalized battery-management behaviour.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Trial</Text>

          <Text style={styles.value}>{trial.trialId}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>System</Text>

          <Text style={styles.value}>{trial.system}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Condition</Text>

          <Text style={styles.value}>{trial.condition}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Application</Text>

          <Text style={styles.value}>{trial.appName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Target duration</Text>

          <Text style={styles.value}>{trial.targetDurationMinutes} min</Text>
        </View>
      </View>

      <View style={styles.decisionCard}>
        <Text style={styles.sectionTitle}>Policy decision</Text>

        <Text style={styles.action}>
          {selectedAction || policyDecision?.selectedAction || "Pending"}
        </Text>

        <Text style={styles.reason}>
          {decisionReason ||
            policyDecision?.reason ||
            "Policy decision will be generated when the trial starts."}
        </Text>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {((policyDecision?.estimatedEnergySaving ?? 0) * 100).toFixed(1)}%
            </Text>

            <Text style={styles.metricLabel}>estimated saving</Text>
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {((policyDecision?.estimatedUXImpact ?? 0) * 100).toFixed(1)}%
            </Text>

            <Text style={styles.metricLabel}>estimated UX impact</Text>
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {((policyDecision?.score ?? 0) * 100).toFixed(1)}
            </Text>

            <Text style={styles.metricLabel}>policy score</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Experiment state</Text>

        <Text style={styles.status}>{status.toUpperCase()}</Text>

        {batteryBefore !== null && (
          <Text style={styles.info}>Battery before: {batteryBefore}%</Text>
        )}

        {batteryAfter !== null && (
          <Text style={styles.info}>Battery after: {batteryAfter}%</Text>
        )}

        {batteryDelta !== null && (
          <Text style={styles.info}>
            Battery change: {batteryDelta.toFixed(2)}%
          </Text>
        )}

        {durationMinutes > 0 && (
          <Text style={styles.info}>
            Measured duration: {durationMinutes.toFixed(2)} min
          </Text>
        )}

        {measurementSaved && (
          <Text style={styles.saved}>
            Experimental record persisted locally.
          </Text>
        )}
      </View>

      {status === "ready" && (
        <Pressable style={styles.primaryButton} onPress={handleStart}>
          <Text style={styles.primaryButtonText}>Start Trial</Text>
        </Pressable>
      )}

      {status === "running" && (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>User decision</Text>

            <Text style={styles.info}>
              {isControl
                ? "This is a control trial. No intervention will be applied."
                : `Selected intervention: ${selectedAction}`}
            </Text>

            <View style={styles.buttonGrid}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => handleDecision("accepted")}
              >
                <Text style={styles.secondaryButtonText}>Accept</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => handleDecision("rejected")}
              >
                <Text style={styles.secondaryButtonText}>Reject</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => handleDecision("ignored")}
              >
                <Text style={styles.secondaryButtonText}>Ignore</Text>
              </Pressable>
            </View>

            <Text style={styles.decisionState}>Decision: {decision}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Interaction observations</Text>

            <Text style={styles.info}>
              Record observable events during the trial.
            </Text>

            <View style={styles.buttonGrid}>
              <Pressable
                style={styles.secondaryButton}
                onPress={recordInteraction}
              >
                <Text style={styles.secondaryButtonText}>Interaction</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={recordAudioUsage}
              >
                <Text style={styles.secondaryButtonText}>Audio</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={recordNetworkUsage}
              >
                <Text style={styles.secondaryButtonText}>Network</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={recordHapticUsage}
              >
                <Text style={styles.secondaryButtonText}>Haptic</Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleComplete}>
            <Text style={styles.primaryButtonText}>Complete Trial</Text>
          </Pressable>
        </>
      )}

      {status === "completed" && (
        <View style={styles.completedCard}>
          <Text style={styles.completedTitle}>Trial completed</Text>

          <Text style={styles.completedText}>
            The measured outcome has been recorded for later statistical
            analysis.
          </Text>
        </View>
      )}

      {status === "error" && error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Experiment error</Text>

          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {status === "running" && (
        <ActivityIndicator size="small" style={styles.loader} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#F5F9FF",
  },

  header: {
    marginBottom: 20,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "#2563EB",
    marginBottom: 6,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  decisionCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },

  label: {
    color: "#64748B",
    fontSize: 14,
  },

  value: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },

  action: {
    fontSize: 21,
    fontWeight: "800",
    color: "#2563EB",
    marginBottom: 8,
  },

  reason: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },

  metricRow: {
    flexDirection: "row",
    marginTop: 18,
    gap: 8,
  },

  metric: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
  },

  metricValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  metricLabel: {
    marginTop: 3,
    fontSize: 10,
    color: "#64748B",
  },

  status: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
    marginBottom: 10,
  },

  info: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
    marginBottom: 6,
  },

  saved: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A",
  },

  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 14,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  secondaryButtonText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
  },

  decisionState: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
  },

  completedCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  completedTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#166534",
  },

  completedText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#166534",
  },

  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#991B1B",
  },

  errorText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#991B1B",
  },

  loader: {
    marginVertical: 10,
  },
});
