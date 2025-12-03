// app/inventory.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import IconSymbol from "@/components/IconSymbol";
import { supabase } from "@/lib/supabase";
import { colors, commonStyles } from "@/styles/commonStyles";

type Counts = {
  fertilizers: number;
  seeds: number;
  packaging: number;
  storageLocations: number;
};

export default function InventoryScreen() {
  const router = useRouter();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setCounts(null);
          setLoading(false);
          return;
        }

        const [fertilizersRes, seedsRes, packagingRes, storageRes] =
          await Promise.all([
            supabase
              .from("fertilizers")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("seeds")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("packaging")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("storage_locations")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id),
          ]);

        setCounts({
          fertilizers: fertilizersRes.count ?? 0,
          seeds: seedsRes.count ?? 0,
          packaging: packagingRes.count ?? 0,
          storageLocations: storageRes.count ?? 0,
        });
      } catch (error) {
        console.error("Failed to load inventory counts", error);
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, []);

  const openFertilizers = () => router.push("/fertilizers");
  const openSeeds = () => router.push("/seeds");
  const openPackaging = () => router.push("/packaging");
  const openStorageLocations = () => router.push("/storage-locations");

  const renderCard = (
    title: string,
    subtitle: string,
    count: number | undefined,
    onPress: () => void,
    iconNames: { ios: string; android: string }
  ) => (
    <TouchableOpacity
      key={title}
      style={[commonStyles.card, styles.card]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.cardIcon}>
        <IconSymbol
          ios_icon_name={iconNames.ios}
          android_material_icon_name={iconNames.android}
          size={28}
          color={colors.text}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count ?? 0}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!loading && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCard(
            "Fertilizers",
            "All fertilizer products",
            counts?.fertilizers,
            openFertilizers,
            { ios: "leaf", android: "grass" }
          )}

          {renderCard(
            "Seeds",
            "Seed inventory",
            counts?.seeds,
            openSeeds,
            { ios: "leaf.circle", android: "spa" }
          )}

          {renderCard(
            "Packaging",
            "Boxes, bags, containers",
            counts?.packaging,
            openPackaging,
            { ios: "shippingbox", android: "inventory_2" }
          )}

          {renderCard(
            "Storage Locations",
            "Barns, coolers, rooms",
            counts?.storageLocations,
            openStorageLocations,
            { ios: "location", android: "location_on" }
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  badge: {
    minWidth: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
