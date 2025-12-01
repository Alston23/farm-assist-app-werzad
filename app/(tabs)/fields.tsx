
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Field, SoilHealthRecord, PestDiseaseRecord } from '@/types/crop';
import { IconSymbol } from '@/components/IconSymbol';
import { storage } from '@/utils/storage';
import { PlantingRecommendationEngine } from '@/utils/plantingRecommendations';
import { cropDatabase } from '@/data/cropDatabase';

export default function FieldsScreen() {
  const [fields, setFields] = useState<Field[]>([]);
  const [plantings, setPlantings] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedFieldForRecs, setSelectedFieldForRecs] = useState<Field | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedFields = await storage.getFields();
    const loadedPlantings = await storage.getPlantings();
    setFields(loadedFields);
    setPlantings(loadedPlantings);
  };

  const saveFields = async (newFields: Field[]) => {
    await storage.saveFields(newFields);
    setFields(newFields);
  };

  const addField = (field: Omit<Field, 'id'>) => {
    const newField: Field = {
      ...field,
      id: Date.now().toString(),
      soilHealthRecords: field.soilHealthRecords || [],
      pestDiseaseHistory: field.pestDiseaseHistory || [],
      currentPH: field.currentPH || 7.0,
      lastSoilTest: field.lastSoilTest || new Date().toISOString(),
    };
    const newFields = [...fields, newField];
    saveFields(newFields);
    setShowAddModal(false);
  };

  const updateField = (field: Field) => {
    const newFields = fields.map((f) => (f.id === field.id ? field : f));
    saveFields(newFields);
    setEditingField(null);
  };

  const deleteField = (fieldId: string) => {
    console.log('deleteField called with id:', fieldId);
    
    Alert.alert(
      'Delete Field',
      'Are you sure you want to delete this field? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Delete confirmed for field:', fieldId);
              const newFields = fields.filter((f) => f.id !== fieldId);
              await saveFields(newFields);
              setEditingField(null);
              console.log('Field deleted successfully');
            } catch (error) {
              console.error('Error deleting field:', error);
              Alert.alert('Error', 'Failed to delete field');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const showFieldRecommendations = (field: Field) => {
    setSelectedFieldForRecs(field);
    setShowRecommendations(true);
  };

  const totalArea = fields.reduce((sum, field) => sum + field.size, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Fields & Beds</Text>
          <Text style={styles.headerSubtitle}>
            {fields.length} fields • {totalArea.toLocaleString()} sq ft total
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add-circle"
            size={32}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.fieldList}
        contentContainerStyle={styles.fieldListContent}
        showsVerticalScrollIndicator={false}
      >
        {fields.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="square.grid.3x3"
              android_material_icon_name="grid-on"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>No Fields Yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first field or bed to start planning your crops
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>Add Field</Text>
            </TouchableOpacity>
          </View>
        ) : (
          fields.map((field) => (
            <View key={field.id} style={styles.fieldCard}>
              <TouchableOpacity
                onPress={() => setEditingField(field)}
              >
                <View style={styles.fieldCardHeader}>
                  <Text style={styles.fieldName}>{field.name}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(field.type) }]}>
                    <Text style={styles.typeBadgeText}>{field.type}</Text>
                  </View>
                </View>

                <View style={styles.fieldInfo}>
                  <View style={styles.fieldInfoItem}>
                    <IconSymbol
                      ios_icon_name="square.grid.3x3"
                      android_material_icon_name="grid-on"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.fieldInfoText}>{field.size} sq ft</Text>
                  </View>
                  <View style={styles.fieldInfoItem}>
                    <IconSymbol
                      ios_icon_name="drop.fill"
                      android_material_icon_name="water-drop"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.fieldInfoText}>{field.irrigationType}</Text>
                  </View>
                </View>

                {/* Soil Health Info */}
                <View style={styles.soilHealthSection}>
                  <View style={styles.soilHealthRow}>
                    <View style={styles.soilHealthItem}>
                      <Text style={styles.soilHealthLabel}>pH Level</Text>
                      <Text style={[styles.soilHealthValue, { color: getPhColor(field.currentPH) }]}>
                        {field.currentPH?.toFixed(1) || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.soilHealthItem}>
                      <Text style={styles.soilHealthLabel}>Last Test</Text>
                      <Text style={styles.soilHealthValue}>
                        {field.lastSoilTest ? new Date(field.lastSoilTest).toLocaleDateString() : 'Never'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Pest/Disease Alerts */}
                {field.pestDiseaseHistory && field.pestDiseaseHistory.filter(pd => !pd.resolved).length > 0 && (
                  <View style={styles.alertSection}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.triangle.fill"
                      android_material_icon_name="warning"
                      size={16}
                      color={colors.error}
                    />
                    <Text style={styles.alertText}>
                      {field.pestDiseaseHistory.filter(pd => !pd.resolved).length} active issue(s)
                    </Text>
                  </View>
                )}

                {field.notes && (
                  <Text style={styles.fieldNotes} numberOfLines={2}>
                    {field.notes}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Recommendations Button */}
              <TouchableOpacity
                style={styles.recommendationsButton}
                onPress={() => showFieldRecommendations(field)}
              >
                <IconSymbol
                  ios_icon_name="lightbulb.fill"
                  android_material_icon_name="lightbulb"
                  size={18}
                  color={colors.card}
                />
                <Text style={styles.recommendationsButtonText}>View Planting Recommendations</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <FieldFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addField}
      />

      <FieldFormModal
        visible={editingField !== null}
        field={editingField || undefined}
        onClose={() => setEditingField(null)}
        onSave={updateField}
        onDelete={deleteField}
      />

      <RecommendationsModal
        visible={showRecommendations}
        field={selectedFieldForRecs}
        plantings={plantings}
        onClose={() => {
          setShowRecommendations(false);
          setSelectedFieldForRecs(null);
        }}
      />
    </SafeAreaView>
  );
}

