
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { UserSettings } from '@/types/crop';
import { IconSymbol } from '@/components/IconSymbol';
import { storage } from '@/utils/storage';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings>({
    region: 'Zone 5a',
    farmSize: 5,
    farmType: 'small-farm',
    primarySalesChannel: 'farmers-market',
    measurementSystem: 'imperial',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await storage.getSettings();
    if (loadedSettings) {
      setSettings(loadedSettings);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    await storage.saveSettings(newSettings);
    setSettings(newSettings);
    Alert.alert('Success', 'Settings saved successfully!');
  };

  const handleSave = () => {
    saveSettings(settings);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Configure your farm details</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeCard}>
          <IconSymbol
            ios_icon_name="leaf.fill"
            android_material_icon_name="eco"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.welcomeTitle}>Welcome to FarmPlanner</Text>
          <Text style={styles.welcomeText}>
            Your comprehensive tool for managing small farms and homesteads. Track crops, manage
            fields, schedule tasks, and estimate revenue - all in one place.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farm Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Growing Region</Text>
            <TextInput
              style={styles.formInput}
              value={settings.region}
              onChangeText={(text) => setSettings({ ...settings, region: text })}
              placeholder="e.g., Zone 5a"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.formHint}>
              Your USDA hardiness zone or growing region
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Farm Size (acres)</Text>
            <TextInput
              style={styles.formInput}
              value={settings.farmSize.toString()}
              onChangeText={(text) =>
                setSettings({ ...settings, farmSize: parseFloat(text) || 0 })
              }
              placeholder="e.g., 5"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Farm Type</Text>
            <View style={styles.typeSelector}>
              {(['homestead', 'small-farm'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    settings.farmType === type && styles.typeOptionActive,
                  ]}
                  onPress={() => setSettings({ ...settings, farmType: type })}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      settings.farmType === type && styles.typeOptionTextActive,
                    ]}
                  >
                    {type === 'homestead' ? 'Homestead' : 'Small Farm'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Primary Sales Channel</Text>
            <View style={styles.typeSelector}>
              {(
                [
                  'self-sufficiency',
                  'roadside-stand',
                  'restaurant',
                  'csa',
                  'farmers-market',
                ] as const
              ).map((channel) => (
                <TouchableOpacity
                  key={channel}
                  style={[
                    styles.typeOption,
                    settings.primarySalesChannel === channel && styles.typeOptionActive,
                  ]}
                  onPress={() =>
                    setSettings({ ...settings, primarySalesChannel: channel })
                  }
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      settings.primarySalesChannel === channel &&
                        styles.typeOptionTextActive,
                    ]}
                  >
                    {channel.replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Measurement System</Text>
            <View style={styles.typeSelector}>
              {(['imperial', 'metric'] as const).map((system) => (
                <TouchableOpacity
                  key={system}
                  style={[
                    styles.typeOption,
                    settings.measurementSystem === system && styles.typeOptionActive,
                  ]}
                  onPress={() =>
                    setSettings({ ...settings, measurementSystem: system })
                  }
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      settings.measurementSystem === system &&
                        styles.typeOptionTextActive,
                    ]}
                  >
                    {system === 'imperial' ? 'Imperial (ft, lbs)' : 'Metric (m, kg)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureCard}>
            <IconSymbol
              ios_icon_name="leaf.fill"
              android_material_icon_name="eco"
              size={24}
              color={colors.primary}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Comprehensive Crop Database</Text>
              <Text style={styles.featureText}>
                Access detailed information on 40+ crops including vegetables, fruits, herbs,
                flowers, and aromatics.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <IconSymbol
              ios_icon_name="square.grid.3x3"
              android_material_icon_name="grid-on"
              size={24}
              color={colors.primary}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Field Management</Text>
              <Text style={styles.featureText}>
                Organize your fields, beds, greenhouses, and containers with detailed tracking.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={24}
              color={colors.primary}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Task Scheduling</Text>
              <Text style={styles.featureText}>
                Plan planting dates, track harvest windows, and organize farm tasks efficiently.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <IconSymbol
              ios_icon_name="dollarsign.circle"
              android_material_icon_name="attach-money"
              size={24}
              color={colors.primary}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Revenue Tracking</Text>
              <Text style={styles.featureText}>
                Estimate revenue, track costs, and calculate profit for each harvest.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monetization Options</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Freemium Model</Text>
            <Text style={styles.infoText}>
              - Free: Basic crop database, up to 5 fields, task management{'\n'}
              - Premium ($10/month): Unlimited fields, advanced analytics, export data,
              weather integration
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>One-Time Purchase</Text>
            <Text style={styles.infoText}>
              - $19.99 for lifetime access to all features{'\n'}
              - No recurring fees, perfect for small farms
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>In-App Purchases</Text>
            <Text style={styles.infoText}>
              - Regional crop packs ($2.99 each){'\n'}
              - Advanced planning tools ($4.99){'\n'}
              - Custom report templates ($1.99)
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline Support</Text>
          <View style={styles.infoCard}>
            <IconSymbol
              ios_icon_name="wifi.slash"
              android_material_icon_name="wifi-off"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              All data is stored locally on your device. The app works perfectly in low-service
              areas, making it ideal for rural farms and homesteads.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  formHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  typeOptionTextActive: {
    color: colors.card,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
