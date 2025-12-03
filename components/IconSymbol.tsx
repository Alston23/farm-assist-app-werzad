import { Platform } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

type IconSymbolProps = {
  ios_icon_name: string;
  android_material_icon_name: string;
  size?: number;
  color?: string;
};

export default function IconSymbol({
  ios_icon_name,
  android_material_icon_name,
  size = 24,
  color = "black",
}: IconSymbolProps) {
  if (Platform.OS === "ios") {
    return <Ionicons name={ios_icon_name as any} size={size} color={color} />;
  } else {
    return (
      <MaterialIcons
        name={android_material_icon_name as any}
        size={size}
        color={color}
      />
    );
  }
}
