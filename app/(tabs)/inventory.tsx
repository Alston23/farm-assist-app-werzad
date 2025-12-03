import React, { useEffect, useState } from "react";

import {

  View,

  Text,

  StyleSheet,

  ScrollView,

  TouchableOpacity,

  Platform,

  ActivityIndicator,

} from "react-native";

import { colors, commonStyles } from "@/styles/commonStyles";

import { IconSymbol } from "@/components/IconSymbol";

import { useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";



type CountsState = {

  fertilizers: number;

  seeds: number;

  packaging: number;

  storageLocations: number;

};



export default function InventoryScreen() {

  const [loading, setLoading] = useState(true);

  const [counts, setCounts] = useState<CountsState>({

    fertilizers: 0,

    seeds: 0,

    packaging: 0,

    storageLocations: 0,

  });



  const router = useRouter();



  useEffect(() => {

    loadCounts();

  }, []);



  const loadCounts = async () => {

    setLoading(true);

    try {

      const {

        data: { user },

      } = await supabase.auth.getUser();



      if (!user) {

        console.log("No user found");

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

        fertilizers: fertilizersRes.count || 0,

        seeds: seedsRes.count || 0,

        packaging: packagingRes.count || 0,

        storageLocations: storageRes.count || 0,

      });

    } catch (error) {

      console.error("Error loading counts:", error);

    } finally {

      setLoading(false);

    }

  };



  const handleOpenFertilizers = () => {

    router.push("/fertilizers");

  };



  const handleOpenSeeds = () => {

    router.push("/seeds");

  };



  const handleOpenPackaging = () => {

    router.push("/packaging");

  };



  const handleOpenStorageLocations = () => {

    router.push("/storage-locations");

  };



  const handleRecordUsage = () => {

    router.push("/record-usage");

  };



  const handleAddHarvest = () => {

    router.push("/add-harvest");

  };



  const handleRecordSale = () => {

    router.push("/record-sale");

  };



  const handleViewReports = () => {

    router.push("/reports");

  };



  return (

    <View style={commonStyles.container}>

      <ScrollView

        style={styles.scrollView}

        contentContainerStyle={styles.scrollContent}

        showsVerticalScrollIndicator={false}

      >

        {/* Header */}

        <View style={styles.header}>

          <Text style={styles.headerTitle}>Inventory TEST</Text>

          <Text style={styles.headerSubtitle}>

            Track your farm supplies and storage

          </Text>

        </View>



        {/* Storage Management */}

        <View style={[commonStyles.card, styles.storageCard]}>

          <View style={styles.storageHeader}>

            <IconSymbol

              ios_icon_name="archivebox.fill"

              android_material_icon_name="warehouse"

              size={28}

              color={colors.primary}

            />

            <Text style={styles.storageTitle}>Storage Management</Text>

          </View>

          <Text style={styles.storageSubtitle}>

            {counts.storageLocations} storage locations configured

          </Text>



          <TouchableOpacity

            style={styles.manageStorageButton}

            onPress={handleOpenStorageLocations}

          >

            <Text style={styles.manageStorageText}>

              Manage Storage Locations

            </Text>

            <IconSymbol

              ios_icon_name="chevron.right"

              android_material_icon_name="chevron_right"

              size={16}

              color={colors.primary}

            />

          </TouchableOpacity>

        </View>



        {/* Inventory Categories */}

        {loading ? (

          <View style={styles.loadingContainer}>

            <ActivityIndicator size="large" color={colors.primary} />

          </View>

        ) : (

          <View style={styles.categoriesContainer}>

            {/* Fertilizers */}

            <TouchableOpacity

              style={[commonStyles.card, styles.categoryCard]}

              onPress={handleOpenFertilizers}

            >

              <View

                style={[

                  styles.categoryIcon,

                  { backgroundColor: colors.primary + "20" },

                ]}

              >

                <IconSymbol

                  ios_icon_name="flask.fill"

                  android_material_icon_name="science"

                  size={32}

                  color={colors.primary}

                />

              </View>

              <View style={styles.categoryContent}>

                <Text style={styles.categoryTitle}>Fertilizers</Text>

                <Text style={styles.categoryCount}>

                  {counts.fertilizers}{" "}

                  {counts.fertilizers === 1 ? "item" : "items"}

                </Text>

              </View>

              <IconSymbol

                ios_icon_name="chevron.right"

                android_material_icon_name="chevron_right"

                size={24}

                color={colors.textSecondary}

              />

            </TouchableOpacity>



            {/* Seeds */}

            <TouchableOpacity

              style={[commonStyles.card, styles.categoryCard]}

              onPress={handleOpenSeeds}

            >

              <View

                style={[

                  styles.categoryIcon,

                  { backgroundColor: "#8FBC8F20" },

                ]}

              >

                <IconSymbol

                  ios_icon_name="leaf.fill"

                  android_material_icon_name="eco"

                  size={32}

                  color="#8FBC8F"

                />

              </View>

              <View style={styles.categoryContent}>

                <Text style={styles.categoryTitle}>Seeds</Text>

                <Text style={styles.categoryCount}>

                  {counts.seeds} {counts.seeds === 1 ? "item" : "items"}

                </Text>

              </View>

              <IconSymbol

                ios_icon_name="chevron.right"

                android_material_icon_name="chevron_right"

                size={24}

                color={colors.textSecondary}

              />

            </TouchableOpacity>



            {/* Packaging */}

            <TouchableOpacity

              style={[commonStyles.card, styles.categoryCard]}

              onPress={handleOpenPackaging}

            >

              <View

                style={[

                  styles.categoryIcon,

                  { backgroundColor: "#A0826D20" },

                ]}

              >

                <IconSymbol

                  ios_icon_name="shippingbox.fill"

                  android_material_icon_name="inventory_2"

                  size={32}

                  color="#A0826D"

                />

              </View>

              <View style={styles.categoryContent}>

                <Text style={styles.categoryTitle}>Packaging</Text>

                <Text style={styles.categoryCount}>

                  {counts.packaging}{" "}

                  {counts.packaging === 1 ? "item" : "items"}

                </Text>

              </View>

              <IconSymbol

                ios_icon_name="chevron.right"

                android_material_icon_name="chevron_right"

                size={24}

                color={colors.textSecondary}

              />

            </TouchableOpacity>

          </View>

        )}



        {/* Quick Actions */}

        <View style={styles.quickActions}>

          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>

            {/* Record Usage */}

            <TouchableOpacity

              style={styles.actionButton}

              onPress={handleRecordUsage}

            >

              <IconSymbol

                ios_icon_name="minus.circle.fill"

                android_material_icon_name="remove_circle"

                size={24}

                color={colors.primary}

              />

              <Text style={styles.actionText}>Record Usage</Text>

            </TouchableOpacity>



            {/* Add Harvest */}

            <TouchableOpacity

              style={styles.actionButton}

              onPress={handleAddHarvest}

            >

              <IconSymbol

                ios_icon_name="plus.circle.fill"

                android_material_icon_name="add_circle"

                size={24}

                color={colors.accent}

              />

              <Text style={styles.actionText}>Add Harvest</Text>

            </TouchableOpacity>



            {/* Record Sale */}

            <TouchableOpacity

              style={styles.actionButton}

              onPress={handleRecordSale}

            >

              <IconSymbol

                ios_icon_name="dollarsign.circle.fill"

                android_material_icon_name="sell"

                size={24}

                color={colors.success}

              />

              <Text style={styles.actionText}>Record Sale</Text>

            </TouchableOpacity>



            {/* View Reports */}

            <TouchableOpacity

              style={styles.actionButton}

              onPress={handleViewReports}

            >

              <IconSymbol

                ios_icon_name="chart.bar.fill"

                android_material_icon_name="bar_chart"

                size={24}

                color={colors.text}

              />

              <Text style={styles.actionText}>View Reports</Text>

            </TouchableOpacity>

          </View>

        </View>



        {/* Bottom padding for tab bar */}

        <View style={{ height: 100 }} />

      </ScrollView>

    </View>

  );

}



