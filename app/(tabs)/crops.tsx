
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { colors, commonStyles } from "@/styles/commonStyles";
import { cropDatabase } from "@/data/cropDatabase";
import type { Crop } from "@/types/crop";
import IconSymbol from "@/components/IconSymbol";
import { LogoutButton } from "@/components/LogoutButton";
// These two are kept for future use; they are safe even if unused for now
import { storage } from "@/utils/storage";
import { openAIService } from "@/utils/openaiService";

type CropItem = Crop & { id?: string; category?: string };

export default function CropsScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Start with whatever the crop database provides
  const allCrops: CropItem[] = (cropDatabase as CropItem[]) ?? [];

  // Build category list from database
  const categories = useMemo(() => {
    const set = new Set<string>();
    allCrops.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ["all", ...Array.from(set)];
  }, [allCrops]);

  const filteredCrops = useMemo(() => {
    let list = allCrops;

    if (selectedCategory !== "all") {
      list = list.filter((c) => c.category === selectedCategory);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name?.toLowerCase().includes(q));
    }

    return list;
  }, [allCrops, selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Crops</Text>
          <LogoutButton />
        </View>

        {/* Search */}
        <TextInput
          placeholder="Search crops..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.search}
        />

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
        >
          {categories.map((cat) => {
            const isActive = cat === selectedCategory;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  isActive && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && { color: "#fff", fontWeight: "600" },
                  ]}
                >
                  {cat === "all" ? "All" : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading indicator (not really used yet, but kept for future API calls) */}
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginTop: 16 }}
          />
        )}

        {/* Crops list */}
        <ScrollView
          style={{ flex: 1, marginTop: 8 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {filteredCrops.map((crop, index) => (
            <TouchableOpacity
              key={crop.id ?? `${crop.name}-${index}`}
              style={styles.card}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{crop.name}</Text>
                {crop.category ? (
                  <Text style={styles.cardSubtitle}>{crop.category}</Text>
                ) : null}
                {crop.notes ? (
                  <Text style={styles.cardNotes} numberOfLines={2}>
                    {crop.notes}
                  </Text>
                ) : null}
              </View>

              {/* Simple icon on the right so the card looks interactive */}
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          ))}

          {filteredCrops.length === 0 && !loading && (
            <Text style={styles.emptyText}>
              No crops match your search yet.
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background ?? "#fff",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text ?? "#000",
  },
  search: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text ?? "#000",
    marginBottom: 8,
  },
  chipRow: {
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e4e4e4",
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    color: colors.text ?? "#000",
  },
  card: {
    ...commonStyles.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    color: colors.text ?? "#000",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#777",
    marginBottom: 2,
  },
  cardNotes: {
    fontSize: 12,
    color: "#777",
  },
  emptyText: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 15,
    color: "#777",
  },
});
