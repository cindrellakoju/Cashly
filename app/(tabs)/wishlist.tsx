import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useFinancial, WishlistItem } from '@/context/FinancialContext';
import { ThemeHeader } from '@/components/ThemeHeader';
import { AestheticModal } from '@/components/AestheticModal';
import { saveImageToPermanentStorage, resolveImageUrl } from '@/services/imageService';

const { width } = Dimensions.get('window');

const PRESET_WISHLIST_PHOTOS = [
  { id: 'phone', label: 'Phone', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80' },
  { id: 'laptop', label: 'Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80' },
  { id: 'car', label: 'Car', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&auto=format&fit=crop&q=80' },
  { id: 'headphones', label: 'Audio', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80' },
  { id: 'travel', label: 'Travel', url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&auto=format&fit=crop&q=80' },
  { id: 'watch', label: 'Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80' },
  { id: 'home', label: 'Home', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80' },
];

export default function WishlistScreen() {
  const { colors, theme, wishlist, addWishlistItem, toggleWishlistPurchased, deleteWishlistItem } = useFinancial();

  // Modals & Lightbox
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewImageItem, setPreviewImageItem] = useState<WishlistItem | null>(null);

  // Form states
  const [wishName, setWishName] = useState('');
  const [wishEmoji, setWishEmoji] = useState('📱');
  const [wishImageUrl, setWishImageUrl] = useState('');
  const [wishPriority, setWishPriority] = useState<'High Priority' | 'Med Priority' | 'Low Priority'>('High Priority');
  const [wishPrice, setWishPrice] = useState('');
  const [wishDate, setWishDate] = useState('December 2026');

  const priorities: { key: 'High Priority' | 'Med Priority' | 'Low Priority'; label: string; color: string }[] = [
    { key: 'High Priority', label: 'High Priority 🔴', color: colors.danger },
    { key: 'Med Priority', label: 'Med Priority 🟠', color: colors.warning },
    { key: 'Low Priority', label: 'Low Priority 🟢', color: colors.primaryGreen },
  ];

  const pickImageFromDevice = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Access Required',
          'To select product photos, please grant photo library access.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const savedUri = await saveImageToPermanentStorage(result.assets[0].uri);
        setWishImageUrl(savedUri);
      }
    } catch (err: any) {
      console.warn('Image picker error:', err);
      Alert.alert(
        'Photo Picker Notice',
        'Could not open photo gallery. Please choose a preset sample photo below.',
        [{ text: 'OK' }]
      );
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Access Required',
          'To capture photos for wishlist items, please grant camera access.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const savedUri = await saveImageToPermanentStorage(result.assets[0].uri);
        setWishImageUrl(savedUri);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      Alert.alert(
        'Camera Notice',
        'Could not launch camera. Please select a photo from your gallery or choose a preset sample product image below.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddWishlistSubmit = () => {
    const price = parseFloat(wishPrice);
    if (!wishName.trim() || isNaN(price) || price <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addWishlistItem({
      name: wishName.trim(),
      emoji: wishEmoji,
      priority: wishPriority,
      price,
      targetDate: wishDate.trim() || '2026',
      imageUrl: wishImageUrl.trim() || undefined,
    });
    setWishName('');
    setWishPrice('');
    setWishImageUrl('');
    setIsAddModalOpen(false);
  };

  const handleTogglePurchased = (id: string, currentlyPurchased?: boolean) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleWishlistPurchased(id);
  };

  const handleDelete = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`Remove Goal\n\nAre you sure you want to remove "${name}" from your wishlist?`);
      if (ok) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        deleteWishlistItem(id);
      }
      return;
    }

    Alert.alert('Remove Goal', `Are you sure you want to remove "${name}" from your wishlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteWishlistItem(id);
        },
      },
    ]);
  };

  const totalValue = wishlist.reduce((sum, item) => sum + item.price, 0);
  const purchasedCount = wishlist.filter((item) => item.isPurchased).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <ThemeHeader
        title="Wishlist & Dreams 🎁"
        subtitle="Track savings goals and milestones ✨"
        stickerKey="wishlist"
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsAddModalOpen(true)}
            style={[styles.headerAddBtn, { backgroundColor: colors.primaryAccent }]}
          >
            <Ionicons name="add" size={20} color={theme === 'kawaii' ? '#2c352d' : '#ffffff'} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {/* Summary Progress Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Wishlist Target</Text>
                <Text style={[styles.summaryTotal, { color: colors.textMain }]}>Rs. {totalValue.toLocaleString()}</Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: colors.primaryGreenLight }]}>
                <Text style={[styles.badgeText, { color: colors.primaryGreen }]}>
                  {purchasedCount} / {wishlist.length} Achieved 🎉
                </Text>
              </View>
            </View>
          </View>

          {/* Wishlist Items List */}
          {wishlist.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Your Wishlist is Empty!</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Add your dream gadgets, trips, and milestone purchases.
              </Text>
            </View>
          ) : (
            wishlist.map((item) => {
              const isHigh = item.priority === 'High Priority';
              const isMed = item.priority === 'Med Priority';
              const priorityBg = isHigh ? colors.dangerLight : isMed ? colors.warningLight : colors.primaryGreenLight;
              const priorityTextColor = isHigh ? colors.danger : isMed ? colors.warning : colors.primaryGreen;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.wishCard,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: item.isPurchased ? colors.primaryGreen : colors.borderSoft,
                      borderWidth: item.isPurchased ? 1.5 : 1,
                      opacity: item.isPurchased ? 0.85 : 1,
                      ...colors.cardShadow,
                    },
                  ]}
                >
                  <View style={styles.wishHeader}>
                    <View style={styles.itemTitleRow}>
                      {item.imageUrl ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onLongPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setPreviewImageItem(item);
                          }}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setPreviewImageItem(item);
                          }}
                        >
                          <Image
                            source={{ uri: resolveImageUrl(item.imageUrl) }}
                            style={{ width: 50, height: 50, borderRadius: 14, marginRight: 12 }}
                          />
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.itemEmojiWrap, { backgroundColor: colors.bgSecondary }]}>
                          <Text style={styles.itemEmoji}>{item.emoji}</Text>
                        </View>
                      )}
                      <View style={styles.itemInfo}>
                        <Text
                          style={[
                            styles.itemName,
                            { color: colors.textMain },
                            item.isPurchased && styles.strikethroughText,
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={[styles.itemDate, { color: colors.textMuted }]}>
                          Target: {item.targetDate}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.name)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.textSubtle} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.wishFooter}>
                    <View>
                      <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Target Price</Text>
                      <Text style={[styles.priceVal, { color: colors.textMain }]}>
                        Rs. {item.price.toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.footerActions}>
                      <View style={[styles.priorityBadge, { backgroundColor: priorityBg }]}>
                        <Text style={[styles.priorityBadgeText, { color: priorityTextColor }]}>
                          {item.priority.replace(' Priority', '')}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleTogglePurchased(item.id, item.isPurchased)}
                        style={[
                          styles.purchaseBtn,
                          {
                            backgroundColor: item.isPurchased ? colors.primaryGreen : colors.primaryAccent,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.purchaseBtnText,
                            {
                              color: item.isPurchased
                                ? '#ffffff'
                                : theme === 'kawaii'
                                  ? '#2c352d'
                                  : '#ffffff',
                            },
                          ]}
                        >
                          {item.isPurchased ? 'Purchased 🎉' : 'Mark Done ✨'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ===================== MODAL: ADD WISHLIST ITEM ===================== */}
      <AestheticModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add to Wishlist"
        subtitle="Set a new dream target or aspirational purchase"
        icon="🎁"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Item / Goal Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. iPhone 18 Pro, Trip to Tokyo"
            placeholderTextColor={colors.textSubtle}
            value={wishName}
            onChangeText={setWishName}
          />
        </View>

        {/* Product Image Selection */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Product Image 📸</Text>

          {/* Image Banner Card */}
          <View style={{ marginBottom: 10 }}>
            {wishImageUrl ? (
              <View style={{ position: 'relative', height: 130, borderRadius: 16, overflow: 'hidden' }}>
                <Image source={{ uri: resolveImageUrl(wishImageUrl) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => setWishImageUrl('')}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: 12,
                    padding: 6,
                  }}
                >
                  <Ionicons name="trash" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImageFromDevice}
                style={{
                  height: 100,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: colors.borderSoft,
                  borderStyle: 'dashed',
                  backgroundColor: colors.bgSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="image-outline" size={28} color={colors.primaryAccent} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>
                  + Tap to Pick Image from Device 📷
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Pick Photo & Camera Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TouchableOpacity
              onPress={pickImageFromDevice}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: colors.bgSecondary,
                borderWidth: 1,
                borderColor: colors.borderSoft,
              }}
            >
              <Ionicons name="images-outline" size={16} color={colors.primaryAccent} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMain }}>Choose Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takePhotoWithCamera}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: colors.bgSecondary,
                borderWidth: 1,
                borderColor: colors.borderSoft,
              }}
            >
              <Ionicons name="camera-outline" size={16} color={colors.primaryGreen} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMain }}>Take Photo 📸</Text>
            </TouchableOpacity>
          </View>

          {/* Preset Sample Photos Row */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 6 }}>
            Or pick a preset sample photo:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {PRESET_WISHLIST_PHOTOS.map((preset) => {
              const isSelected = wishImageUrl === preset.url;
              return (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => setWishImageUrl(preset.url)}
                  style={{
                    marginRight: 8,
                    borderRadius: 12,
                    borderWidth: isSelected ? 2.5 : 1,
                    borderColor: isSelected ? colors.primaryAccent : colors.borderSoft,
                    overflow: 'hidden',
                  }}
                >
                  <Image source={{ uri: preset.url }} style={{ width: 48, height: 48 }} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Priority Level</Text>
          <View style={styles.prioritySelectorRow}>
            {priorities.map((p) => {
              const isSelected = wishPriority === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setWishPriority(p.key)}
                  style={[
                    styles.priorityBtn,
                    { backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary },
                  ]}
                >
                  <Text style={[styles.priorityBtnText, { color: isSelected ? (theme === 'kawaii' ? '#2c352d' : '#ffffff') : colors.textMuted }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Estimated Price (Rs.)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="175000"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={wishPrice}
            onChangeText={setWishPrice}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Target Date / Milestone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. December 2026"
            placeholderTextColor={colors.textSubtle}
            value={wishDate}
            onChangeText={setWishDate}
          />
        </View>

        <TouchableOpacity
          onPress={handleAddWishlistSubmit}
          style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.submitButtonText, { color: theme === 'kawaii' ? '#2c352d' : '#ffffff' }]}>
            Add to Wishlist 🌟
          </Text>
        </TouchableOpacity>
      </AestheticModal>

      {/* ===================== FULL-SCREEN IMAGE LIGHTBOX MODAL ===================== */}
      <Modal
        visible={!!previewImageItem}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageItem(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPreviewImageItem(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          {previewImageItem && (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setPreviewImageItem(null)}
                style={{
                  alignSelf: 'flex-end',
                  marginBottom: 12,
                  padding: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 20,
                }}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>

              {previewImageItem.imageUrl ? (
                <Image
                  source={{ uri: resolveImageUrl(previewImageItem.imageUrl) }}
                  style={{
                    width: width - 40,
                    height: (width - 40) * 1.15,
                    borderRadius: 24,
                  }}
                  resizeMode="contain"
                />
              ) : null}

              <View
                style={{
                  marginTop: 16,
                  alignItems: 'center',
                  backgroundColor: 'rgba(30, 30, 30, 0.85)',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 18,
                  maxWidth: width - 40,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 4 }}>
                  {previewImageItem.emoji} {previewImageItem.name}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primaryAccent }}>
                  Target Price: Rs. {previewImageItem.price.toLocaleString()} • {previewImageItem.targetDate}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  headerAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 16,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
  wishCard: {
    borderRadius: 24,
    padding: 16,
  },
  wishHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 22,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemDate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  strikethroughText: {
    textDecorationLine: 'line-through',
  },
  deleteBtn: {
    padding: 6,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginVertical: 12,
  },
  wishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  purchaseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  purchaseBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // Form styles
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
  },
  chipsScroll: {
    marginTop: 4,
  },
  emojiChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  emojiText: {
    fontSize: 20,
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  priorityBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
