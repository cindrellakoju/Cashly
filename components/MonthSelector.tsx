import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinancial, getCurrentMonthKey } from '@/context/FinancialContext';

interface MonthSelectorProps {
  selectedMonth: string;
  onSelectMonth: (monthKey: string) => void;
  availableMonths?: { key: string; label: string }[];
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onSelectMonth,
  availableMonths = [],
}) => {
  const { colors } = useFinancial();

  // Default preset months if none provided
  const currentKey = getCurrentMonthKey();
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleDateString('en-GB', { month: 'short' });
  const monthsList = availableMonths.length > 0 ? availableMonths : [
    { key: 'ALL', label: '🌐 All Time' },
    { key: currentKey, label: `📅 ${currentMonthName} ${currentYear}` },
  ];

  const currentIndex = monthsList.findIndex((m) => m.key === selectedMonth);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectMonth(monthsList[currentIndex - 1].key);
    } else if (monthsList.length > 0) {
      onSelectMonth(monthsList[monthsList.length - 1].key);
    }
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < monthsList.length - 1) {
      onSelectMonth(monthsList[currentIndex + 1].key);
    } else if (monthsList.length > 0) {
      onSelectMonth(monthsList[0].key);
    }
  };

  const activeMonthObj = monthsList.find((m) => m.key === selectedMonth) || {
    key: selectedMonth,
    label: selectedMonth === 'ALL' ? '🌐 All Time' : selectedMonth,
  };

  return (
    <View style={styles.container}>
      {/* Month Navigator Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handlePrev}
          style={[styles.arrowBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={colors.textMain} />
        </TouchableOpacity>

        <View style={styles.currentMonthBadge}>
          <Text style={[styles.monthText, { color: colors.textMain }]}>
            {activeMonthObj.label}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.arrowBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={16} color={colors.textMain} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Month Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {monthsList.map((m) => {
          const isSelected = selectedMonth === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => onSelectMonth(m.key)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary,
                  borderColor: isSelected ? colors.borderAccent : colors.borderSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : colors.textMuted },
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentMonthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  scrollContent: {
    gap: 6,
    paddingRight: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextSelected: {
    fontWeight: '800',
  },
});
