import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { defaultPreferences } from "../data/default-preferences";
import { sampleBattery } from "../data/sample-battery";
import { sampleBehaviour } from "../data/sample-behaviour";

import { selectIntervention } from "../intelligence/intervention-engine";
import { recordUserDecision } from "../intelligence/preference-engine";

import type { InterventionAction } from "../types/intervention";

import {
  loadPreferences,
  recordPreferenceDecision,
} from "../storage/preference-repository";

import { recordBehaviourObservation } from "../storage/behaviour-repository";
import { recordInterventionEvent } from "../storage/intervention-repository";

const batteryLevel = sampleBattery.level;

function formatInterventionAction(action: InterventionAction): string {
  const labels: Record<InterventionAction, string> = {
    reduce_brightness: "Reduce display brightness",
    reduce_haptics: "Reduce haptic feedback",
    reduce_audio: "Reduce audio level",
    limit_background_activity: "Limit background activity",
    no_action: "No intervention required",
  };

  return labels[action];
}

function formatUxImpact(value: number): string {
  if (value <= 0.15) {
    return "Very Low";
  }

  if (value <= 0.3) {
    return "Low";
  }

  return "Moderate";
}

export default function HomeScreen() {
  const [preferences, setPreferences] = useState(defaultPreferences);

  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  /*
   * Load persisted preferences when the app starts.
   */
  useEffect(() => {
    async function initializePreferences() {
      try {
        const storedPreferences = await loadPreferences();

        setPreferences(storedPreferences);
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsLoadingPreferences(false);
      }
    }

    initializePreferences();
  }, []);

  /*
   * Calculate the amount of historical user feedback.
   */
  const totalFeedback = Object.values(preferences).reduce(
    (total, preference) => total + preference.accepted + preference.rejected,
    0,
  );

  /*
   * Temporary UI learning indicator.
   *
   * This is NOT a statistical ML confidence score.
   */
  const modelConfidence = Math.min(95, 50 + totalFeedback * 5);

  /*
   * Current behaviour is still represented
   * by the sample profile.
   *
   * Later this will come from actual observations.
   */
  const behaviour = {
    currentApp: sampleBehaviour.appName,

    sessionDuration: `${sampleBehaviour.sessionDurationMinutes} min`,

    interactionIntensity:
      sampleBehaviour.interactionIntensity.charAt(0).toUpperCase() +
      sampleBehaviour.interactionIntensity.slice(1),

    usualSession: `${sampleBehaviour.typicalSessionDurationMinutes} min`,
  };

  /*
   * Core intervention decision.
   *
   * Battery state + behaviour +
   * learned preferences.
   */
  const intervention = selectIntervention(
    sampleBattery,
    sampleBehaviour,
    preferences,
  );

  /*
   * Store the current behaviour observation.
   *
   * This currently uses sampleBehaviour.
   * Later it will use real observations.
   */
  useEffect(() => {
    async function storeBehaviourObservation() {
      try {
        await recordBehaviourObservation(sampleBehaviour);
      } catch (error) {
        console.error("Failed to record behaviour observation:", error);
      }
    }

    storeBehaviourObservation();
  }, []);

  /*
   * Handle the user's response to the recommendation.
   *
   * This handler intentionally accepts only:
   * accepted | rejected
   *
   * because those are the only decisions currently
   * available from the UI.
   */
  const handleUserDecision = async (decision: "accepted" | "rejected") => {
    const action = intervention.action;

    if (action === "no_action") {
      return;
    }

    /*
     * Update the in-memory preference state.
     */
    const updatedPreferences = recordUserDecision(
      preferences,
      action,
      decision,
    );

    setPreferences(updatedPreferences);

    /*
     * Persist the learned preference.
     */
    try {
      await recordPreferenceDecision(action, decision);
    } catch (error) {
      console.error("Failed to persist preference decision:", error);
    }

    /*
     * Record the complete intervention event.
     */
    try {
      await recordInterventionEvent(sampleBattery, intervention, decision);
    } catch (error) {
      console.error("Failed to record intervention event:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>BATTERY INTELLIGENCE</Text>

            <Text style={styles.title}>Your device</Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              {isLoadingPreferences ? "Loading" : "Active"}
            </Text>
          </View>
        </View>

        {/* Battery Card */}
        <View style={styles.batteryCard}>
          <View style={styles.batteryHeader}>
            <View>
              <Text style={styles.cardLabel}>BATTERY</Text>

              <Text style={styles.batteryValue}>{batteryLevel}%</Text>
            </View>

            <View style={styles.batteryIcon}>
              <View
                style={[
                  styles.batteryFill,
                  {
                    width: `${batteryLevel}%`,
                  },
                ]}
              />
            </View>
          </View>

          <Text style={styles.batteryDescription}>
            Battery-aware intelligence is active.
          </Text>
        </View>

        {/* Current Behaviour */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current behaviour</Text>

          <View style={styles.behaviourCard}>
            <View style={styles.appRow}>
              <View style={styles.appIcon}>
                <Text style={styles.appIconText}>IG</Text>
              </View>

              <View style={styles.appInfo}>
                <Text style={styles.appName}>{behaviour.currentApp}</Text>

                <Text style={styles.appSubtext}>Current application</Text>
              </View>

              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <Stat label="Session" value={behaviour.sessionDuration} />

              <Stat label="Intensity" value={behaviour.interactionIntensity} />

              <Stat label="Typical" value={behaviour.usualSession} />
            </View>
          </View>
        </View>

        {/* Intelligence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intelligence</Text>

          <View style={styles.intelligenceCard}>
            <View style={styles.intelligenceHeader}>
              <View style={styles.brainCircle}>
                <Text style={styles.brainText}>AI</Text>
              </View>

              <View style={styles.intelligenceInfo}>
                <Text style={styles.intelligenceTitle}>Personal model</Text>

                <Text style={styles.intelligenceSubtext}>
                  Learning your usage patterns
                </Text>
              </View>
            </View>

            <View style={styles.learningBar}>
              <View
                style={[
                  styles.learningProgress,
                  {
                    width: `${modelConfidence}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.learningText}>
              Behaviour model confidence: {modelConfidence}%
            </Text>

            <Text style={styles.feedbackText}>
              {totalFeedback === 0
                ? "No user feedback recorded yet."
                : `${totalFeedback} user decision${
                    totalFeedback === 1 ? "" : "s"
                  } learned.`}
            </Text>
          </View>
        </View>

        {/* Intervention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended intervention</Text>

          <View style={styles.interventionCard}>
            <View style={styles.recommendationHeader}>
              <View style={styles.recommendationIcon}>
                <Text style={styles.recommendationIconText}>⚡</Text>
              </View>

              <View style={styles.recommendationInfo}>
                <Text style={styles.recommendationTitle}>
                  {formatInterventionAction(intervention.action)}
                </Text>

                <Text style={styles.recommendationReason}>
                  {intervention.reason}
                </Text>
              </View>
            </View>

            <View style={styles.impactRow}>
              <Impact
                label="Estimated saving"
                value={`${intervention.estimatedBatterySaving}%`}
              />

              <Impact
                label="UX impact"
                value={formatUxImpact(intervention.estimatedUXImpact)}
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.controlQuestion}>
              The system recommends this action.
              {"\n"}
              You remain in control.
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => handleUserDecision("rejected")}
              >
                <Text style={styles.secondaryButtonText}>Reject</Text>
              </Pressable>

              <Pressable
                style={styles.primaryButton}
                onPress={() => handleUserDecision("accepted")}
              >
                <Text style={styles.primaryButtonText}>Allow</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Research indicator */}
        <View style={styles.researchNote}>
          <Text style={styles.researchTitle}>
            PERSONALIZED ENERGY MANAGEMENT
          </Text>

          <Text style={styles.researchText}>
            Battery state, application behaviour and user preferences are
            combined to select the least disruptive intervention.
          </Text>
        </View>

        {/* Persistence status */}
        <View style={styles.persistenceNote}>
          <View style={styles.persistenceIndicator} />

          <Text style={styles.persistenceText}>
            {isLoadingPreferences
              ? "Loading persistent preferences..."
              : "Personalized preferences stored locally on device."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>

      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Impact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.impact}>
      <Text style={styles.impactLabel}>{label}</Text>

      <Text style={styles.impactValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#55708F",
    marginBottom: 5,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#102A43",
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#27AE60",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#55708F",
  },

  batteryCard: {
    backgroundColor: "#123B5D",
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },

  batteryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardLabel: {
    color: "#9DB7CC",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  batteryValue: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "700",
    marginTop: 2,
  },

  batteryIcon: {
    width: 90,
    height: 34,
    borderWidth: 2,
    borderColor: "#9DB7CC",
    borderRadius: 8,
    padding: 4,
    justifyContent: "center",
  },

  batteryFill: {
    height: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },

  batteryDescription: {
    color: "#C7D7E5",
    marginTop: 18,
    fontSize: 14,
  },

  section: {
    marginBottom: 26,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16324F",
    marginBottom: 12,
  },

  behaviourCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
  },

  appRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  appIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#E8F0F7",
    alignItems: "center",
    justifyContent: "center",
  },

  appIconText: {
    color: "#1F5A82",
    fontWeight: "800",
    fontSize: 13,
  },

  appInfo: {
    flex: 1,
    marginLeft: 12,
  },

  appName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16324F",
  },

  appSubtext: {
    fontSize: 12,
    color: "#8293A5",
    marginTop: 3,
  },

  activeBadge: {
    backgroundColor: "#E8F6EF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  activeText: {
    color: "#27824A",
    fontSize: 9,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "#E9EEF3",
    marginVertical: 18,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  stat: {
    flex: 1,
  },

  statLabel: {
    fontSize: 11,
    color: "#8A9AAA",
    marginBottom: 5,
  },

  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#294B68",
  },

  intelligenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
  },

  intelligenceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  brainCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E7F0F8",
    alignItems: "center",
    justifyContent: "center",
  },

  brainText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1D5A82",
  },

  intelligenceInfo: {
    marginLeft: 12,
  },

  intelligenceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16324F",
  },

  intelligenceSubtext: {
    fontSize: 12,
    color: "#8293A5",
    marginTop: 3,
  },

  learningBar: {
    height: 7,
    backgroundColor: "#E7EDF2",
    borderRadius: 4,
    marginTop: 18,
    overflow: "hidden",
  },

  learningProgress: {
    height: "100%",
    backgroundColor: "#2F6F9F",
    borderRadius: 4,
  },

  learningText: {
    marginTop: 9,
    fontSize: 11,
    color: "#7C8E9E",
  },

  feedbackText: {
    marginTop: 5,
    fontSize: 11,
    color: "#55708F",
  },

  interventionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
  },

  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  recommendationIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EEF4F8",
    alignItems: "center",
    justifyContent: "center",
  },

  recommendationIconText: {
    fontSize: 20,
  },

  recommendationInfo: {
    flex: 1,
    marginLeft: 12,
  },

  recommendationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#16324F",
  },

  recommendationReason: {
    fontSize: 11,
    color: "#8293A5",
    marginTop: 4,
  },

  impactRow: {
    flexDirection: "row",
    marginTop: 18,
  },

  impact: {
    flex: 1,
  },

  impactLabel: {
    fontSize: 11,
    color: "#8A9AAA",
    marginBottom: 4,
  },

  impactValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#294B68",
  },

  controlQuestion: {
    fontSize: 13,
    lineHeight: 20,
    color: "#52697D",
    marginBottom: 16,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D4DEE7",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#52697D",
  },

  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    backgroundColor: "#1E5C85",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  researchNote: {
    backgroundColor: "#EAF1F6",
    borderRadius: 18,
    padding: 18,
    marginTop: 2,
  },

  researchTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#42647E",
    marginBottom: 7,
  },

  researchText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#5D7385",
  },

  persistenceNote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 4,
  },

  persistenceIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2F6F9F",
    marginRight: 8,
  },

  persistenceText: {
    flex: 1,
    fontSize: 10,
    color: "#8293A5",
  },
});
