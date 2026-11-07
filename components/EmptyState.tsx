import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinancial } from '@/context/FinancialContext';

interface EmptyStateProps {
  emoji?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: object;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji,
  icon,
  title,
  subtitle,
  actionText,
  onActionPress,
  style,
}) => {
  const { colors } = useFinancial();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.borderSoft,
          ...colors.cardShadow,
        },
        style,
      ]}
    >
      {emoji ? (
        <Text style={styles.emoji}>{emoji}</Text>
      ) : icon ? (
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryAccentLight, borderColor: colors.borderSoft }]}>
          <Ionicons name={icon} size={24} color={colors.textMain} />
        </View>
      ) : (
        <Text style={styles.emoji}>🐱</Text>
      )}

      <Text style={[styles.title, { color: colors.textMain }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>

      {actionText && onActionPress && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onActionPress}
          style={[
            styles.actionBtn,
            {
              backgroundColor: colors.primaryAccent,
              borderColor: colors.borderSoft,
              ...colors.cardShadow,
            },
          ]}
        >
          <Text
            style={[
              styles.actionBtnText,
              { color: colors.textMain },
            ]}
          >
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    marginVertical: 10,
  },
  emoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  actionBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 0,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
