import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PRESET_OPTIONS, AppTheme, STICKER_PACKS, StickerPack } from '@/constants/theme';
import { useFinancial } from '@/context/FinancialContext';
import { MonthDropdownModal } from './MonthDropdownModal';
import { AdminPinModal } from './AdminPinModal';
import { AestheticModal } from './AestheticModal';
import { TotoroSticker } from './TotoroStickers';

interface ThemeHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  stickerKey?: 'home' | 'debitCredit' | 'wishlist' | 'vault';
}

export const ThemeHeader: React.FC<ThemeHeaderProps> = ({
  title,
  subtitle,
  rightAction,
  stickerKey = 'home',
}) => {
  const {
    theme,
    stickerPack,
    colors,
    setTheme,
    setStickerPack,
    selectedMonth,
    setSelectedMonth,
    isAdminMode,
    setIsAdminMode,
    lockAdminMode,
  } = useFinancial();

  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'stickers' | 'colors'>('stickers');

  const currentPackInfo = STICKER_PACKS.find((p) => p.id === stickerPack) || STICKER_PACKS[0];

  const handleModeSelect = (admin: boolean) => {
    if (admin) {
      if (!isAdminMode) {
        setIsAdminPinModalOpen(true);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lockAdminMode();
    }
  };

  const formatSelectedMonthLabel = (monthKey: string) => {
    if (monthKey === 'ALL') return 'All Time';
    const parts = monthKey.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[monthNum] || parts[1]} ${year}`;
    }
    return monthKey;
  };

  const handleSelectColorTheme = async (presetId: AppTheme) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setTheme(presetId);
  };

  const handleSelectStickerPack = async (packId: StickerPack) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setStickerPack(packId);
  };

  return (
    <View style={styles.container}>
      {/* Top Header Row: Left (Normal & Admin Access) | Right (Customizer Switcher & Date Trigger) */}
      <View style={styles.topBarRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TotoroSticker type="star" size={26} />
          <View style={[styles.pillsContainer, { backgroundColor: colors.bgCard, borderColor: 'transparent' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleModeSelect(false)}
              style={[
                styles.themePill,
                !isAdminMode && {
                  backgroundColor: colors.primaryAccent,
                },
              ]}
            >
              <Text
                style={[
                  styles.themePillText,
                  { color: !isAdminMode ? colors.textOnAccent : colors.textMuted },
                  !isAdminMode && styles.themePillTextActive,
                ]}
              >
                Normal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleModeSelect(true)}
              style={[
                styles.themePill,
                isAdminMode && {
                  backgroundColor: colors.primaryAccent,
                },
              ]}
            >
              <Text
                style={[
                  styles.themePillText,
                  { color: isAdminMode ? colors.textOnAccent : colors.textMuted },
                  isAdminMode && styles.themePillTextActive,
                ]}
              >
                Admin
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.topBarRight}>
          {/* Stickers & Color Customizer Trigger Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsCustomizerOpen(true);
            }}
            style={[
              styles.themeQuickToggleBtn,
              {
                backgroundColor: colors.bgCard,
                borderColor: 'transparent',
                ...colors.cardShadow,
              },
            ]}
          >
            <Text style={{ fontSize: 13 }}>{currentPackInfo.previewEmoji}</Text>
            <Text style={[styles.themeBadgeText, { color: colors.textMain }]}>
              {currentPackInfo.name.split(' ')[0]}
            </Text>
            <Ionicons name="sparkles" size={11} color={colors.primaryAccent} />
          </TouchableOpacity>

          {/* Date Dropdown Trigger Button on Top Right */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsMonthModalOpen(true);
            }}
            style={[
              styles.dateDropdownBtn,
              {
                backgroundColor: colors.bgCard,
                borderColor: 'transparent',
                ...colors.cardShadow,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={13} color={colors.textMain} />
            <Text
              style={[styles.dateDropdownText, { color: colors.textMain }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formatSelectedMonthLabel(selectedMonth)}
            </Text>
            <Ionicons name="chevron-down" size={12} color={colors.textMuted} style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Header Banner Content */}
      <View style={styles.bannerRow}>
        <View style={styles.textColumn}>
          <Text style={[styles.pageTitle, { color: colors.textMain }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>

        {rightAction ? (
          <View style={styles.rightActionWrapper}>{rightAction}</View>
        ) : (
          <View style={[styles.totoroBadge, { backgroundColor: colors.bgCard, borderColor: 'transparent' }]}>
            <TotoroSticker
              type={
                stickerKey === 'vault'
                  ? 'vault'
                  : stickerKey === 'wishlist'
                  ? 'wishlist'
                  : stickerKey === 'debitCredit'
                  ? 'borrow_lent'
                  : 'leaf'
              }
              size={54}
            />
          </View>
        )}
      </View>

      {/* Stickers & Color Customizer Modal */}
      <AestheticModal
        visible={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        title="Customization Studio 🎨"
        subtitle="Choose your favorite anime stickers & theme color"
        icon="✨"
      >
        <View style={{ paddingVertical: 4, gap: 14 }}>
          {/* Segmented Tab Switcher: Stickers vs Colors */}
          <View style={[styles.modalTabBar, { backgroundColor: colors.bgSecondary }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalTab('stickers');
              }}
              style={[
                styles.modalTabBtn,
                modalTab === 'stickers' && {
                  backgroundColor: colors.bgCard,
                  ...colors.cardShadow,
                },
              ]}
            >
              <Text
                style={[
                  styles.modalTabBtnText,
                  {
                    color: modalTab === 'stickers' ? colors.textMain : colors.textMuted,
                    fontWeight: modalTab === 'stickers' ? '800' : '600',
                  },
                ]}
              >
                🧸 1. Stickers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalTab('colors');
              }}
              style={[
                styles.modalTabBtn,
                modalTab === 'colors' && {
                  backgroundColor: colors.bgCard,
                  ...colors.cardShadow,
                },
              ]}
            >
              <Text
                style={[
                  styles.modalTabBtnText,
                  {
                    color: modalTab === 'colors' ? colors.textMain : colors.textMuted,
                    fontWeight: modalTab === 'colors' ? '800' : '600',
                  },
                ]}
              >
                🎨 2. Theme Color
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: STICKER PACKS */}
          {modalTab === 'stickers' && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, marginLeft: 2 }}>
                Select your mascot character sticker pack:
              </Text>

              {STICKER_PACKS.map((pack) => {
                const isSelected = stickerPack === pack.id;
                return (
                  <TouchableOpacity
                    key={pack.id}
                    activeOpacity={0.85}
                    onPress={() => handleSelectStickerPack(pack.id)}
                    style={[
                      styles.presetOptionCard,
                      {
                        backgroundColor: isSelected ? colors.bgSecondary : colors.bgCard,
                        borderRadius: 20,
                        borderWidth: 0,
                        ...colors.cardShadow,
                      },
                    ]}
                  >
                    {/* Sticker Mascot Preview */}
                    <View style={styles.stickerPreviewWrap}>
                      <TotoroSticker type="big" pack={pack.id} size={48} />
                    </View>

                    <View style={styles.presetLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.presetTitle, { color: colors.textMain }]}>
                          {pack.name} {pack.previewEmoji}
                        </Text>
                        {isSelected && (
                          <View style={[styles.activeTag, { backgroundColor: colors.primaryGreenLight, borderColor: 'transparent' }]}>
                            <Text style={[styles.activeTagText, { color: colors.primaryGreen }]}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.presetSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                        {pack.tagline}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={[styles.checkCircle, { backgroundColor: colors.primaryAccent, borderColor: 'transparent' }]}>
                        <Ionicons name="checkmark" size={14} color={colors.textMain} />
                      </View>
                    ) : (
                      <View style={[styles.uncheckCircle, { borderColor: 'transparent', backgroundColor: colors.bgSecondary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* TAB 2: THEME COLORS */}
          {modalTab === 'colors' && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, marginLeft: 2 }}>
                Select your stationery memo pad color palette:
              </Text>

              {PRESET_OPTIONS.map((opt) => {
                const isSelected = theme === opt.id || (theme === 'noir' && opt.id === 'paperDark');
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.85}
                    onPress={() => handleSelectColorTheme(opt.id)}
                    style={[
                      styles.presetOptionCard,
                      {
                        backgroundColor: isSelected ? colors.bgSecondary : colors.bgCard,
                        borderRadius: 20,
                        borderWidth: 0,
                        ...colors.cardShadow,
                      },
                    ]}
                  >
                    <View style={styles.presetLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.presetTitle, { color: colors.textMain }]}>{opt.label}</Text>
                        {isSelected && (
                          <View style={[styles.activeTag, { backgroundColor: colors.primaryGreenLight, borderColor: 'transparent' }]}>
                            <Text style={[styles.activeTagText, { color: colors.primaryGreen }]}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.presetSubtitle, { color: colors.textMuted }]}>{opt.subtitle}</Text>
                      {/* Swatch preview dots */}
                      <View style={styles.dotsRow}>
                        {opt.dots.map((d, i) => (
                          <View key={i} style={[styles.presetDot, { backgroundColor: d, borderColor: 'transparent' }]} />
                        ))}
                      </View>
                    </View>

                    {isSelected ? (
                      <View style={[styles.checkCircle, { backgroundColor: colors.primaryAccent, borderColor: 'transparent' }]}>
                        <Ionicons name="checkmark" size={14} color={colors.textMain} />
                      </View>
                    ) : (
                      <View style={[styles.uncheckCircle, { borderColor: 'transparent', backgroundColor: colors.bgSecondary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </AestheticModal>

      {/* Month Dropdown Popup Modal */}
      <MonthDropdownModal
        visible={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />

      {/* Admin PIN Verification Modal */}
      <AdminPinModal
        visible={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => {
          setIsAdminPinModalOpen(false);
          setIsAdminMode(true);
        }}
        pinType="admin"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  pillsContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    borderWidth: 0,
    gap: 3,
    flexShrink: 0,
    shadowColor: '#28452D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  themePill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  themePillTextActive: {
    fontWeight: '800',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  themeQuickToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 0,
    gap: 4,
    flexShrink: 0,
  },
  themeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 0,
    gap: 5,
    flexShrink: 1,
    minWidth: 0,
  },
  dateDropdownText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  textColumn: {
    flex: 1,
    paddingRight: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  rightActionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  totoroBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#28452D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  // Modal Tab Bar
  modalTabBar: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTabBtnText: {
    fontSize: 12,
  },
  // Option Card Styles
  presetOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    gap: 12,
  },
  stickerPreviewWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetLeft: {
    flex: 1,
    gap: 3,
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  presetSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  activeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
  },
  presetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 0,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  uncheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 0,
    marginLeft: 6,
  },
});
