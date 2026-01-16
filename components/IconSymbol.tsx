
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

interface IconSymbolProps {
  ios_icon_name: string;
  android_material_icon_name: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  color?: string;
}

export function IconSymbol({ 
  ios_icon_name, 
  android_material_icon_name, 
  size = 24, 
  color = '#000' 
}: IconSymbolProps) {
  // Using Material Icons on all platforms for consistency
  return (
    <MaterialIcons 
      name={android_material_icon_name} 
      size={size} 
      color={color} 
    />
  );
}
