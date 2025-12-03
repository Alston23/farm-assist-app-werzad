
import { Platform } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

type IconSymbolProps = {
  ios_icon_name: string;
  android_material_icon_name: string;
  size?: number;
  color?: string;
};

// Map Material Icons names to Ionicons names
const materialToIonicons: Record<string, string> = {
  'arrow_back': 'chevron-back',
  'arrow_forward': 'chevron-forward',
  'add': 'add',
  'close': 'close',
  'delete': 'trash',
  'edit': 'create',
  'search': 'search',
  'check': 'checkmark',
  'check_circle': 'checkmark-circle',
  'info': 'information-circle',
  'warning': 'warning',
  'error': 'alert-circle',
  'settings': 'settings',
  'menu': 'menu',
  'more_vert': 'ellipsis-vertical',
  'more_horiz': 'ellipsis-horizontal',
  'home': 'home',
  'person': 'person',
  'notifications': 'notifications',
  'favorite': 'heart',
  'star': 'star',
  'share': 'share-social',
  'download': 'download',
  'upload': 'cloud-upload',
  'refresh': 'refresh',
  'visibility': 'eye',
  'visibility_off': 'eye-off',
  'lock': 'lock-closed',
  'lock_open': 'lock-open',
  'calendar_today': 'calendar',
  'schedule': 'time',
  'location_on': 'location',
  'phone': 'call',
  'email': 'mail',
  'attach_file': 'attach',
  'image': 'image',
  'camera': 'camera',
  'mic': 'mic',
  'videocam': 'videocam',
  'folder': 'folder',
  'description': 'document-text',
  'print': 'print',
  'save': 'save',
  'cloud': 'cloud',
  'cloud_download': 'cloud-download',
  'cloud_upload': 'cloud-upload',
  'inventory': 'cube',
  'inventory_2': 'albums',
  'warehouse': 'business',
  'agriculture': 'leaf',
  'sell': 'pricetag',
  'science': 'flask',
  'eco': 'leaf',
  'ac_unit': 'snow',
  'payments': 'cash',
  'credit_card': 'card',
  'smartphone': 'phone-portrait',
  'tag': 'pricetag',
  'keyboard_arrow_up': 'chevron-up',
  'keyboard_arrow_down': 'chevron-down',
};

export function IconSymbol({
  ios_icon_name,
  android_material_icon_name,
  size = 24,
  color = "black",
}: IconSymbolProps) {
  if (Platform.OS === "ios") {
    // On iOS web or when SF Symbols are not available, use Ionicons as fallback
    // Convert Material Icons name to Ionicons name
    const ioniconsName = materialToIonicons[android_material_icon_name] || android_material_icon_name;
    return <Ionicons name={ioniconsName as any} size={size} color={color} />;
  } else {
    // On Android, use MaterialIcons
    return (
      <MaterialIcons
        name={android_material_icon_name as any}
        size={size}
        color={color}
      />
    );
  }
}

export default IconSymbol;
