import { useCallback, useEffect, useRef, useState } from "react";

import type { AppCategory } from "../types/behaviour";

import type { Recommendation } from "../types/recommendation";

import type { BatteryState } from "../types/battery";

import { SessionObserver } from "../device/session-observer";

import { runRecommendationRuntime } from "../runtime/recommendation-runtime";

import { updatePersonalization } from "../intelligence/personalization-engine";

import { recordInterventionEvent } from "../storage/intervention-repository";

export type BatteryIntelligenceState = {
  battery: BatteryState | null;

  recommendation: Recommendation | null;

  isLoading: boolean;

  error: string | null;

  decision: "accepted" | "rejected" | "ignored" | null;
};

export function useBatteryIntelligence(appName: string, category: AppCategory) {
  const observerRef = useRef<SessionObserver | null>(null);

  const [state, setState] = useState<BatteryIntelligenceState>({
    battery: null,
    recommendation: null,
    isLoading: true,
    error: null,
    decision: null,
  });

  const initialize = useCallback(async () => {
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    try {
      if (!observerRef.current) {
        observerRef.current = new SessionObserver();
      }

      const result = await runRecommendationRuntime({
        appName,
        category,
        observer: observerRef.current,
      });

      setState({
        battery: result.battery,

        recommendation: result.recommendation,

        isLoading: false,

        error: null,

        decision: null,
      });
    } catch (error) {
      console.error("Battery Intelligence initialization failed:", error);

      setState((current) => ({
        ...current,

        isLoading: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to initialize Battery Intelligence.",
      }));
    }
  }, [appName, category]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const recordInteraction = useCallback(() => {
    observerRef.current?.recordInteraction();
  }, []);

  const recordAudioUsage = useCallback(() => {
    observerRef.current?.recordAudioUsage();
  }, []);

  const recordNetworkUsage = useCallback(() => {
    observerRef.current?.recordNetworkUsage();
  }, []);

  const recordHapticUsage = useCallback(() => {
    observerRef.current?.recordHapticUsage();
  }, []);

  const recordDecision = useCallback(
    async (decision: "accepted" | "rejected" | "ignored") => {
      const recommendation = state.recommendation;

      if (!recommendation) {
        return;
      }

      const action = recommendation.selectedAction;

      try {
        setState((current) => ({
          ...current,
          decision,
        }));

        if (decision === "accepted" || decision === "rejected") {
          await updatePersonalization(action, decision);
        }

        const battery = state.battery;

        const candidate = recommendation.candidates.find(
          (item) => item.action === action,
        );

        if (battery && candidate) {
          await recordInterventionEvent(
            battery,
            {
              action,

              estimatedBatterySaving: candidate.predictedEnergySaving,

              estimatedUXImpact: candidate.predictedUXImpact,

              confidence: candidate.confidence,

              reason: recommendation.explanation,
            },
            decision,
          );
        }
      } catch (error) {
        console.error("Failed to record intervention decision:", error);

        setState((current) => ({
          ...current,

          error:
            error instanceof Error
              ? error.message
              : "Unable to record intervention decision.",
        }));
      }
    },
    [state.battery, state.recommendation],
  );

  const refresh = useCallback(async () => {
    await initialize();
  }, [initialize]);

  return {
    battery: state.battery,

    recommendation: state.recommendation,

    isLoading: state.isLoading,

    error: state.error,

    decision: state.decision,

    recordInteraction,

    recordAudioUsage,

    recordNetworkUsage,

    recordHapticUsage,

    recordDecision,

    refresh,
  };
}
