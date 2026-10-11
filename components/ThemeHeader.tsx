import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useFinancial } from '@/context/FinancialContext';
import { MonthDropdownModal } from '@/components/MonthDropdownModal';
import { AdminPinModal } from '@/components/AdminPinModal';

interface ThemeHeaderProps {
  title: string;
  subtitle?: string;
  stickerKey?: 'home' | 'debitCredit' | 'wishlist' | 'vault';
  rightAction?: React.ReactNode;
}

export const ThemeHeader: React.FC<ThemeHeaderProps> = ({
  title,
  subtitle,
  stickerKey = 'home',
  rightAction,
}) => {
  const {
    colors,
    stickers,
    selectedMonth,
    setSelectedMonth,
    isAdminMode,
    setIsAdminMode,
    lockAdminMode,
  } = useFinancial();

  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState<boolean>(false);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Top Header Row: Left (Normal & Admin Access) | Right (Date Dropdown Trigger) */}
      <View style={styles.topBarRow}>
        <View style={[styles.pillsContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleModeSelect(false)}
            style={[
              styles.themePill,
              !isAdminMode && {
                backgroundColor: colors.primaryAccent,
                shadowColor: colors.primaryAccent,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
          >
            <Text
              style={[
                styles.themePillText,
                { color: !isAdminMode ? '#2c352d' : colors.textMuted },
                !isAdminMode && styles.themePillTextActive,
              ]}
            >
              👤 Normal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleModeSelect(true)}
            style={[
              styles.themePill,
              isAdminMode && {
                backgroundColor: colors.primaryAccent,
                shadowColor: colors.primaryAccent,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
          >
            <Text
              style={[
                styles.themePillText,
                { color: isAdminMode ? '#2c352d' : colors.textMuted },
                isAdminMode && styles.themePillTextActive,
              ]}
            >
              👑 Admin
            </Text>
          </TouchableOpacity>
        </View>

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
              backgroundColor: colors.bgSecondary,
              borderColor: colors.borderSoft,
            },
          ]}
        >
          <Text style={styles.dateEmoji}>📅</Text>
          <Text style={[styles.dateDropdownText, { color: colors.textMain }]} numberOfLines={1}>
            {formatSelectedMonthLabel(selectedMonth)}
          </Text>
          <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
        </TouchableOpacity>
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
          <View style={[styles.stickerWrapper, { borderColor: colors.borderAccent || colors.primaryAccent }]}>
            <Image
              source={stickers[stickerKey]}
              style={styles.stickerImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  pillsContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    gap: 2,
    flexShrink: 0,
  },
  themePill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
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
  dateDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    maxWidth: '52%',
    shadowColor: '#3c5a41',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateEmoji: {
    fontSize: 13,
  },
  dateDropdownText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    paddingRight: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  stickerWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
  rightActionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