const styles = StyleSheet.create({

  scrollView: {

    flex: 1,

  },

  scrollContent: {

    padding: 16,

    paddingTop: Platform.OS === "android" ? 60 : 60,

  },

  header: {

    marginBottom: 24,

  },

  headerTitle: {

    fontSize: 32,

    fontWeight: "700",

    color: colors.text,

    marginBottom: 4,

  },

  headerSubtitle: {

    fontSize: 16,

    color: colors.textSecondary,

  },

  storageCard: {

    marginBottom: 24,

  },

  storageHeader: {

    flexDirection: "row",

    alignItems: "center",

    marginBottom: 8,

  },

  storageTitle: {

    fontSize: 20,

    fontWeight: "600",

    color: colors.text,

    marginLeft: 12,

  },

  storageSubtitle: {

    fontSize: 14,

    color: colors.textSecondary,

    marginBottom: 12,

  },

  manageStorageButton: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    paddingVertical: 8,

  },

  manageStorageText: {

    fontSize: 14,

    fontWeight: "600",

    color: colors.primary,

    marginRight: 4,

  },

  loadingContainer: {

    padding: 40,

    alignItems: "center",

  },

  categoriesContainer: {

    marginBottom: 24,

  },

  categoryCard: {

    flexDirection: "row",

    alignItems: "center",

    padding: 16,

    marginBottom: 12,

  },

  categoryIcon: {

    width: 60,

    height: 60,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",

    marginRight: 16,

  },

  categoryContent: {

    flex: 1,

  },

  categoryTitle: {

    fontSize: 18,

    fontWeight: "600",

    color: colors.text,

    marginBottom: 4,

  },

  categoryCount: {

    fontSize: 14,

    color: colors.textSecondary,

  },

  quickActions: {

    marginBottom: 24,

  },

  sectionTitle: {

    fontSize: 20,

    fontWeight: "600",

    color: colors.text,

    marginBottom: 16,

  },

  actionsGrid: {

    flexDirection: "row",

    flexWrap: "wrap",

    marginHorizontal: -6,

  },

  actionButton: {

    width: "48%",

    backgroundColor: colors.card,

    borderRadius: 12,

    padding: 16,

    alignItems: "center",

    marginHorizontal: "1%",

    marginBottom: 12,

    // tiny shadow

    shadowColor: "#000",

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.05,

    shadowRadius: 4,

    elevation: 2,

  },

  actionText: {

    fontSize: 14,

    fontWeight: "600",

    color: colors.text,

    marginTop: 8,

  },

});
