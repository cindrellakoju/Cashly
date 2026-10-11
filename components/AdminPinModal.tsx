import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AestheticModal } from './AestheticModal';
import { useFinancial } from '@/context/FinancialContext';

interface AdminPinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  icon?: string;
  hintText?: string;
  onVerify?: (pin: string) => boolean;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  visible,
  onClose,
  onSuccess,
  title = 'Admin Access Required',
  subtitle = 'Enter 4-Digit Security PIN to Unlock Admin Rights',
  icon = '🔒',
  hintText = 'Default PIN: 1234',
  onVerify,
}) => {
  const { colors, verifyAdminPin } = useFinancial();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleDigitPress = (digit: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setErrorMsg('');
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          const isValid = onVerify ? onVerify(newPin) : verifyAdminPin(newPin);
          if (isValid) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPin('');
            setErrorMsg('');
            onSuccess();
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMsg('Incorrect PIN. Please try again.');
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

  const handleClose = () => {
    setPin('');
    setErrorMsg('');
    onClose();
  };

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  return (
    <AestheticModal
      visible={visible}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
    >
      <View style={styles.container}>
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
          <Text style={[styles.hintText, { color: colors.textSubtle }]}>{hintText}</Text>
        )}

        {/* Keypad Grid */}
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
                      style={[
                        styles.keyButton,
                        { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1 },
                      ]}
                    >
                      <Ionicons name="backspace-outline" size={22} color={colors.textMain} />
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
                      { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1 },
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
    </AestheticModal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
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
    marginBottom: 16,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  keypadGrid: {
    width: '100%',
    maxWidth: 260,
    gap: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  keyButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyKey: {
    flex: 1,
  },
  keyText: {
    fontSize: 20,
    fontWeight: '700',
  },
});
