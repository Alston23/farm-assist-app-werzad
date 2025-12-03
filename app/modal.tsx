import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PackagingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Packaging Inventory</Text>

      <Text style={styles.placeholder}>
        This is where Packaging items will go.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },
  placeholder: {
    fontSize: 16,
    color: "#555",
  },
});