function FieldFormModal({
  visible,
  field,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  field?: Field;
  onClose: () => void;
  onSave: (field: any) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [type, setType] = useState<Field['type']>('bed');
  const [soilType, setSoilType] = useState('');
  const [irrigationType, setIrrigationType] = useState<Field['irrigationType']>('drip');
  const [notes, setNotes] = useState('');
  const [currentPH, setCurrentPH] = useState('7.0');
  const [showSoilHealth, setShowSoilHealth] = useState(false);
  const [showPestDisease, setShowPestDisease] = useState(false);

  useEffect(() => {
    if (field) {
      setName(field.name);
      setSize(field.size.toString());
      setType(field.type);
      setSoilType(field.soilType);
      setIrrigationType(field.irrigationType);
      setNotes(field.notes);
      setCurrentPH(field.currentPH?.toString() || '7.0');
    } else {
      setName('');
      setSize('');
      setType('bed');
      setSoilType('');
      setIrrigationType('drip');
      setNotes('');
      setCurrentPH('7.0');
    }
  }, [field, visible]);

  const handleSave = () => {
    if (!name || !size) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const ph = parseFloat(currentPH);
    if (isNaN(ph) || ph < 0 || ph > 14) {
      Alert.alert('Error', 'Please enter a valid pH level (0-14)');
      return;
    }

    const fieldData = {
      ...(field || {}),
      name,
      size: parseFloat(size),
      type,
      soilType,
      irrigationType,
      notes,
      currentPH: ph,
      lastSoilTest: field?.lastSoilTest || new Date().toISOString(),
      soilHealthRecords: field?.soilHealthRecords || [],
      pestDiseaseHistory: field?.pestDiseaseHistory || [],
    };

    onSave(fieldData);
  };

  const handleDelete = () => {
    if (!field || !onDelete) {
      console.log('No field or onDelete function');
      return;
    }

    console.log('handleDelete called for field:', field.id);
    onDelete(field.id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{field ? 'Edit Field' : 'Add Field'}</Text>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="close"
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Name *</Text>
            <TextInput
              style={styles.formInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., North Garden Bed"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Size (sq ft) *</Text>
            <TextInput
              style={styles.formInput}
              value={size}
              onChangeText={setSize}
              placeholder="e.g., 100"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Type</Text>
            <View style={styles.typeSelector}>
              {(['bed', 'field', 'greenhouse', 'container'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeOption, type === t && styles.typeOptionActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeOptionText, type === t && styles.typeOptionTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Soil Type</Text>
            <TextInput
              style={styles.formInput}
              value={soilType}
              onChangeText={setSoilType}
              placeholder="e.g., loamy, sandy"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Current pH Level *</Text>
            <TextInput
              style={styles.formInput}
              value={currentPH}
              onChangeText={setCurrentPH}
              placeholder="e.g., 6.5"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.formHint}>
              pH scale: 0-14 (7 is neutral, &lt;7 acidic, &gt;7 alkaline)
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Irrigation Type</Text>
            <View style={styles.typeSelector}>
              {(['drip', 'sprinkler', 'hand-water', 'rain-fed'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeOption, irrigationType === t && styles.typeOptionActive]}
                  onPress={() => setIrrigationType(t)}
                >
                  <Text style={[styles.typeOptionText, irrigationType === t && styles.typeOptionTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          {field && (
            <>
              <TouchableOpacity
                style={styles.sectionButton}
                onPress={() => setShowSoilHealth(!showSoilHealth)}
              >
                <Text style={styles.sectionButtonText}>Soil Health Records</Text>
                <IconSymbol
                  ios_icon_name={showSoilHealth ? 'chevron.up' : 'chevron.down'}
                  android_material_icon_name={showSoilHealth ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sectionButton}
                onPress={() => setShowPestDisease(!showPestDisease)}
              >
                <Text style={styles.sectionButtonText}>Pest & Disease History</Text>
                <IconSymbol
                  ios_icon_name={showPestDisease ? 'chevron.up' : 'chevron.down'}
                  android_material_icon_name={showPestDisease ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{field ? 'Update Field' : 'Add Field'}</Text>
          </TouchableOpacity>

          {field && onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Field</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function RecommendationsModal({
  visible,
  field,
  plantings,
  onClose,
}: {
  visible: boolean;
  field: Field | null;
  plantings: any[];
  onClose: () => void;
}) {
  if (!field) return null;

  const recommendations = PlantingRecommendationEngine.getRecommendations(field, plantings);
  const cropsToAvoid = PlantingRecommendationEngine.getCropsToAvoid(field, plantings);
  const resistantAlternatives = PlantingRecommendationEngine.getResistantAlternatives(field);

  const topRecommendations = recommendations.slice(0, 10);
  const highRiskCrops = cropsToAvoid.filter(c => c.riskLevel === 'high');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Planting Recommendations</Text>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="close"
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
          <Text style={styles.fieldNameHeader}>{field.name}</Text>
          <Text style={styles.fieldInfoHeader}>
            pH: {field.currentPH.toFixed(1)} • {field.soilType}
          </Text>

          {/* Resistant Alternatives (if there are active issues) */}
          {resistantAlternatives.length > 0 && (
            <View style={styles.recommendationSection}>
              <View style={styles.sectionHeaderRow}>
                <IconSymbol
                  ios_icon_name="shield.fill"
                  android_material_icon_name="shield"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.sectionTitle}>Resistant Alternatives</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                These crops are not susceptible to current field issues
              </Text>
              {resistantAlternatives.slice(0, 5).map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <View style={styles.recHeader}>
                    <Text style={styles.recCropName}>{rec.cropName}</Text>
                    <View style={[styles.scoreBadge, { backgroundColor: colors.success }]}>
                      <Text style={styles.scoreBadgeText}>{rec.score}</Text>
                    </View>
                  </View>
                  {rec.benefits.map((benefit, i) => (
                    <Text key={i} style={styles.recBenefit}>✓ {benefit}</Text>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Top Recommendations */}
          <View style={styles.recommendationSection}>
            <View style={styles.sectionHeaderRow}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>Top Recommendations</Text>
            </View>
            {topRecommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationCard}>
                <View style={styles.recHeader}>
                  <Text style={styles.recCropName}>{rec.cropName}</Text>
                  <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(rec.score) }]}>
                    <Text style={styles.scoreBadgeText}>{rec.score}</Text>
                  </View>
                </View>
                {rec.reasons.map((reason, i) => (
                  <Text key={i} style={styles.recReason}>• {reason}</Text>
                ))}
                {rec.benefits.map((benefit, i) => (
                  <Text key={i} style={styles.recBenefit}>✓ {benefit}</Text>
                ))}
                {rec.warnings.map((warning, i) => (
                  <Text key={i} style={styles.recWarning}>⚠️ {warning}</Text>
                ))}
              </View>
            ))}
          </View>

          {/* Crops to Avoid */}
          {highRiskCrops.length > 0 && (
            <View style={styles.recommendationSection}>
              <View style={styles.sectionHeaderRow}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={20}
                  color={colors.error}
                />
                <Text style={styles.sectionTitle}>Crops to Avoid</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                High risk due to pest/disease history or soil conditions
              </Text>
              {highRiskCrops.map((crop, index) => (
                <View key={index} style={styles.avoidCard}>
                  <View style={styles.avoidHeader}>
                    <Text style={styles.avoidCropName}>{crop.cropName}</Text>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(crop.riskLevel) }]}>
                      <Text style={styles.riskBadgeText}>{crop.riskLevel.toUpperCase()}</Text>
                    </View>
                  </View>
                  {crop.reasons.map((reason, i) => (
                    <Text key={i} style={styles.avoidReason}>• {reason}</Text>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function getTypeColor(type: string): string {
  const colors_map: { [key: string]: string } = {
    bed: '#6B8E23',
    field: '#8FBC8F',
    greenhouse: '#4ECDC4',
    container: '#FFB6C1',
  };
  return colors_map[type] || colors.primary;
}

function getPhColor(ph: number): string {
  if (ph < 6.0) return '#FF6B6B'; // Too acidic
  if (ph > 7.5) return '#4ECDC4'; // Too alkaline
  return '#51CF66'; // Good range
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#51CF66'; // Green
  if (score >= 60) return '#FFD93D'; // Yellow
  return '#FF6B6B'; // Red
}

function getRiskColor(risk: string): string {
  if (risk === 'high') return '#FF6B6B';
  if (risk === 'medium') return '#FFD93D';
  return '#51CF66';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    padding: 4,
  },
  fieldList: {
    flex: 1,
  },
  fieldListContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  fieldCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  fieldCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
    textTransform: 'capitalize',
  },
  fieldInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  fieldInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fieldInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  soilHealthSection: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  soilHealthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  soilHealthItem: {
    flex: 1,
  },
  soilHealthLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  soilHealthValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  alertSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '500',
  },
  fieldNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  recommendationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  recommendationsButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 40,
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
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingVertical: 8,
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
  sectionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
  deleteButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  fieldNameHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  fieldInfoHeader: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  recommendationSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recCropName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.card,
  },
  recReason: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 2,
  },
  recBenefit: {
    fontSize: 13,
    color: '#51CF66',
    marginBottom: 2,
  },
  recWarning: {
    fontSize: 13,
    color: '#FFD93D',
    marginBottom: 2,
  },
  avoidCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  avoidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  avoidCropName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.card,
  },
  avoidReason: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 2,
  },
});
