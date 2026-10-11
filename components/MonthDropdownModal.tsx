import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinancial, getCurrentMonthKey } from '@/context/FinancialContext';

interface MonthDropdownModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMonth: string;
  onSelectMonth: (monthKey: string) => void;
}

const MONTHS = [
  { num: '01', short: 'Jan', full: 'January' },
  { num: '02', short: 'Feb', full: 'February' },
  { num: '03', short: 'Mar', full: 'March' },
  { num: '04', short: 'Apr', full: 'April' },
  { num: '05', short: 'May', full: 'May' },
  { num: '06', short: 'Jun', full: 'June' },
  { num: '07', short: 'Jul', full: 'July' },
  { num: '08', short: 'Aug', full: 'August' },
  { num: '09', short: 'Sep', full: 'September' },
  { num: '10', short: 'Oct', full: 'October' },
  { num: '11', short: 'Nov', full: 'November' },
  { num: '12', short: 'Dec', full: 'December' },
];

export const MonthDropdownModal: React.FC<MonthDropdownModalProps> = ({
  visible,
  onClose,
  selectedMonth,
  onSelectMonth,
}) => {
  const { colors } = useFinancial();

  const [activeYear, setActiveYear] = useState<number>(() => {
    if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) {
      return parseInt(selectedMonth.split('-')[0], 10);
    }
    return new Date().getFullYear();
  });

  const [pendingPrevMonthKey, setPendingPrevMonthKey] = useState<string | null>(null);

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setPendingPrevMonthKey(null);
      if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) {
        setActiveYear(parseInt(selectedMonth.split('-')[0], 10));
      } else {
        setActiveYear(new Date().getFullYear());
      }
    }
  }

  const formatMonthLabel = (key: string): string => {
    if (!key || key === 'ALL') return 'All Time';
    const [y, m] = key.split('-');
    const monthObj = MONTHS.find((item) => item.num === m);
    return `${monthObj?.full || m} ${y}`;
  };

  const handlePrevYear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveYear((prev) => prev + 1);
  };

  const handleSelectMonthKey = (key: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelectMonth(key);
    onClose();
  };

  const handleMonthPress = (key: string) => {
    const currentMonthKey = getCurrentMonthKey();
    if (key !== 'ALL' && key < currentMonthKey) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPendingPrevMonthKey(key);
      return;
    }
    handleSelectMonthKey(key);
  };

  const isAllTimeSelected = selectedMonth === 'ALL';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.borderSoft,
                  ...colors.cardShadow,
                },
              ]}
            >
              {/* Header Row */}
              <View style={[styles.headerRow, { borderBottomColor: colors.borderSoft }]}>
                <View style={styles.titleCol}>
                  <Text style={[styles.modalTitle, { color: colors.textMain }]}>Select Month 📅</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                    Filter transactions & budget view
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
                >
                  <Ionicons name="close" size={18} color={colors.textMain} />
                </TouchableOpacity>
              </View>

              {/* All Time Option Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSelectMonthKey('ALL')}
                style={[
                  styles.allTimeBtn,
                  {
                    backgroundColor: isAllTimeSelected ? colors.primaryAccent : colors.bgSecondary,
                    borderColor: isAllTimeSelected ? colors.borderAccent : colors.borderSoft,
                  },
                ]}
              >
                <View style={styles.allTimeContent}>
                  <Text style={styles.allTimeEmoji}>🌐</Text>
                  <Text
                    style={[
                      styles.allTimeText,
                      { color: isAllTimeSelected ? '#2c352d' : colors.textMain },
                      isAllTimeSelected && styles.allTimeTextActive,
                    ]}
                  >
                    All Time (Show All Activity)
                  </Text>
                </View>
                {isAllTimeSelected && (
                  <Ionicons name="checkmark-circle" size={18} color="#2c352d" />
                )}
              </TouchableOpacity>

              {/* Year Navigator Row */}
              <View style={[styles.yearNavRow, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                <TouchableOpacity
                  onPress={handlePrevYear}
                  style={styles.yearNavBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.textMain} />
                </TouchableOpacity>

                <Text style={[styles.yearText, { color: colors.textMain }]}>
                  {activeYear}
                </Text>

                <TouchableOpacity
                  onPress={handleNextYear}
                  style={styles.yearNavBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.textMain} />
                </TouchableOpacity>
              </View>

              {/* 12 Months Grid */}
              <View style={styles.monthsGrid}>
                {MONTHS.map((m) => {
                  const monthKey = `${activeYear}-${m.num}`;
                  const isSelected = selectedMonth === monthKey;

                  return (
                    <TouchableOpacity
                      key={m.num}
                      activeOpacity={0.75}
                      onPress={() => handleMonthPress(monthKey)}
                      style={[
                        styles.monthCell,
                        {
                          backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary,
                          borderColor: isSelected ? colors.borderAccent : colors.borderSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.monthShortText,
                          { color: isSelected ? '#2c352d' : colors.textMain },
                          isSelected && styles.monthShortTextActive,
                        ]}
                      >
                        {m.short}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Previous Month Notice Popup */}
              {pendingPrevMonthKey && (
                <View style={[styles.warningOverlay, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, ...colors.cardShadow }]}>
                  <View style={styles.warningHeader}>
                    <Text style={{ fontSize: 26 }}>🗓️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.warningTitle, { color: colors.textMain }]}>Previous Month Notice</Text>
                      <Text style={[styles.warningSub, { color: colors.textMuted }]}>Tracking history notice</Text>
                    </View>
                  </View>
                  <Text style={[styles.warningText, { color: colors.textMuted }]}>
                    You started using this app in{' '}
                    <Text style={{ fontWeight: '800', color: colors.textMain }}>
                      {formatMonthLabel(getCurrentMonthKey())}
                    </Text>
                    . You are choosing{' '}
                    <Text style={{ fontWeight: '800', color: colors.primaryAccent }}>
                      {formatMonthLabel(pendingPrevMonthKey)}
                    </Text>
                    . Past records or monthly base salary might not be loaded for this previous month.
                  </Text>
                  <View style={styles.warningBtnRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setPendingPrevMonthKey(null)}
                      style={[styles.warningCancelBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}
                    >
                      <Text style={[styles.warningCancelText, { color: colors.textMain }]}>Stay on Current</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        const target = pendingPrevMonthKey;
                        setPendingPrevMonthKey(null);
                        handleSelectMonthKey(target);
                      }}
                      style={[styles.warningConfirmBtn, { backgroundColor: colors.primaryAccent }]}
                    >
                      <Text style={styles.warningConfirmText}>View Month ➡️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  allTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allTimeEmoji: {
    fontSize: 15,
  },
  allTimeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  allTimeTextActive: {
    fontWeight: '800',
  },
  yearNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  yearNavBtn: {
    padding: 4,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthCell: {
    width: '30.5%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthShortText: {
    fontSize: 13,
    fontWeight: '600',
  },
  monthShortTextActive: {
    fontWeight: '800',
  },
  warningOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    justifyContent: 'center',
    zIndex: 100,
    elevation: 10,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  warningSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  warningBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  warningCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningCancelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  warningConfirmBtn: {
    flex: 1.2,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningConfirmText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2c352d',
  },
});
