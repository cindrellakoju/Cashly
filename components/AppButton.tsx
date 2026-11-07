import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinancial } from '@/context/FinancialContext';
import { DESIGN_TOKENS } from '@/constants/theme';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md' | 'lg';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'md',
}) => {
  const { colors } = useFinancial();
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      opacity.value = withTiming(0.85, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    opacity.value = withTiming(1, { duration: 120 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getButtonStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primaryAccent,
          borderWidth: 0,
          borderColor: 'transparent',
          ...colors.cardShadow,
        };
      case 'secondary':
        return {
          backgroundColor: colors.bgCard,
          borderWidth: 0,
          borderColor: 'transparent',
          ...colors.cardShadow,
        };
      case 'danger':
        return {
          backgroundColor: colors.dangerLight,
          borderWidth: 0,
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: colors.bgSecondary,
          borderColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: colors.primaryAccent,
          borderWidth: 0,
          borderColor: 'transparent',
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textSubtle;
    switch (variant) {
      case 'primary':
        return colors.textOnAccent || colors.textMain;
      case 'secondary':
        return colors.textMain;
      case 'danger':
        return colors.danger;
      case 'outline':
        return colors.textMain;
      default:
        return colors.textMain;
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, minHeight: 34 };
      case 'lg':
        return { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 18, minHeight: 52 };
      case 'md':
      default:
        return { paddingVertical: 11, paddingHorizontal: 18, borderRadius: DESIGN_TOKENS.layout.buttonRadius, minHeight: DESIGN_TOKENS.layout.buttonHeight };
    }
  };

  const textColor = getTextColor();

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.btnBase,
        getSizeStyles(),
        getButtonStyles(),
        disabled && styles.btnDisabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? (
            <Ionicons name={icon} size={size === 'sm' ? 14 : 17} color={textColor} style={styles.iconStyle} />
          ) : null}
          <Text
            style={[
              styles.btnText,
              { color: textColor },
              size === 'sm' && { fontSize: 12 },
              size === 'lg' && { fontSize: 15 },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  btnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconStyle: {
    marginRight: 2,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
