import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ImageBackground } from 'react-native';
import { useFinancial } from '@/context/FinancialContext';
import { DESIGN_TOKENS } from '@/constants/theme';
import { StationeryDecoration } from './StationeryDecorations';
import { TotoroStickerType } from './TotoroStickers';

export interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
  variant?: 'paper' | 'outlined' | 'subtle' | 'clay' | 'glass' | 'standard';
  decoration?: TotoroStickerType;
  decorationPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showGrid?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  noPadding = false,
  variant = 'paper',
  decoration,
  decorationPosition = 'top-right',
  showGrid = true,
}) => {
  const { colors } = useFinancial();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
      case 'subtle':
        return {
          backgroundColor: colors.bgCardAlt,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 22,
        };
      case 'paper':
      case 'standard':
      case 'clay':
      case 'glass':
      default:
        return {
          backgroundColor: colors.bgCard,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 22,
          ...colors.cardShadow,
        };
    }
  };

  const cardPadding = noPadding ? 0 : DESIGN_TOKENS.layout.cardPadding;

  return (
    <View style={[styles.cardOuter, getVariantStyles(), style]}>
      {decoration && (
        <StationeryDecoration type={decoration} position={decorationPosition} />
      )}
      {showGrid ? (
        <ImageBackground
          source={require('@/assets/images/grid_paper.png')}
          resizeMode="repeat"
          style={[styles.gridContainer, { padding: cardPadding }]}
          imageStyle={styles.gridImage}
        >
          {children}
        </ImageBackground>
      ) : (
        <View style={{ padding: cardPadding }}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    overflow: 'visible',
    marginVertical: 4,
  },
  gridContainer: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  gridImage: {
    opacity: 0.6,
  },
});
