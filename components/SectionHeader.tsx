import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFinancial } from '@/context/FinancialContext';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  rightAction?: React.ReactNode;
  actionText?: string;
  onActionPress?: () => void;
  style?: object;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  rightAction,
  actionText,
  onActionPress,
  style,
}) => {
  const { colors } = useFinancial();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleColumn}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.textMain }]}>{title}</Text>
          {badge !== undefined && (
            <View style={[styles.badge, { backgroundColor: colors.primaryAccent, borderColor: colors.borderSoft }]}>
              <Text style={[styles.badgeText, { color: colors.textMain }]}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>

      {rightAction ? (
        <View style={styles.actionWrapper}>{rightAction}</View>
      ) : actionText && onActionPress ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onActionPress}
          style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: 'transparent', borderWidth: 0 }]}
        >
          <Text style={[styles.actionBtnText, { color: colors.textMain }]}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionWrapper: {
    flexShrink: 0,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    flexShrink: 0,
    shadowColor: '#2C221D',
    shadowOffset: { width: 1, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
