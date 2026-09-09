import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  getCurrentBrightness,
  reduceBrightness,
  restoreBrightness,
} from "../device/brightness-controller";

export default function BrightnessTestScreen() {
  const [brightness, setBrightness] = useState<number | null>(null);
  const [originalBrightness, setOriginalBrightness] = useState<number | null>(
    null,
  );
  const [status, setStatus] = useState("Ready");

  async function readBrightness() {
    try {
      const value = await getCurrentBrightness();

      setBrightness(value);

      if (originalBrightness === null) {
        setOriginalBrightness(value);
      }

      setStatus("Brightness read successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function reduceScreenBrightness() {
    try {
      if (originalBrightness === null) {
        const current = await getCurrentBrightness();
        setOriginalBrightness(current);
      }

      const result = await reduceBrightness(0.2);

      setBrightness(result.after);

      setStatus(
        `Reduced from ${Math.round(
          result.before * 100,
        )}% to ${Math.round(result.after * 100)}%.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function restoreScreenBrightness() {
    try {
      if (originalBrightness === null) {
        setStatus("No original brightness value recorded.");
        return;
      }

      await restoreBrightness(originalBrightness);

      setBrightness(originalBrightness);
      setStatus(`Restored to ${Math.round(originalBrightness * 100)}%.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Brightness Intervention Test</Text>

      <Text style={styles.subtitle}>
        Physical-device validation of the Battery Intelligence intervention
        layer.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Current Brightness</Text>

        <Text style={styles.value}>
          {brightness === null ? "--" : `${Math.round(brightness * 100)}%`}
        </Text>
      </View>

      <Pressable style={styles.button} onPress={readBrightness}>
        <Text style={styles.buttonText}>Read Brightness</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={reduceScreenBrightness}>
        <Text style={styles.buttonText}>Reduce by 20%</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={restoreScreenBrightness}>
        <Text style={styles.buttonText}>Restore Original</Text>
      </Pressable>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Status</Text>

        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 70,
    backgroundColor: "#F7FAFF",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#102A43",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#627D98",
    marginBottom: 28,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    color: "#627D98",
    marginBottom: 8,
  },

  value: {
    fontSize: 42,
    fontWeight: "800",
    color: "#1565C0",
  },

  button: {
    backgroundColor: "#1565C0",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  statusCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 14,
    backgroundColor: "#EAF2FF",
  },

  statusLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#627D98",
    textTransform: "uppercase",
    marginBottom: 6,
  },

  status: {
    fontSize: 14,
    color: "#243B53",
    lineHeight: 20,
  },
});
