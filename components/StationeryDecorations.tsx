import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TotoroSticker, TotoroStickerType } from './TotoroStickers';

interface CornerDecorationProps {
  type: TotoroStickerType;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const StationeryDecoration: React.FC<CornerDecorationProps> = ({
  type,
  position = 'top-right',
}) => {
  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return styles.posTopLeft;
      case 'bottom-right':
        return styles.posBottomRight;
      case 'bottom-left':
        return styles.posBottomLeft;
      case 'top-right':
      default:
        return styles.posTopRight;
    }
  };

  return (
    <View style={[styles.wrapper, getPositionStyle()]}>
      <TotoroSticker type={type} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#2C221D',
    shadowOffset: { width: 1, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 3,
  },
  posTopRight: {
    top: -16,
    right: 12,
  },
  posTopLeft: {
    top: -16,
    left: 12,
  },
  posBottomRight: {
    bottom: -14,
    right: 12,
  },
  posBottomLeft: {
    bottom: -14,
    left: 12,
  },
});
