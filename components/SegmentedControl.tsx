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
  const { colors, theme } = useFinancial();

  const handlePress = (key: T) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(key);
  };

  const renderContent = () => (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft },
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
                borderColor: colors.borderAccent || colors.primaryAccent,
                borderWidth: 1,
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
                      : colors.borderSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: isActive
                        ? colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')
                        : colors.textMuted,
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
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 8,
    gap: 4,
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
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '800',
  },
  badgeWrapper: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
