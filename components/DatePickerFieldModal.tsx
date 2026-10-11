import React, { useState } from 'react';
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

interface DatePickerFieldModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (formattedDate: string) => void;
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

export const DatePickerFieldModal: React.FC<DatePickerFieldModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  currentValue,
}) => {
  const { colors, theme } = useFinancial();

  const todayObj = new Date();
  const [currentYear, setCurrentYear] = useState<number>(todayObj.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(todayObj.getMonth());
  const [selectedDayNum, setSelectedDayNum] = useState<number>(todayObj.getDate());

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      const now = new Date();
      setCurrentYear(now.getFullYear());
      setCurrentMonthIndex(now.getMonth());
      setSelectedDayNum(now.getDate());
    }
  }

  const minYear = todayObj.getFullYear();
  const minMonthIndex = todayObj.getMonth();
  const isAtMinMonth = currentYear < minYear || (currentYear === minYear && currentMonthIndex <= minMonthIndex);

  const handlePrevMonth = () => {
    if (isAtMinMonth) return;
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

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOffset = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const totalDays = getDaysInMonth(currentYear, currentMonthIndex);
  const firstDayOffset = getFirstDayOffset(currentYear, currentMonthIndex);

  const handleConfirmDate = (day: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedDayNum(day);
    const dayPadded = day < 10 ? `0${day}` : `${day}`;
    const monthShort = SHORT_MONTH_NAMES[currentMonthIndex];
    const formatted = `${dayPadded} ${monthShort} ${currentYear}`;
    onSelectDate(formatted);
    onClose();
  };

  const handleSelectPreset = (preset: 'today' | 'yesterday' | 'firstOfMonth') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const d = new Date();
    if (preset === 'yesterday') {
      d.setDate(d.getDate() - 1);
      if (d.getFullYear() < minYear || (d.getFullYear() === minYear && d.getMonth() < minMonthIndex)) {
        d.setFullYear(minYear, minMonthIndex, 1);
      }
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

  return (
    <AestheticModal
      visible={visible}
      onClose={onClose}
      title="Select Record Date"
      subtitle="Tap a day to automatically fill date"
      icon="📅"
    >
      {/* Presets */}
      <View style={styles.presetRow}>
        <TouchableOpacity
          onPress={() => handleSelectPreset('today')}
          style={[styles.presetChip, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.presetChipText, { color: theme === 'kawaii' ? '#2c352d' : '#FFFFFF' }]}>Today 📅</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSelectPreset('yesterday')}
          style={[styles.presetChip, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1 }]}
        >
          <Text style={[styles.presetChipText, { color: colors.textMain }]}>Yesterday ⏪</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSelectPreset('firstOfMonth')}
          style={[styles.presetChip, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1 }]}
        >
          <Text style={[styles.presetChipText, { color: colors.textMain }]}>1st of Month 🗓️</Text>
        </TouchableOpacity>
      </View>

      {/* Month Navigation */}
      <View style={[styles.calendarHeader, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          disabled={isAtMinMonth}
          style={[styles.navArrowBtn, isAtMinMonth && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={[styles.monthYearText, { color: colors.textMain }]}>
          {MONTH_NAMES[currentMonthIndex]} {currentYear}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.textMain} />
        </TouchableOpacity>
      </View>

      {/* Days of Week */}
      <View style={styles.daysOfWeekRow}>
        {DAYS_OF_WEEK.map((dayName, idx) => (
          <Text key={idx} style={[styles.dayOfWeekText, { color: colors.textMuted }]}>
            {dayName}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.daysGrid}>
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.dayCellBlank} />
        ))}

        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const isToday =
            day === todayObj.getDate() &&
            currentMonthIndex === todayObj.getMonth() &&
            currentYear === todayObj.getFullYear();
          const isSelected = day === selectedDayNum;

          return (
            <TouchableOpacity
              key={`day-${day}`}
              onPress={() => handleConfirmDate(day)}
              style={[
                styles.dayCell,
                { backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary },
                isToday && !isSelected && { borderColor: colors.primaryAccent, borderWidth: 1.5 },
              ]}
            >
              <Text
                style={[
                  styles.dayCellText,
                  {
                    color: isSelected
                      ? theme === 'kawaii' ? '#2c352d' : '#FFFFFF'
                      : colors.textMain,
                    fontWeight: isSelected || isToday ? '800' : '600',
                  },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </AestheticModal>
  );
};

const styles = StyleSheet.create({
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    justifyContent: 'center',
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  navArrowBtn: {
    padding: 6,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '800',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dayOfWeekText: {
    width: '13%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 6,
    marginBottom: 10,
  },
  dayCellBlank: {
    width: '12.8%',
    height: 38,
  },
  dayCell: {
    width: '12.8%',
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellText: {
    fontSize: 13,
  },
});
