import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter, usePathname, Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "@/styles/commonStyles";

// Screen width for default sizing
const { width: screenWidth } = Dimensions.get("window");

// This is the type used in your main screen when you define the tabs array
export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

// Props for the FloatingTabBar component
interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  tabs,
  containerWidth = screenWidth - 32,
  borderRadius = 24,
  bottomMargin = 24,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
      <BlurView
        intensity={40}
        tint={Platform.OS === "ios" ? "systemChromeMaterial" : "default"}
        style={[
          styles.container,
          { width: containerWidth, borderRadius, marginBottom: bottomMargin },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.route;

          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => router.replace(tab.route)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={tab.icon}
                size={24}
                color={isActive ? colors.primary : "#666"}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </SafeAreaView>
  );
};

export default FloatingTabBar;

const styles = StyleSheet.create({
  safeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255,255,255,0.85)"
        : "rgba(30,30,30,0.9)",
    borderWidth: 1,
    borderColor:
      Platform.OS === "ios" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    flexDirection: "column",
    gap: 2,
  },
  tabButtonActive: {
    // you can add a little highlight if you want
  },
  tabLabel: {
    fontSize: 11,
    color: "#666",
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
});
