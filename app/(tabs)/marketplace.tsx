
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '@/styles/commonStyles';
import { EquipmentListing, EquipmentFilters } from '@/types/equipment';
import { IconSymbol } from '@/components/IconSymbol';
import { storage } from '@/utils/storage';
import * as ImagePicker from 'expo-image-picker';

export default function MarketplaceScreen() {
  const [listings, setListings] = useState<EquipmentListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<EquipmentListing[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingListing, setEditingListing] = useState<EquipmentListing | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EquipmentFilters>({
    searchQuery: '',
    sortBy: 'date-new',
  });

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, filters]);

  const loadListings = async () => {
    const loadedListings = await storage.getEquipmentListings();
    setListings(loadedListings);
  };

  const saveListings = async (newListings: EquipmentListing[]) => {
    await storage.saveEquipmentListings(newListings);
    setListings(newListings);
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (listing) =>
          listing.name.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.location.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter((listing) => listing.category === filters.category);
    }

    // Condition filter
    if (filters.condition) {
      filtered = filtered.filter((listing) => listing.condition === filters.condition);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'date-new':
        filtered.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
        break;
      case 'date-old':
        filtered.sort((a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime());
        break;
    }

    setFilteredListings(filtered);
  };

  const addListing = (listing: Omit<EquipmentListing, 'id' | 'dateCreated'>) => {
    const newListing: EquipmentListing = {
      ...listing,
      id: Date.now().toString(),
      dateCreated: new Date().toISOString(),
    };
    const newListings = [...listings, newListing];
    saveListings(newListings);
    setShowAddModal(false);
  };

  const updateListing = (listing: EquipmentListing) => {
    const newListings = listings.map((l) => (l.id === listing.id ? listing : l));
    saveListings(newListings);
    setEditingListing(null);
  };

  const deleteListing = (listingId: string) => {
    console.log('deleteListing called with id:', listingId);

    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
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
              console.log('Delete confirmed for listing:', listingId);
              const newListings = listings.filter((l) => l.id !== listingId);
              await saveListings(newListings);
              setEditingListing(null);
              console.log('Listing deleted successfully');
            } catch (error) {
              console.error('Error deleting listing:', error);
              Alert.alert('Error', 'Failed to delete listing');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      sortBy: 'date-new',
    });
  };

  const hasActiveFilters = filters.category || filters.condition || filters.searchQuery;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Marketplace</Text>
            <Text style={styles.headerSubtitle}>
              {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'}
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={32}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search equipment..."
            placeholderTextColor={colors.textSecondary}
            value={filters.searchQuery}
            onChangeText={(text) => setFilters({ ...filters, searchQuery: text })}
          />
          {filters.searchQuery ? (
            <TouchableOpacity onPress={() => setFilters({ ...filters, searchQuery: '' })}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterButton, showFilters && styles.filterButtonActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <IconSymbol
                ios_icon_name="slider.horizontal.3"
                android_material_icon_name="tune"
                size={16}
                color={showFilters ? colors.card : colors.text}
              />
              <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>
                Filters
              </Text>
            </TouchableOpacity>

            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
                <Text style={styles.clearFilterText}>Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {showFilters && (
          <View style={styles.filterPanel}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {[
                    { value: '', label: 'All' },
                    { value: 'tractors', label: 'Tractors' },
                    { value: 'implements', label: 'Implements' },
                    { value: 'tillage', label: 'Tillage' },
                    { value: 'planting', label: 'Planting' },
                    { value: 'harvesting', label: 'Harvesting' },
                    { value: 'irrigation', label: 'Irrigation' },
                    { value: 'tools', label: 'Tools' },
                    { value: 'other', label: 'Other' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        filters.category === option.value && styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setFilters({ ...filters, category: option.value || undefined })
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.category === option.value && styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Condition</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {[
                    { value: '', label: 'All' },
                    { value: 'new', label: 'New' },
                    { value: 'used-excellent', label: 'Excellent' },
                    { value: 'used-good', label: 'Good' },
                    { value: 'used-fair', label: 'Fair' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        filters.condition === option.value && styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setFilters({ ...filters, condition: option.value || undefined })
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.condition === option.value && styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {[
                    { value: 'date-new', label: 'Newest' },
                    { value: 'date-old', label: 'Oldest' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        filters.sortBy === option.value && styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setFilters({
                          ...filters,
                          sortBy: option.value as EquipmentFilters['sortBy'],
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.sortBy === option.value && styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.listingList}
        contentContainerStyle={styles.listingListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredListings.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="cart"
              android_material_icon_name="shopping-cart"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>
              {listings.length === 0 ? 'No Listings Yet' : 'No Results Found'}
            </Text>
            <Text style={styles.emptyStateText}>
              {listings.length === 0
                ? 'Be the first to list equipment for sale'
                : 'Try adjusting your filters or search terms'}
            </Text>
            {listings.length === 0 && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>List Equipment</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredListings.map((listing) => (
            <TouchableOpacity
              key={listing.id}
              style={styles.listingCard}
              onPress={() => setEditingListing(listing)}
            >
              <View style={styles.listingImageContainer}>
                {listing.images && listing.images.length > 0 ? (
                  <Image source={{ uri: listing.images[0] }} style={styles.listingImage} />
                ) : (
                  <View style={styles.listingImagePlaceholder}>
                    <IconSymbol
                      ios_icon_name="photo"
                      android_material_icon_name="image"
                      size={40}
                      color={colors.textSecondary}
                    />
                  </View>
                )}
                {listing.images && listing.images.length > 1 && (
                  <View style={styles.imageCountBadge}>
                    <IconSymbol
                      ios_icon_name="photo.stack"
                      android_material_icon_name="collections"
                      size={14}
                      color={colors.card}
                    />
                    <Text style={styles.imageCountText}>{listing.images.length}</Text>
                  </View>
                )}
              </View>

              <View style={styles.listingContent}>
                <View style={styles.listingHeader}>
                  <Text style={styles.listingName} numberOfLines={1}>
                    {listing.name}
                  </Text>
                  <Text style={styles.listingPrice}>${listing.price.toLocaleString()}</Text>
                </View>

                <Text style={styles.listingDescription} numberOfLines={2}>
                  {listing.description}
                </Text>

                <View style={styles.listingMeta}>
                  <View style={styles.listingBadges}>
                    <View
                      style={[
                        styles.conditionBadge,
                        { backgroundColor: getConditionColor(listing.condition) },
                      ]}
                    >
                      <Text style={styles.conditionBadgeText}>
                        {formatCondition(listing.condition)}
                      </Text>
                    </View>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {formatCategory(listing.category)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.listingLocation}>
                    <IconSymbol
                      ios_icon_name="location.fill"
                      android_material_icon_name="location-on"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.listingLocationText} numberOfLines={1}>
                      {listing.location}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <ListingFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addListing}
      />

      <ListingFormModal
        visible={editingListing !== null}
        listing={editingListing || undefined}
        onClose={() => setEditingListing(null)}
        onSave={updateListing}
        onDelete={deleteListing}
      />
    </SafeAreaView>
  );
}

function ListingFormModal({
  visible,
  listing,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  listing?: EquipmentListing;
  onClose: () => void;
  onSave: (listing: any) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<EquipmentListing['condition']>('used-good');
  const [category, setCategory] = useState<EquipmentListing['category']>('tools');
  const [location, setLocation] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (listing) {
      setName(listing.name);
      setDescription(listing.description);
      setPrice(listing.price.toString());
      setCondition(listing.condition);
      setCategory(listing.category);
      setLocation(listing.location);
      setContactInfo(listing.contactInfo);
      setImages(listing.images || []);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCondition('used-good');
      setCategory('tools');
      setLocation('');
      setContactInfo('');
      setImages([]);
    }
  }, [listing, visible]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photo library to upload images.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    console.log('pickImage called');
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - images.length,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newImages]);
        console.log('Images added:', newImages);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    console.log('takePhoto called');
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your camera to take photos.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImage = result.assets[0].uri;
        setImages([...images, newImage]);
        console.log('Photo taken:', newImage);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    console.log('removeImage called for index:', index);
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleSave = () => {
    if (!name || !description || !price || !location || !contactInfo) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const listingData = {
      ...(listing || {}),
      name,
      description,
      price: priceNum,
      condition,
      category,
      location,
      contactInfo,
      images,
    };

    onSave(listingData);
  };

  const handleDelete = () => {
    if (!listing || !onDelete) {
      console.log('No listing or onDelete function');
      return;
    }

    console.log('handleDelete called for listing:', listing.id);
    onDelete(listing.id);
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
          <Text style={styles.modalTitle}>
            {listing ? 'Edit Listing' : 'List Equipment'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="close"
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
        >
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Photos (Optional)</Text>
            <Text style={styles.formHint}>Add up to 5 photos of your equipment</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              <View style={styles.imageList}>
                {images.map((imageUri, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <IconSymbol
                        ios_icon_name="xmark.circle.fill"
                        android_material_icon_name="cancel"
                        size={24}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {images.length < 5 && (
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={showImageOptions}
                  >
                    <IconSymbol
                      ios_icon_name="camera.fill"
                      android_material_icon_name="add-a-photo"
                      size={32}
                      color={colors.primary}
                    />
                    <Text style={styles.addImageText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Equipment Name *</Text>
            <TextInput
              style={styles.formInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., John Deere 3025E Tractor"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the equipment, its features, and condition..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Price ($) *</Text>
            <TextInput
              style={styles.formInput}
              value={price}
              onChangeText={setPrice}
              placeholder="e.g., 15000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Condition *</Text>
            <View style={styles.typeSelector}>
              {[
                { value: 'new', label: 'New' },
                { value: 'used-excellent', label: 'Excellent' },
                { value: 'used-good', label: 'Good' },
                { value: 'used-fair', label: 'Fair' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.typeOption,
                    condition === c.value && styles.typeOptionActive,
                  ]}
                  onPress={() => setCondition(c.value as EquipmentListing['condition'])}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      condition === c.value && styles.typeOptionTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Category *</Text>
            <View style={styles.typeSelector}>
              {[
                { value: 'tractors', label: 'Tractors' },
                { value: 'implements', label: 'Implements' },
                { value: 'tillage', label: 'Tillage' },
                { value: 'planting', label: 'Planting' },
                { value: 'harvesting', label: 'Harvesting' },
                { value: 'irrigation', label: 'Irrigation' },
                { value: 'tools', label: 'Tools' },
                { value: 'other', label: 'Other' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.typeOption,
                    category === c.value && styles.typeOptionActive,
                  ]}
                  onPress={() => setCategory(c.value as EquipmentListing['category'])}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      category === c.value && styles.typeOptionTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Location *</Text>
            <TextInput
              style={styles.formInput}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Springfield, IL"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Contact Information *</Text>
            <TextInput
              style={styles.formInput}
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder="e.g., john@example.com or (555) 123-4567"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {listing ? 'Update Listing' : 'Create Listing'}
            </Text>
          </TouchableOpacity>

          {listing && onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete Listing</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function getConditionColor(condition: string): string {
  const colorMap: { [key: string]: string } = {
    new: colors.success,
    'used-excellent': '#4CAF50',
    'used-good': '#8FBC8F',
    'used-fair': '#FF9800',
  };
  return colorMap[condition] || colors.textSecondary;
}

function formatCondition(condition: string): string {
  const formatMap: { [key: string]: string } = {
    new: 'New',
    'used-excellent': 'Excellent',
    'used-good': 'Good',
    'used-fair': 'Fair',
  };
  return formatMap[condition] || condition;
}

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
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
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: colors.card,
  },
  clearFilterButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
  filterPanel: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  filterOptionTextActive: {
    color: colors.card,
  },
  listingList: {
    flex: 1,
  },
  listingListContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  listingCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  listingImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background,
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listingImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.highlight,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageCountText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
  listingContent: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listingName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  listingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  listingMeta: {
    gap: 8,
  },
  listingBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  listingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingLocationText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
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
  formHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
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
  imageScroll: {
    marginTop: 8,
  },
  imageList: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.highlight,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.highlight,
  },
  addImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
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
