import { StyleSheet, Text, View } from "react-native";

import type { BatteryState } from "../../types/battery";

type IntelligenceStatusProps = {
  battery: BatteryState | null;

  isLoading: boolean;

  error: string | null;
};

export function IntelligenceStatus({
  battery,
  isLoading,
  error,
}: IntelligenceStatusProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.dot, styles.loadingDot]} />

        <Text style={styles.text}>Analysing device state...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.dot, styles.errorDot]} />

        <Text style={styles.text}>Intelligence unavailable</Text>
      </View>
    );
  }

  if (!battery) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.dot, styles.readyDot]} />

      <Text style={styles.text}>Live device intelligence active</Text>

      <Text style={styles.battery}>{battery.level}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 30,
    marginBottom: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  loadingDot: {
    backgroundColor: "#829AB1",
  },

  readyDot: {
    backgroundColor: "#2F855A",
  },

  errorDot: {
    backgroundColor: "#C53030",
  },

  text: {
    flex: 1,
    fontSize: 12,
    color: "#627D98",
  },

  battery: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1769AA",
  },
});
