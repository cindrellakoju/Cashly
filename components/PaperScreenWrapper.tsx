import React from 'react';
import { View, StyleSheet, ImageBackground, StyleProp, ViewStyle } from 'react-native';
import { useFinancial } from '@/context/FinancialContext';
import { TotoroSticker } from './TotoroStickers';

interface PaperScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  showParade?: boolean;
}

export const PaperScreenWrapper: React.FC<PaperScreenWrapperProps> = ({
  children,
  style,
  showParade = false,
}) => {
  const { colors } = useFinancial();

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }, style]}>
      <ImageBackground
        source={require('@/assets/images/grid_paper.png')}
        resizeMode="repeat"
        style={styles.gridBackground}
        imageStyle={styles.gridImage}
      >
        {children}
        {showParade && (
          <View style={styles.paradeContainer}>
            <TotoroSticker type="parade" height={44} />
          </View>
        )}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gridBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gridImage: {
    opacity: 0.9,
  },
  paradeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    opacity: 0.9,
  },
});
