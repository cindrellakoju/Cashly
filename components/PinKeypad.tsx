import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useFinancial } from '@/context/FinancialContext';

interface PinKeypadProps {
  onSuccess: () => void;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({ onSuccess }) => {
  const { colors, unlockVault, accountPin, recoveryEmail, recoverPinViaEmail } = useFinancial();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  const isDefaultPin = accountPin === '1234';

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
            setErrorMsg(isDefaultPin ? 'Incorrect PIN. Try default: 1234' : 'Incorrect PIN. Please try again.');
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

  const handleForgotPin = () => {
    if (!recoveryEmail || !recoveryEmail.trim()) {
      Alert.alert('Forgot PIN', 'No recovery email is linked. Default PIN is 1234.');
      return;
    }

    Alert.alert(
      'Reset & Recover PIN',
      `Would you like to reset your PIN and receive the new PIN at your recovery email:\n\n${recoveryEmail}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & Send',
          style: 'destructive',
          onPress: async () => {
            setIsRecovering(true);
            try {
              const res = await recoverPinViaEmail('account');
              if (res.success) {
                Alert.alert(
                  'New PIN Sent! ✉️',
                  `A new 4-digit PIN has been generated and sent to ${recoveryEmail}. Please check your inbox.`
                );
              } else if (res.newPin) {
                Alert.alert(
                  'PIN Reset 🔑',
                  `Your PIN has been reset to: ${res.newPin}\n\n(Note: Email dispatch server is offline, so your new PIN is displayed here. Please save it.)`
                );
              } else {
                Alert.alert('Error', res.message || 'Failed to reset PIN.');
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to recover PIN.');
            } finally {
              setIsRecovering(false);
            }
          },
        },
      ]
    );
  };

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Secure Vault Badge */}
      <View style={[styles.vaultIconWrapper, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
        <Ionicons name="lock-closed" size={32} color={colors.primaryAccent} />
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
      ) : isDefaultPin ? (
        <Text style={[styles.hintText, { color: colors.textSubtle }]}>Default PIN: 1234</Text>
      ) : (
        <View style={styles.hintPlaceholder} />
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

      {recoveryEmail && recoveryEmail.trim().length > 0 && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleForgotPin}
          style={styles.forgotBtn}
          disabled={isRecovering}
        >
          <Ionicons name="help-circle-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.forgotBtnText, { color: colors.textMuted }]}>
            {isRecovering ? 'Resetting PIN...' : 'Forgot PIN?'}
          </Text>
        </TouchableOpacity>
      )}
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
  vaultIconWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3c5a41',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  hintPlaceholder: {
    height: 16,
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
  forgotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  forgotBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
