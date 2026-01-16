
import { Tabs } from "expo-router";
import { IconSymbol } from "../../components/IconSymbol";

export default function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#2D5016',
        tabBarInactiveTintColor: '#888888',
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="house.fill" 
              android_material_icon_name="home" 
              size={size} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="crops" 
        options={{ 
          title: "Crops",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="leaf.fill" 
              android_material_icon_name="eco" 
              size={size} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="fields" 
        options={{ 
          title: "Fields",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="map.fill" 
              android_material_icon_name="map" 
              size={size} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="tasks" 
        options={{ 
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="checklist" 
              android_material_icon_name="check-circle" 
              size={size} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="ai-assistant" 
        options={{ 
          title: "AI Assistant",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="brain" 
              android_material_icon_name="psychology" 
              size={size} 
              color={color} 
            />
          ),
        }} 
      />
      
      {/* Hidden tabs - accessible but not shown in tab bar */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          href: null, // Hide from tab bar
        }} 
      />
      <Tabs.Screen 
        name="plantings" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="equipment" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="inventory" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="revenue" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="marketplace" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="marketplace-messages" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="ai-weather-insights" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="ai-problem-diagnosis" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="ai-crop-recommendations" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="ai-growing-tips" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="ai-personalized-advice" 
        options={{ 
          href: null,
        }} 
      />
    </Tabs>
  );
}
