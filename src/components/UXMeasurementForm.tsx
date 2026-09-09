import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useState } from "react";

import { UXRatingScale } from "./UXRatingScale";

import { createUXMeasurement } from "../experiments/ux-measurement";

import type { UXMeasurement, UXRating } from "../types/ux-measurement";

type Props = {
  onSubmit: (measurement: UXMeasurement) => void;

  onCancel?: () => void;
};

export function UXMeasurementForm({ onSubmit, onCancel }: Props) {
  const [visualImpact, setVisualImpact] = useState<UXRating>();

  const [audioImpact, setAudioImpact] = useState<UXRating>();

  const [interactionImpact, setInteractionImpact] = useState<UXRating>();

  const [responsivenessImpact, setResponsivenessImpact] = useState<UXRating>();

  const [overallImpact, setOverallImpact] = useState<UXRating>();

  const complete =
    visualImpact !== undefined &&
    audioImpact !== undefined &&
    interactionImpact !== undefined &&
    responsivenessImpact !== undefined &&
    overallImpact !== undefined;

  function handleSubmit() {
    if (!complete) {
      return;
    }

    const measurement = createUXMeasurement({
      visualImpact,
      audioImpact,
      interactionImpact,
      responsivenessImpact,
      overallImpact,
    });

    onSubmit(measurement);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TRIAL FEEDBACK</Text>

        <Text style={styles.title}>How did the intervention feel?</Text>

        <Text style={styles.description}>
          Rate the impact you experienced during the trial. There are no right
          or wrong answers.
        </Text>
      </View>

      <View style={styles.scaleCard}>
        <Text style={styles.scaleTitle}>Rating scale</Text>

        <Text style={styles.scaleDescription}>
          1 = no noticeable impact · 5 = highly disruptive
        </Text>
      </View>

      <UXRatingScale
        label="Visual impact"
        value={visualImpact}
        onChange={setVisualImpact}
      />

      <UXRatingScale
        label="Audio impact"
        value={audioImpact}
        onChange={setAudioImpact}
      />

      <UXRatingScale
        label="Interaction impact"
        value={interactionImpact}
        onChange={setInteractionImpact}
      />

      <UXRatingScale
        label="Responsiveness impact"
        value={responsivenessImpact}
        onChange={setResponsivenessImpact}
      />

      <UXRatingScale
        label="Overall UX impact"
        value={overallImpact}
        onChange={setOverallImpact}
      />

      <Pressable
        disabled={!complete}
        style={[styles.submitButton, !complete && styles.submitButtonDisabled]}
        onPress={handleSubmit}
      >
        <Text
          style={[styles.submitText, !complete && styles.submitTextDisabled]}
        >
          SAVE UX MEASUREMENT
        </Text>
      </Pressable>

      {onCancel && (
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 22,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#2563EB",
    marginBottom: 8,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#10213F",
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#68788D",
  },

  scaleCard: {
    backgroundColor: "#EEF5FF",
    borderRadius: 14,
    padding: 15,
    marginBottom: 24,
  },

  scaleTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#315A99",
    marginBottom: 4,
  },

  scaleDescription: {
    fontSize: 12,
    color: "#617796",
  },

  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },

  submitButtonDisabled: {
    backgroundColor: "#E1E7F0",
  },

  submitText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#FFFFFF",
  },

  submitTextDisabled: {
    color: "#97A4B5",
  },

  cancelButton: {
    alignItems: "center",
    paddingVertical: 15,
  },

  cancelText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#748399",
  },
});
