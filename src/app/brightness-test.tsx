import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
    getCurrentBrightness,
    restoreBrightness,
    setBrightness,
} from "../device/brightness-controller";

export default function BrightnessTestScreen() {
  const [currentBrightness, setCurrentBrightness] = useState<number | null>(
    null,
  );

  const [originalBrightness, setOriginalBrightness] = useState<number | null>(
    null,
  );

  const [status, setStatus] = useState("Ready");

  async function readBrightness() {
    try {
      const brightness = await getCurrentBrightness();

      setCurrentBrightness(brightness);

      setStatus(`Current brightness: ${Math.round(brightness * 100)}%`);
    } catch (error) {
      console.error(error);

      setStatus("Unable to read brightness.");
    }
  }

  async function reduceBrightnessForTest() {
    try {
      const brightness = await getCurrentBrightness();

      setOriginalBrightness(brightness);

      const reduced = Math.max(0, Math.min(1, brightness * 0.8));

      await setBrightness(reduced);

      setCurrentBrightness(reduced);

      setStatus(
        `Brightness reduced from ${Math.round(
          brightness * 100,
        )}% to ${Math.round(reduced * 100)}%.`,
      );
    } catch (error) {
      console.error(error);

      setStatus("Unable to reduce brightness.");
    }
  }

  async function restoreOriginalBrightness() {
    try {
      if (originalBrightness === null) {
        Alert.alert(
          "Nothing to restore",
          "No original brightness has been captured.",
        );

        return;
      }

      await restoreBrightness(originalBrightness);

      setCurrentBrightness(originalBrightness);

      setStatus(
        `Brightness restored to ${Math.round(originalBrightness * 100)}%.`,
      );
    } catch (error) {
      console.error(error);

      setStatus("Unable to restore brightness.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Brightness Intervention Test</Text>

      <Text style={styles.subtitle}>32.10H — Real iOS Intervention</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Current brightness</Text>

        <Text style={styles.value}>
          {currentBrightness === null
            ? "--"
            : `${Math.round(currentBrightness * 100)}%`}
        </Text>

        <Text style={styles.status}>{status}</Text>
      </View>

      <Pressable style={styles.button} onPress={readBrightness}>
        <Text style={styles.buttonText}>Read Brightness</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={reduceBrightnessForTest}>
        <Text style={styles.buttonText}>Reduce by 20%</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.restoreButton]}
        onPress={restoreOriginalBrightness}
      >
        <Text style={styles.buttonText}>Restore Original</Text>
      </Pressable>

      <Text style={styles.warning}>
        Test this on the physical iPhone. Do not use this screen during a
        research trial.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: "#F5F9FF",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#123A63",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#66819D",
  },

  card: {
    marginTop: 32,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  label: {
    fontSize: 14,
    color: "#66819D",
  },

  value: {
    marginTop: 8,
    fontSize: 42,
    fontWeight: "700",
    color: "#1769AA",
  },

  status: {
    marginTop: 12,
    fontSize: 14,
    color: "#42617D",
  },

  button: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#1769AA",
  },

  restoreButton: {
    backgroundColor: "#315B7D",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  warning: {
    marginTop: 24,
    fontSize: 13,
    lineHeight: 19,
    color: "#7A6A32",
  },
});
