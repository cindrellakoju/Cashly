import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinancial } from '@/context/FinancialContext';
import { AestheticModal } from './AestheticModal';

interface CalendarDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (formattedDate: string) => void;
  initialDate?: string;
  currentValue?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarDatePickerModal: React.FC<CalendarDatePickerModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  currentValue,
}) => {
  const { colors, theme } = useFinancial();

  const parseDateValue = (val?: string): Date => {
    if (!val) return new Date();
    const trimmed = val.trim();
    // 1. Match DD Mon YYYY: e.g. "15 Jul 2026"
    const textMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
    if (textMatch) {
      const d = parseInt(textMatch[1], 10);
      const mStr = textMatch[2].slice(0, 3).toLowerCase();
      const mIdx = SHORT_MONTH_NAMES.findIndex((mn) => mn.toLowerCase() === mStr);
      const y = parseInt(textMatch[3], 10);
      if (mIdx !== -1 && d >= 1 && d <= 31) {
        return new Date(y, mIdx, d);
      }
    }
    // 2. Match ISO YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10) - 1;
      const d = parseInt(isoMatch[3], 10);
      if (m >= 0 && m <= 11 && d >= 1 && d <= 31) {
        return new Date(y, m, d);
      }
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const todayObj = new Date();
  const [currentYear, setCurrentYear] = useState<number>(todayObj.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(todayObj.getMonth());
  const [selectedDayNum, setSelectedDayNum] = useState<number>(todayObj.getDate());
  const [selectedYear, setSelectedYear] = useState<number>(todayObj.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(todayObj.getMonth());

  useEffect(() => {
    if (visible) {
      const d = parseDateValue(initialDate || currentValue);
      setCurrentYear(d.getFullYear());
      setCurrentMonthIndex(d.getMonth());
      setSelectedDayNum(d.getDate());
      setSelectedYear(d.getFullYear());
      setSelectedMonthIndex(d.getMonth());
    }
  }, [visible, initialDate, currentValue]);

  // Navigate Months
  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonthIndex((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonthIndex((prev) => prev + 1);
    }
  };

  // Calendar Calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOffset = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon
    return day === 0 ? 6 : day - 1; // Mon = 0 .. Sun = 6
  };

  const totalDays = getDaysInMonth(currentYear, currentMonthIndex);
  const firstDayOffset = getFirstDayOffset(currentYear, currentMonthIndex);

  // Confirm selection
  const handleConfirmDate = (day: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedDayNum(day);
    setSelectedYear(currentYear);
    setSelectedMonthIndex(currentMonthIndex);

    const dayPadded = day < 10 ? `0${day}` : `${day}`;
    const monthShort = SHORT_MONTH_NAMES[currentMonthIndex];
    const formatted = `${dayPadded} ${monthShort} ${currentYear}`;
    onSelectDate(formatted);
    onClose();
  };

  // Presets
  const handleSelectPreset = (preset: 'today' | 'yesterday' | 'firstOfMonth') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const d = new Date();
    if (preset === 'yesterday') {
      d.setDate(d.getDate() - 1);
    } else if (preset === 'firstOfMonth') {
      d.setDate(1);
    }
    const day = d.getDate();
    const dayPadded = day < 10 ? `0${day}` : `${day}`;
    const monthShort = SHORT_MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    const formatted = `${dayPadded} ${monthShort} ${year}`;
    onSelectDate(formatted);
    onClose();
  };

  const formattedSelectedPreview = () => {
    const dayPadded = selectedDayNum < 10 ? `0${selectedDayNum}` : `${selectedDayNum}`;
    const monthShort = SHORT_MONTH_NAMES[selectedMonthIndex];
    return `${dayPadded} ${monthShort} ${selectedYear}`;
  };

  return (
    <AestheticModal
      visible={visible}
      onClose={onClose}
      title="Calendar Date Picker"
      subtitle="Tap any day to choose record date"
      icon="📅"
    >
      {/* Quick Presets */}
      <View style={styles.presetRow}>
        <TouchableOpacity
          onPress={() => handleSelectPreset('today')}
          activeOpacity={0.7}
          style={[styles.presetChip, { backgroundColor: colors.primaryAccent }]}
        >
          <Text
            style={[
              styles.presetChipText,
              { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') },
            ]}
          >
            Today 📅
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelectPreset('yesterday')}
          activeOpacity={0.7}
          style={[styles.presetChip, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1 }]}
        >
          <Text style={[styles.presetChipText, { color: colors.textMain }]}>Yesterday ⏪</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelectPreset('firstOfMonth')}
          activeOpacity={0.7}
          style={[styles.presetChip, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1 }]}
        >
          <Text style={[styles.presetChipText, { color: colors.textMain }]}>1st of Month 🗓️</Text>
        </TouchableOpacity>
      </View>

      {/* Month Navigation */}
      <View style={[styles.calendarHeader, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          activeOpacity={0.7}
          style={styles.navArrowBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textMain} />
        </TouchableOpacity>

        <Text style={[styles.monthYearText, { color: colors.textMain }]}>
          {MONTH_NAMES[currentMonthIndex]} {currentYear}
        </Text>

        <TouchableOpacity
          onPress={handleNextMonth}
          activeOpacity={0.7}
          style={styles.navArrowBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textMain} />
        </TouchableOpacity>
      </View>

      {/* Days of Week (Strict 7 columns with 14.285% width) */}
      <View style={styles.daysOfWeekRow}>
        {DAYS_OF_WEEK.map((dayName, idx) => {
          const isWeekend = idx >= 5;
          return (
            <View key={idx} style={styles.dayOfWeekCol}>
              <Text
                style={[
                  styles.dayOfWeekText,
                  { color: isWeekend ? (theme === 'kawaii' ? '#e2738a' : '#f28b82') : colors.textMuted },
                ]}
              >
                {dayName}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Calendar Days Grid (Strict 7 columns with 14.285% width) */}
      <View style={styles.daysGrid}>
        {/* Blank Padding Days */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.dayCellWrapper} />
        ))}

        {/* Days 1 .. N */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const isToday =
            day === todayObj.getDate() &&
            currentMonthIndex === todayObj.getMonth() &&
            currentYear === todayObj.getFullYear();
          const isSelected =
            day === selectedDayNum &&
            currentMonthIndex === selectedMonthIndex &&
            currentYear === selectedYear;

          return (
            <View key={`day-${day}`} style={styles.dayCellWrapper}>
              <TouchableOpacity
                onPress={() => handleConfirmDate(day)}
                activeOpacity={0.7}
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: isSelected
                      ? colors.primaryAccent
                      : isToday
                      ? (theme === 'kawaii' ? '#fdf1e7' : '#232822')
                      : colors.bgSecondary,
                    borderColor: isSelected
                      ? colors.primaryAccent
                      : isToday
                      ? colors.primaryAccent
                      : 'transparent',
                    borderWidth: isToday || isSelected ? 1.5 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayCellText,
                    {
                      color: isSelected
                        ? colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')
                        : isToday
                        ? colors.primaryAccent
                        : colors.textMain,
                      fontWeight: isSelected || isToday ? '800' : '600',
                    },
                  ]}
                >
                  {day}
                </Text>
                {isToday && (
                  <View
                    style={[
                      styles.todayIndicatorDot,
                      { backgroundColor: isSelected ? (colors.textOnAccent || '#ffffff') : colors.primaryAccent },
                    ]}
                  />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Selected Date Summary & Confirm Bar */}
      <View style={[styles.footerBar, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
        <View style={styles.footerInfo}>
          <Text style={[styles.footerLabel, { color: colors.textMuted }]}>Selected</Text>
          <Text style={[styles.footerValue, { color: colors.textMain }]}>
            {formattedSelectedPreview()} 📅
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const dayPadded = selectedDayNum < 10 ? `0${selectedDayNum}` : `${selectedDayNum}`;
            const monthShort = SHORT_MONTH_NAMES[selectedMonthIndex];
            onSelectDate(`${dayPadded} ${monthShort} ${selectedYear}`);
            onClose();
          }}
          activeOpacity={0.7}
          style={[styles.confirmBtn, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.confirmBtnText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
            Done ✓
          </Text>
        </TouchableOpacity>
      </View>
    </AestheticModal>
  );
};

const styles = StyleSheet.create({
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '800',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
    width: '100%',
  },
  dayOfWeekCol: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayOfWeekText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: 14,
  },
  dayCellWrapper: {
    width: '14.285%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellText: {
    fontSize: 13,
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 2,
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
