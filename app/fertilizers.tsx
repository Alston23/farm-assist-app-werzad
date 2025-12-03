
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";

type Unit = "bags" | "lbs";

type Fertilizer = {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
};

const POPULAR_FERTILIZERS: string[] = [
  "10-10-10 NPK",
  "20-20-20 NPK",
  "5-10-5 NPK",
  "15-15-15 NPK",
  "Urea (46-0-0)",
  "Ammonium Nitrate (34-0-0)",
  "Diammonium Phosphate (18-46-0)",
  "Monoammonium Phosphate (11-52-0)",
  "Potassium Chloride (0-0-60)",
  "Calcium Nitrate (15.5-0-0)",
  "Bone Meal",
  "Blood Meal",
  "Fish Emulsion",
  "Compost",
  "Manure",
  "Worm Castings",
];

export default function FertilizersScreen() {
  const router = useRouter();

  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Fertilizer | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("bags");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    loadFertilizers();
  }, []);

  const loadFertilizers = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        Alert.alert("Error", "User not found");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("fertilizers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Fertilizer[] = (data || []).map((row: any) => ({
        id: String(row.id),
        name: row.name,
        quantity: row.quantity ?? 0,
        unit: (row.unit as Unit) || "bags",
      }));

      setFertilizers(mapped);
    } catch (e: any) {
      console.error("loadFertilizers error", e);
      Alert.alert("Error", "Failed to load fertilizers");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item: Fertilizer | null) => {
    if (item) {
      setEditingItem(item);
      setEditName(item.name);
      setEditQuantity(String(item.quantity));
      setUnit(item.unit || "bags");
    } else {
      setEditingItem(null);
      setEditName("");
      setEditQuantity("");
      setUnit("bags");
    }
    setDropdownVisible(false);
    setModalVisible(true);
  };

  const saveFertilizer = async () => {
    const quantityNumber = Number(editQuantity || 0);

    if (!editName.trim()) {
      Alert.alert("Validation", "Please enter a fertilizer name.");
      return;
    }
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      Alert.alert("Validation", "Please enter a valid quantity.");
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        Alert.alert("Error", "User not found");
        return;
      }

      if (editingItem) {
        const { error } = await supabase
          .from("fertilizers")
          .update({
            name: editName.trim(),
            quantity: quantityNumber,
            unit,
          })
          .eq("id", editingItem.id)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("fertilizers").insert({
          name: editName.trim(),
          quantity: quantityNumber,
          unit,
          user_id: user.id,
        });

        if (error) throw error;
      }

      setModalVisible(false);
      await loadFertilizers();
    } catch (e: any) {
      console.error("saveFertilizer error", e);
      Alert.alert("Error", "Failed to save fertilizer");
    }
  };

  const deleteFertilizer = (id: string) => {
    Alert.alert("Delete fertilizer?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("Attempting to delete fertilizer with id:", id);
            
            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
              console.error("User error:", userError);
              throw userError;
            }
            if (!user) {
              Alert.alert("Error", "User not found");
              return;
            }

            console.log("User ID:", user.id);

            const { error } = await supabase
              .from("fertilizers")
              .delete()
              .eq("id", id)
              .eq("user_id", user.id);

            if (error) {
              console.error("Delete error:", error);
              throw error;
            }

            console.log("Delete successful");
            setFertilizers((prev) => prev.filter((f) => f.id !== id));
            Alert.alert("Success", "Fertilizer deleted successfully");
          } catch (e: any) {
            console.error("deleteFertilizer error", e);
            Alert.alert("Error", "Failed to delete fertilizer: " + (e.message || "Unknown error"));
          }
        },
      },
    ]);
  };

  const filteredFertilizers = fertilizers.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.title}>Fertilizers</Text>

        <TouchableOpacity
          onPress={() => openEditModal(null)}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Search fertilizers..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.search}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.text}
          style={{ marginTop: 20 }}
        />
      ) : (
        <ScrollView>
          {filteredFertilizers.map((item, index) => (
            <React.Fragment key={index}>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.cardContent}
                  activeOpacity={0.8}
                  onPress={() => openEditModal(item)}
                >
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    {item.quantity} {item.unit === "lbs" ? "lbs" : "bags"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.trashButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    console.log("Delete button pressed for item:", item.id);
                    deleteFertilizer(item.id);
                  }}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <IconSymbol
                    ios_icon_name="trash.fill"
                    android_material_icon_name="delete"
                    size={22}
                    color="#ff3b30"
                  />
                </TouchableOpacity>
              </View>
            </React.Fragment>
          ))}

          {filteredFertilizers.length === 0 && !loading && (
            <Text style={styles.emptyText}>
              No fertilizers yet. Tap the + button to add one.
            </Text>
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? "Edit Fertilizer" : "Add Fertilizer"}
            </Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setDropdownVisible((v) => !v)}
            >
              <Text style={styles.dropdownText}>
                {editName || "Choose common fertilizer..."}
              </Text>
              <IconSymbol
                ios_icon_name={dropdownVisible ? "chevron.up" : "chevron.down"}
                android_material_icon_name={
                  dropdownVisible
                    ? "keyboard_arrow_up"
                    : "keyboard_arrow_down"
                }
                size={18}
                color={colors.text}
              />
            </TouchableOpacity>

            {dropdownVisible && (
              <ScrollView style={styles.dropdownList}>
                {POPULAR_FERTILIZERS.map((name, idx) => (
                  <React.Fragment key={idx}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setEditName(name);
                        setDropdownVisible(false);
                      }}
                    >
                      <Text>{name}</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </ScrollView>
            )}

            <TextInput
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
              style={styles.modalInput}
            />

            <TextInput
              placeholder="Quantity"
              keyboardType="numeric"
              value={editQuantity}
              onChangeText={setEditQuantity}
              style={styles.modalInput}
            />

            <View style={styles.unitRow}>
              <Text style={styles.unitLabel}>Unit:</Text>
              <View style={styles.unitButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    unit === "bags" && styles.unitButtonActive,
                  ]}
                  onPress={() => setUnit("bags")}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      unit === "bags" && styles.unitButtonTextActive,
                    ]}
                  >
                    bags
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    unit === "lbs" && styles.unitButtonActive,
                  ]}
                  onPress={() => setUnit("lbs")}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      unit === "lbs" && styles.unitButtonTextActive,
                    ]}
                  >
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave]}
                onPress={saveFertilizer}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  search: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    marginBottom: 10,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  trashButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 24,
    color: "#666",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: colors.text,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    color: "#555",
  },
  dropdownList: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  unitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  unitLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  unitButtonsRow: {
    flexDirection: "row",
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: 13,
    color: "#555",
  },
  unitButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalCancel: {
    backgroundColor: "#eee",
  },
  modalSave: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 14,
  },
});
