import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { defaultPreferences } from "../data/default-preferences";
import { sampleBehaviour } from "../data/sample-behaviour";
import { useBatteryIntelligence } from "../hooks/use-battery-intelligence";
import { loadPreferences } from "../storage/preference-repository";
import type { AppCategory } from "../types/behaviour";
import type { InterventionAction } from "../types/intervention";
const CURRENT_APP = "Instagram";
const CURRENT_CATEGORY: AppCategory = "social";
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
function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}
export default function HomeScreen() {
  /* * Phase 22/23: * * The Home screen now consumes the runtime * intelligence pipeline. * * Battery: * live device battery state * * Behaviour: * current observation + existing profile * * Preferences: * persisted locally * * Recommendation: * lightweight outcome model + optimizer */ const {
    battery,
    recommendation,
    isLoading,
    error,
    decision,
    recordDecision,
  } = useBatteryIntelligence(CURRENT_APP, CURRENT_CATEGORY);
  /* * Persisted user preferences. */ const [preferences, setPreferences] =
    useState(defaultPreferences);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  /* * Load preferences when the screen starts. */ useEffect(() => {
    let isMounted = true;
    async function initializePreferences() {
      try {
        const storedPreferences = await loadPreferences();
        if (isMounted) {
          setPreferences(storedPreferences);
        }
      } catch (loadError) {
        console.error("Failed to load preferences:", loadError);
      } finally {
        if (isMounted) {
          setIsLoadingPreferences(false);
        }
      }
    }
    void initializePreferences();
    return () => {
      isMounted = false;
    };
  }, []);
  /* * Reload preferences after the user makes * an explicit decision. */ useEffect(() => {
    if (decision !== "accepted" && decision !== "rejected") {
      return;
    }
    let isMounted = true;
    async function refreshPreferences() {
      try {
        const storedPreferences = await loadPreferences();
        if (isMounted) {
          setPreferences(storedPreferences);
        }
      } catch (refreshError) {
        console.error("Failed to refresh preferences:", refreshError);
      }
    }
    void refreshPreferences();
    return () => {
      isMounted = false;
    };
  }, [decision]);
  /* * Number of explicit user decisions recorded. * * This is deliberately NOT called model confidence. */ const totalFeedback =
    useMemo(() => {
      return Object.values(preferences).reduce(
        (total, preference) =>
          total + preference.accepted + preference.rejected,
        0,
      );
    }, [preferences]);
  /* * Phase-21 behaviour presentation is retained. * * We do not claim unrestricted cross-app * telemetry on iOS. * * The runtime intelligence layer itself is * connected to live battery/session state. */ const behaviour =
    {
      currentApp: sampleBehaviour.appName,
      sessionDuration: `${sampleBehaviour.sessionDurationMinutes} min`,
      interactionIntensity:
        sampleBehaviour.interactionIntensity.charAt(0).toUpperCase() +
        sampleBehaviour.interactionIntensity.slice(1),
      usualSession: `${sampleBehaviour.typicalSessionDurationMinutes} min`,
    };
  /* * Live battery level. */ const batteryLevel = battery?.level ?? 0;
  /* * Find the candidate selected by the optimizer. */ const selectedCandidate =
    recommendation?.candidates.find(
      (candidate) => candidate.action === recommendation.selectedAction,
    ) ?? null;
  /* * IMPORTANT: * * Recommendation confidence is the confidence * produced by the lightweight outcome predictor. * * It is NOT the same as profile confidence. */ const recommendationConfidence =
    selectedCandidate?.confidence ?? 0;
  /* * Profile confidence describes how much historical * behaviour data exists for this application. */ const profileConfidence =
    recommendation?.profileConfidence ?? 0;
  /* * Handle explicit user control. * * The runtime hook records the decision, * updates personalization and persists the event. */ const handleUserDecision =
    async (userDecision: "accepted" | "rejected") => {
      await recordDecision(userDecision);
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
            
            <Text style={styles.eyebrow}> BATTERY INTELLIGENCE </Text>
            <Text style={styles.title}> Your device </Text>
          </View>
          <View style={styles.statusContainer}>
            
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: error
                    ? "#C53030"
                    : isLoading
                      ? "#D69E2E"
                      : "#27AE60",
                },
              ]}
            />
            <Text style={styles.statusText}>
              
              {error ? "Error" : isLoading ? "Analysing" : "Active"}
            </Text>
          </View>
        </View>
        {/* Battery Card */}
        <View style={styles.batteryCard}>
          
          <View style={styles.batteryHeader}>
            
            <View>
              
              <Text style={styles.cardLabel}> BATTERY </Text>
              <Text style={styles.batteryValue}>
                
                {battery ? `${batteryLevel}%` : "--"}
              </Text>
            </View>
            <View style={styles.batteryIcon}>
              
              {battery && (
                <View
                  style={[
                    styles.batteryFill,
                    { width: `${Math.max(0, Math.min(100, batteryLevel))}%` },
                  ]}
                />
              )}
            </View>
          </View>
          <Text style={styles.batteryDescription}>
            
            {battery
              ? battery.isCharging
                ? "Device is charging. Battery-aware intelligence remains active."
                : battery.lowPowerMode
                  ? "Low Power Mode is active. Intelligence is adapting to current battery pressure."
                  : "Live battery-aware intelligence is active."
              : "Reading live device battery state..."}
          </Text>
        </View>
        {/* Current Behaviour */}
        <View style={styles.section}>
          
          <Text style={styles.sectionTitle}> Current behaviour </Text>
          <View style={styles.behaviourCard}>
            
            <View style={styles.appRow}>
              
              <View style={styles.appIcon}>
                
                <Text style={styles.appIconText}> IG </Text>
              </View>
              <View style={styles.appInfo}>
                
                <Text style={styles.appName}>
                  
                  {behaviour.currentApp}
                </Text>
                <Text style={styles.appSubtext}>
                  
                  Current application
                </Text>
              </View>
              <View style={styles.activeBadge}>
                
                <Text style={styles.activeText}> ACTIVE </Text>
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
          
          <Text style={styles.sectionTitle}> Intelligence </Text>
          <View style={styles.intelligenceCard}>
            
            <View style={styles.intelligenceHeader}>
              
              <View style={styles.brainCircle}>
                
                <Text style={styles.brainText}> AI </Text>
              </View>
              <View style={styles.intelligenceInfo}>
                
                <Text style={styles.intelligenceTitle}>
                  
                  Personal model
                </Text>
                <Text style={styles.intelligenceSubtext}>
                  
                  {isLoading
                    ? "Analysing current context"
                    : "Learning your usage patterns"}
                </Text>
              </View>
            </View>
            <View style={styles.learningBar}>
              
              <View
                style={[
                  styles.learningProgress,
                  { width: `${Math.round(recommendationConfidence * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.learningText}>
              
              Recommendation confidence:
              {recommendation
                ? formatPercentage(recommendationConfidence)
                : "Preparing"}
            </Text>
            <Text style={styles.feedbackText}>
              
              {totalFeedback === 0
                ? "No explicit user feedback recorded yet."
                : `${totalFeedback} user decision${totalFeedback === 1 ? "" : "s"} learned.`}
            </Text>
            <View style={styles.profileInfo}>
              
              <View>
                
                <Text style={styles.profileLabel}>
                  
                  Behaviour profile
                </Text>
                <Text style={styles.profileSubtext}>
                  
                  Historical personalization
                </Text>
              </View>
              <Text style={styles.profileValue}>
                
                {formatPercentage(profileConfidence)}
              </Text>
            </View>
            {recommendation && (
              <View style={styles.runtimeStatus}>
                
                <Text style={styles.runtimeStatusTitle}>
                  
                  Local intelligence active
                </Text>
                <Text style={styles.runtimeStatusText}>
                  
                  Battery state, behavioural signals, user preferences and
                  predicted intervention outcomes are combined locally.
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* Recommended Intervention */}
        <View style={styles.section}>
          
          <Text style={styles.sectionTitle}>
            
            Recommended intervention
          </Text>
          <View style={styles.interventionCard}>
            
            {error ? (
              <View style={styles.recommendationHeader}>
                
                <View style={styles.recommendationIcon}>
                  
                  <Text style={styles.recommendationIconText}> ! </Text>
                </View>
                <View style={styles.recommendationInfo}>
                  
                  <Text style={styles.recommendationTitle}>
                    
                    Intelligence unavailable
                  </Text>
                  <Text style={styles.recommendationReason}>
                    
                    {error}
                  </Text>
                </View>
              </View>
            ) : isLoading || !recommendation ? (
              <View style={styles.recommendationHeader}>
                
                <View style={styles.recommendationIcon}>
                  
                  <Text style={styles.recommendationIconText}> ... </Text>
                </View>
                <View style={styles.recommendationInfo}>
                  
                  <Text style={styles.recommendationTitle}>
                    
                    Analysing current context
                  </Text>
                  <Text style={styles.recommendationReason}>
                    
                    Battery and behavioural signals are being analysed
                    locally.
                  </Text>
                </View>
              </View>
            ) : (
              <>
                
                <View style={styles.recommendationHeader}>
                  
                  <View style={styles.recommendationIcon}>
                    
                    <Text style={styles.recommendationIconText}> ⚡ </Text>
                  </View>
                  <View style={styles.recommendationInfo}>
                    
                    <Text style={styles.recommendationTitle}>
                      
                      {formatInterventionAction(
                        recommendation.selectedAction,
                      )}
                    </Text>
                    <Text style={styles.recommendationReason}>
                      
                      {recommendation.explanation}
                    </Text>
                  </View>
                </View>
                <View style={styles.impactRow}>
                  
                  <Impact
                    label="Predicted saving"
                    value={
                      selectedCandidate
                        ? formatPercentage(
                            selectedCandidate.predictedEnergySaving,
                          )
                        : "0%"
                    }
                  />
                  <Impact
                    label="UX impact"
                    value={
                      selectedCandidate
                        ? formatUxImpact(selectedCandidate.predictedUXImpact)
                        : "None"
                    }
                  />
                  <Impact
                    label="Acceptance"
                    value={
                      selectedCandidate
                        ? formatPercentage(
                            selectedCandidate.predictedUserAcceptance,
                          )
                        : "0%"
                    }
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.controlBox}>
                  
                  <Text style={styles.controlQuestion}>
                    
                    The system recommends this action based on your current
                    battery and behavioural context. {"\n"} You remain in
                    control.
                  </Text>
                  <Text style={styles.executionModeText}>
                    
                    {selectedCandidate?.executionMode === "execute"
                      ? "This intervention can be executed automatically."
                      : selectedCandidate?.executionMode === "recommend"
                        ? "This intervention requires your explicit confirmation."
                        : "This intervention is not currently available for automatic execution."}
                  </Text>
                </View>
                {recommendation.selectedAction !== "no_action" && !decision && (
                  <View style={styles.actionRow}>
                    
                    <Pressable
                      style={styles.secondaryButton}
                      onPress={() => void handleUserDecision("rejected")}
                    >
                      
                      <Text style={styles.secondaryButtonText}>
                        
                        Reject
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.primaryButton}
                      onPress={() => void handleUserDecision("accepted")}
                    >
                      
                      <Text style={styles.primaryButtonText}> Allow </Text>
                    </Pressable>
                  </View>
                )}
                {decision && (
                  <View style={styles.decisionBox}>
                    
                    <Text style={styles.decisionText}>
                      
                      {decision === "accepted"
                        ? "Recommendation accepted. Your preference has been recorded locally."
                        : decision === "rejected"
                          ? "Recommendation rejected. Your preference has been recorded locally."
                          : "Recommendation recorded locally."}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
        {/* Research indicator */}
        <View style={styles.researchNote}>
          
          <Text style={styles.researchTitle}>
            
            PERSONALIZED ENERGY MANAGEMENT
          </Text>
          <Text style={styles.researchText}>
            
            Battery state, application behaviour, historical user preferences
            and predicted intervention outcomes are combined to select a
            potentially energy-efficient and least disruptive intervention.
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
      
      <Text style={styles.statLabel}> {label} </Text>
      <Text style={styles.statValue}> {value} </Text>
    </View>
  );
}
function Impact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.impact}>
      
      <Text style={styles.impactLabel}> {label} </Text>
      <Text style={styles.impactValue}> {value} </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FB" },
  container: { padding: 20, paddingBottom: 40 },
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
  title: { fontSize: 30, fontWeight: "700", color: "#102A43" },
  statusContainer: { flexDirection: "row", alignItems: "center", gap: 7 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#55708F" },
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
  batteryFill: { height: 22, backgroundColor: "#FFFFFF", borderRadius: 4 },
  batteryDescription: {
    color: "#C7D7E5",
    marginTop: 18,
    fontSize: 14,
    lineHeight: 20,
  },
  section: { marginBottom: 26 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16324F",
    marginBottom: 12,
  },
  behaviourCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18 },
  appRow: { flexDirection: "row", alignItems: "center" },
  appIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#E8F0F7",
    alignItems: "center",
    justifyContent: "center",
  },
  appIconText: { color: "#1F5A82", fontWeight: "800", fontSize: 13 },
  appInfo: { flex: 1, marginLeft: 12 },
  appName: { fontSize: 16, fontWeight: "700", color: "#16324F" },
  appSubtext: { fontSize: 12, color: "#8293A5", marginTop: 3 },
  activeBadge: {
    backgroundColor: "#E8F6EF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activeText: { color: "#27824A", fontSize: 9, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "#E9EEF3", marginVertical: 18 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { flex: 1 },
  statLabel: { fontSize: 11, color: "#8A9AAA", marginBottom: 5 },
  statValue: { fontSize: 13, fontWeight: "700", color: "#294B68" },
  intelligenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
  },
  intelligenceHeader: { flexDirection: "row", alignItems: "center" },
  brainCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E7F0F8",
    alignItems: "center",
    justifyContent: "center",
  },
  brainText: { fontSize: 13, fontWeight: "800", color: "#1D5A82" },
  intelligenceInfo: { marginLeft: 12 },
  intelligenceTitle: { fontSize: 16, fontWeight: "700", color: "#16324F" },
  intelligenceSubtext: { fontSize: 12, color: "#8293A5", marginTop: 3 },
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
  learningText: { marginTop: 9, fontSize: 11, color: "#7C8E9E" },
  feedbackText: { marginTop: 5, fontSize: 11, color: "#55708F" },
  profileInfo: {
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E9EEF3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileLabel: { fontSize: 12, fontWeight: "700", color: "#486581" },
  profileSubtext: { fontSize: 10, color: "#8293A5", marginTop: 3 },
  profileValue: { fontSize: 15, fontWeight: "700", color: "#2F6F9F" },
  runtimeStatus: {
    marginTop: 15,
    padding: 13,
    backgroundColor: "#F0F7FC",
    borderRadius: 14,
  },
  runtimeStatusTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#315E7E",
    marginBottom: 4,
  },
  runtimeStatusText: { fontSize: 11, lineHeight: 17, color: "#627D98" },
  interventionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
  },
  recommendationHeader: { flexDirection: "row", alignItems: "center" },
  recommendationIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EEF4F8",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendationIconText: { fontSize: 20 },
  recommendationInfo: { flex: 1, marginLeft: 12 },
  recommendationTitle: { fontSize: 15, fontWeight: "700", color: "#16324F" },
  recommendationReason: {
    fontSize: 11,
    lineHeight: 17,
    color: "#8293A5",
    marginTop: 4,
  },
  impactRow: { flexDirection: "row", marginTop: 18 },
  impact: { flex: 1 },
  impactLabel: { fontSize: 11, color: "#8A9AAA", marginBottom: 4 },
  impactValue: { fontSize: 14, fontWeight: "700", color: "#294B68" },
  controlBox: {
    backgroundColor: "#F7FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  controlQuestion: { fontSize: 13, lineHeight: 20, color: "#52697D" },
  executionModeText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#627D98",
    marginTop: 8,
  },
  actionRow: { flexDirection: "row", gap: 10 },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D4DEE7",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "700", color: "#52697D" },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    backgroundColor: "#1E5C85",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  decisionBox: {
    marginTop: 14,
    padding: 13,
    borderRadius: 13,
    backgroundColor: "#EAF4FF",
  },
  decisionText: { fontSize: 11, lineHeight: 17, color: "#315E7E" },
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
  researchText: { fontSize: 12, lineHeight: 18, color: "#5D7385" },
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
  persistenceText: { flex: 1, fontSize: 10, color: "#8293A5" },
});
