import { Pressable, StyleSheet, Text, View } from "react-native";

import type { UXRating } from "../types/ux-measurement";

type Props = {
  label: string;
  value?: UXRating;
  onChange: (value: UXRating) => void;
};

const RATINGS: UXRating[] = [1, 2, 3, 4, 5];

export function UXRatingScale({ label, value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.scale}>
        {RATINGS.map((rating) => {
          const selected = value === rating;

          return (
            <Pressable
              key={rating}
              style={[styles.rating, selected && styles.ratingSelected]}
              onPress={() => onChange(rating)}
              accessibilityRole="button"
              accessibilityLabel={`${label}, rating ${rating}`}
            >
              <Text
                style={[
                  styles.ratingText,
                  selected && styles.ratingTextSelected,
                ]}
              >
                {rating}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>No impact</Text>

        <Text style={styles.scaleLabel}>Highly disruptive</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#263A57",
    marginBottom: 10,
  },

  scale: {
    flexDirection: "row",
    gap: 8,
  },

  rating: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5FA",
    borderWidth: 1,
    borderColor: "#DDE5EF",
  },

  ratingSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  ratingText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#52647B",
  },

  ratingTextSelected: {
    color: "#FFFFFF",
  },

  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },

  scaleLabel: {
    fontSize: 10,
    color: "#8794A6",
  },
});
