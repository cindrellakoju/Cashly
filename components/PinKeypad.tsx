import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useFinancial } from '@/context/FinancialContext';

interface PinKeypadProps {
  onSuccess: () => void;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({ onSuccess }) => {
  const { colors, stickers, unlockVault } = useFinancial();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleDigitPress = (digit: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setErrorMsg('');
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        // Validate
        setTimeout(() => {
          const isValid = unlockVault(newPin);
          if (isValid) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMsg('Incorrect PIN. Try default: 1234');
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMsg('');
    setPin((prev) => prev.slice(0, -1));
  };

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Mascot Sticker */}
      <View style={[styles.stickerWrapper, { borderColor: colors.borderAccent || colors.primaryAccent }]}>
        <Image source={stickers.vault} style={styles.stickerImage} resizeMode="cover" />
      </View>

      <Text style={[styles.title, { color: colors.textMain }]}>Secure Account Vault 🔒</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Biometric encryption active. Enter your 4-digit PIN to access banking details.
      </Text>

      {/* 4 PIN Dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((index) => {
          const isFilled = pin.length > index;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  borderColor: colors.borderAccent || colors.primaryAccent,
                  backgroundColor: isFilled ? colors.primaryAccent : 'transparent',
                },
              ]}
            />
          );
        })}
      </View>

      {errorMsg ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
      ) : (
        <Text style={[styles.hintText, { color: colors.textSubtle }]}>Default PIN: 1234</Text>
      )}

      {/* Numeric Keypad Grid */}
      <View style={styles.keypadGrid}>
        {digits.map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((item, cIdx) => {
              if (item === '') {
                return <View key={cIdx} style={styles.emptyKey} />;
              }
              if (item === 'delete') {
                return (
                  <TouchableOpacity
                    key={cIdx}
                    activeOpacity={0.7}
                    onPress={handleBackspace}
                    style={[styles.keyButton, { backgroundColor: colors.bgCard, ...colors.cardShadow }]}
                  >
                    <Ionicons name="backspace-outline" size={26} color={colors.textMain} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={cIdx}
                  activeOpacity={0.7}
                  onPress={() => handleDigitPress(item)}
                  style={[
                    styles.keyButton,
                    { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow },
                  ]}
                >
                  <Text style={[styles.keyText, { color: colors.textMain }]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stickerWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 24,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 24,
  },
  keypadGrid: {
    width: '100%',
    maxWidth: 280,
    gap: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  keyButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyKey: {
    flex: 1,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
  },
});
