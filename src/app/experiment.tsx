import { StyleSheet, View } from "react-native";

import { ExperimentRunner } from "../components/ExperimentRunner";

import type { ExperimentalTrial } from "../types/trial";

const trial: ExperimentalTrial = {
  trialId: "manual-trial-001",

  system: "personalized",

  condition: "intervention",

  appName: "Instagram",

  startingBatteryLevel: 50,

  targetDurationMinutes: 20,

  status: "planned",

  allocation: {
    block: 1,
    repetition: 1,
    randomizedOrder: 1,
  },
};

export default function ExperimentScreen() {
  return (
    <View style={styles.container}>
      <ExperimentRunner trial={trial} category="social" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
