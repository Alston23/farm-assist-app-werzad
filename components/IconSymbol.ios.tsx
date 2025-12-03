
import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Map common icon names to correct SF Symbol names
const iconNameMap: Record<string, string> = {
  'chevron.left': 'chevron.backward',
  'chevron.right': 'chevron.forward',
  'chevron.up': 'chevron.up',
  'chevron.down': 'chevron.down',
};

export function IconSymbol({
  ios_icon_name,
  android_material_icon_name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  ios_icon_name: SymbolViewProps["name"];
  android_material_icon_name: any;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Map the icon name if needed
  const mappedIconName = iconNameMap[ios_icon_name as string] || ios_icon_name;

  // On iOS web or when SF Symbols might not be available, use Ionicons as fallback
  if (Platform.OS === 'web') {
    // Map Material Icons names to Ionicons names for web fallback
    const materialToIonicons: Record<string, string> = {
      'arrow_back': 'chevron-back',
      'arrow_forward': 'chevron-forward',
      'add': 'add',
      'close': 'close',
      'delete': 'trash',
      'edit': 'create',
      'search': 'search',
      'check': 'checkmark',
    };
    
    const ioniconsName = materialToIonicons[android_material_icon_name] || android_material_icon_name;
    return <Ionicons name={ioniconsName as any} size={size} color={color} />;
  }

  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={mappedIconName}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
