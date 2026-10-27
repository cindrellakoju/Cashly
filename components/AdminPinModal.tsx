import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
  pinType?: 'admin' | 'account';
  onVerify?: (pin: string) => boolean;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  visible,
  onClose,
  onSuccess,
  title = 'Admin Access Required',
  subtitle = 'Enter 4-Digit Security PIN to Unlock Admin Rights',
  icon = '🔒',
  hintText,
  pinType,
  onVerify,
}) => {
  const {
    colors,
    verifyAdminPin,
    verifyAccountPin,
    adminPin,
    accountPin,
    recoveryEmail,
    recoverPinViaEmail,
  } = useFinancial();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  const isAccount = pinType ? pinType === 'account' : onVerify === verifyAccountPin;
  const isDefaultPin = (isAccount ? accountPin : adminPin) === '1234';

  const displayHint = (() => {
    if (hintText !== undefined) {
      if (hintText === 'Default PIN: 1234') {
        return isDefaultPin ? 'Default PIN: 1234' : '';
      }
      return hintText;
    }
    return isDefaultPin ? 'Default PIN: 1234' : '';
  })();

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
              const target = isAccount ? 'account' : 'admin';
              const res = await recoverPinViaEmail(target);
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
        ) : displayHint ? (
          <Text style={[styles.hintText, { color: colors.textSubtle }]}>{displayHint}</Text>
        ) : (
          <View style={styles.hintPlaceholder} />
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

        {recoveryEmail && recoveryEmail.trim().length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleForgotPin}
            style={styles.forgotBtn}
            disabled={isRecovering}
          >
            <Ionicons name="help-circle-outline" size={15} color={colors.textMuted} />
            <Text style={[styles.forgotBtnText, { color: colors.textMuted }]}>
              {isRecovering ? 'Resetting PIN...' : 'Forgot PIN?'}
            </Text>
          </TouchableOpacity>
        )}
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
  hintPlaceholder: {
    height: 16,
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
  forgotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  forgotBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
