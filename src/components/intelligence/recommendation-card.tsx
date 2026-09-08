import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Recommendation } from "../../types/recommendation";

type RecommendationCardProps = {
  recommendation: Recommendation | null;

  onAccept: () => void;

  onReject: () => void;

  decision: "accepted" | "rejected" | "ignored" | null;
};

function formatAction(action: Recommendation["selectedAction"]): string {
  switch (action) {
    case "reduce_brightness":
      return "Reduce brightness";

    case "reduce_haptics":
      return "Reduce haptic feedback";

    case "reduce_audio":
      return "Reduce audio activity";

    case "limit_background_activity":
      return "Limit background activity";

    case "no_action":
      return "No action";

    default:
      return "Unknown intervention";
  }
}

function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function RecommendationCard({
  recommendation,
  onAccept,
  onReject,
  decision,
}: RecommendationCardProps) {
  if (!recommendation) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>INTELLIGENCE</Text>

        <Text style={styles.title}>Preparing recommendation</Text>

        <Text style={styles.description}>
          Battery and behavioural signals are being analysed.
        </Text>
      </View>
    );
  }

  const selected = recommendation.candidates[0];

  if (!selected) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>INTELLIGENCE</Text>

        <Text style={styles.title}>No recommendation</Text>

        <Text style={styles.description}>
          The system did not identify a suitable intervention.
        </Text>
      </View>
    );
  }

  const action = formatAction(recommendation.selectedAction);

  const isCompleted = decision !== null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.label}>INTELLIGENCE</Text>

          <Text style={styles.title}>Recommended intervention</Text>
        </View>

        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {formatPercentage(selected.confidence)}
          </Text>

          <Text style={styles.confidenceLabel}>confidence</Text>
        </View>
      </View>

      <View style={styles.actionBox}>
        <Text style={styles.actionLabel}>CURRENT RECOMMENDATION</Text>

        <Text style={styles.action}>{action}</Text>

        <Text style={styles.explanation}>{recommendation.explanation}</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {formatPercentage(selected.predictedEnergySaving)}
          </Text>

          <Text style={styles.metricLabel}>predicted saving</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {formatPercentage(selected.predictedUXImpact)}
          </Text>

          <Text style={styles.metricLabel}>UX impact</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {formatPercentage(selected.predictedUserAcceptance)}
          </Text>

          <Text style={styles.metricLabel}>acceptance</Text>
        </View>
      </View>

      <View style={styles.profileRow}>
        <Text style={styles.profileLabel}>Personalization confidence</Text>

        <Text style={styles.profileValue}>
          {formatPercentage(recommendation.profileConfidence)}
        </Text>
      </View>

      <View style={styles.modeBox}>
        <Text style={styles.modeTitle}>User control</Text>

        <Text style={styles.modeText}>
          {selected.executionMode === "execute"
            ? "This intervention can be executed automatically."
            : selected.executionMode === "recommend"
              ? "This intervention requires your confirmation."
              : "This intervention cannot currently be executed automatically."}
        </Text>
      </View>

      {!isCompleted && recommendation.selectedAction !== "no_action" && (
        <View style={styles.buttons}>
          <Pressable
            style={[styles.button, styles.rejectButton]}
            onPress={onReject}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.acceptButton]}
            onPress={onAccept}
          >
            <Text style={styles.acceptButtonText}>Allow</Text>
          </Pressable>
        </View>
      )}

      {decision && (
        <View style={styles.decisionBox}>
          <Text style={styles.decisionText}>
            {decision === "accepted"
              ? "Recommendation accepted. Your preference has been recorded."
              : decision === "rejected"
                ? "Recommendation rejected. Your preference has been recorded."
                : "Recommendation recorded."}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DCE8F5",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "#52708F",
    marginBottom: 6,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#102A43",
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#627D98",
    marginTop: 8,
  },

  confidenceBadge: {
    alignItems: "flex-end",
  },

  confidenceText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1769AA",
  },

  confidenceLabel: {
    fontSize: 10,
    color: "#829AB1",
    marginTop: 2,
  },

  actionBox: {
    backgroundColor: "#F0F7FF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  actionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#52708F",
    marginBottom: 6,
  },

  action: {
    fontSize: 23,
    fontWeight: "700",
    color: "#0B5CAD",
    marginBottom: 8,
  },

  explanation: {
    fontSize: 13,
    lineHeight: 20,
    color: "#486581",
  },

  metricsRow: {
    flexDirection: "row",
    marginBottom: 18,
  },

  metric: {
    flex: 1,
  },

  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#102A43",
  },

  metricLabel: {
    fontSize: 10,
    color: "#829AB1",
    marginTop: 3,
  },

  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: "#E8F0F7",
  },

  profileLabel: {
    fontSize: 13,
    color: "#486581",
  },

  profileValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1769AA",
  },

  modeBox: {
    backgroundColor: "#F7FAFC",
    borderRadius: 14,
    padding: 13,
    marginTop: 4,
  },

  modeTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#243B53",
    marginBottom: 4,
  },

  modeText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#627D98",
  },

  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  rejectButton: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#BCCCDC",
  },

  acceptButton: {
    backgroundColor: "#1769AA",
  },

  rejectButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#486581",
  },

  acceptButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  decisionBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#EAF4FF",
  },

  decisionText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#175B8A",
  },
});
