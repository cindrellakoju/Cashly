import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFinancial } from '@/context/FinancialContext';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  selectedKey: T;
  onSelect: (key: T) => void;
  isScrollable?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  selectedKey,
  onSelect,
  isScrollable = false,
}: SegmentedControlProps<T>) {
  const { colors } = useFinancial();

  const handlePress = (key: T) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(key);
  };

  const renderContent = () => (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bgSecondary },
      ]}
    >
      {options.map((opt) => {
        const isActive = selectedKey === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            activeOpacity={0.75}
            onPress={() => handlePress(opt.key)}
            style={[
              styles.segmentBtn,
              isActive && {
                backgroundColor: colors.bgCard,
                ...colors.cardShadow,
              },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: isActive ? colors.textMain : colors.textMuted },
                isActive && styles.segmentTextActive,
              ]}
            >
              {opt.label}
            </Text>
            {opt.badge !== undefined ? (
              <View
                style={[
                  styles.badgeWrapper,
                  {
                    backgroundColor: isActive
                      ? colors.primaryAccent
                      : colors.bgCard,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: isActive ? colors.textOnAccent : colors.textMain,
                    },
                  ]}
                >
                  {opt.badge}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (isScrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {renderContent()}
      </ScrollView>
    );
  }

  return renderContent();
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    borderWidth: 0,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 4,
    shadowColor: '#28452D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '800',
  },
  badgeWrapper: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
