
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
import { Field } from '@/types/crop';
import { IconSymbol } from '@/components/IconSymbol';
import { storage } from '@/utils/storage';

export default function FieldsScreen() {
  const [fields, setFields] = useState<Field[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    const loadedFields = await storage.getFields();
    setFields(loadedFields);
  };

  const saveFields = async (newFields: Field[]) => {
    await storage.saveFields(newFields);
    setFields(newFields);
  };

  const addField = (field: Omit<Field, 'id'>) => {
    const newField: Field = {
      ...field,
      id: Date.now().toString(),
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
    const newFields = fields.filter((f) => f.id !== fieldId);
    saveFields(newFields);
    setEditingField(null);
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
            <TouchableOpacity
              key={field.id}
              style={styles.fieldCard}
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

              {field.notes && (
                <Text style={styles.fieldNotes} numberOfLines={2}>
                  {field.notes}
                </Text>
              )}
            </TouchableOpacity>
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

  useEffect(() => {
    if (field) {
      setName(field.name);
      setSize(field.size.toString());
      setType(field.type);
      setSoilType(field.soilType);
      setIrrigationType(field.irrigationType);
      setNotes(field.notes);
    } else {
      setName('');
      setSize('');
      setType('bed');
      setSoilType('');
      setIrrigationType('drip');
      setNotes('');
    }
  }, [field, visible]);

  const handleSave = () => {
    if (!name || !size) {
      Alert.alert('Error', 'Please fill in all required fields');
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
    };

    onSave(fieldData);
  };

  const handleDelete = () => {
    if (!field || !onDelete) {
      console.log('No field or onDelete function');
      return;
    }

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
          onPress: () => {
            console.log('Deleting field:', field.id);
            onDelete(field.id);
          },
        },
      ],
      { cancelable: true }
    );
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

function getTypeColor(type: string): string {
  const colors_map: { [key: string]: string } = {
    bed: '#6B8E23',
    field: '#8FBC8F',
    greenhouse: '#4ECDC4',
    container: '#FFB6C1',
  };
  return colors_map[type] || colors.primary;
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
    marginBottom: 8,
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
  fieldNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
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
});
