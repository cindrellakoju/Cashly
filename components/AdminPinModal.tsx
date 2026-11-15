import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AestheticModal } from './AestheticModal';
import { useFinancial } from '@/context/FinancialContext';
import { TotoroSticker } from './TotoroStickers';

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 30;

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
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  const isAccount = pinType ? pinType === 'account' : onVerify === verifyAccountPin;
  const isDefaultPin = (isAccount ? accountPin : adminPin) === '1234';
  const targetName = isAccount ? 'account' : 'admin';
  const lockoutKey = `@cashly_pin_lockout_${targetName}`;
  const attemptsKey = `@cashly_pin_attempts_${targetName}`;

  const isLocked = lockoutSeconds > 0;

  // On open or visible change, check stored lockout timestamp & attempts
  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorMsg('');
      const checkLockout = async () => {
        try {
          const storedLockout = await AsyncStorage.getItem(lockoutKey);
          if (storedLockout) {
            const lockoutUntil = parseInt(storedLockout, 10);
            const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
            if (remaining > 0) {
              setLockoutSeconds(remaining);
              setFailedAttempts(MAX_ATTEMPTS);
              return;
            } else {
              await AsyncStorage.removeItem(lockoutKey);
              await AsyncStorage.removeItem(attemptsKey);
              setLockoutSeconds(0);
              setFailedAttempts(0);
              return;
            }
          }
          const storedAttempts = await AsyncStorage.getItem(attemptsKey);
          if (storedAttempts) {
            const count = parseInt(storedAttempts, 10) || 0;
            if (count > 0 && count < MAX_ATTEMPTS) {
              setFailedAttempts(count);
              const remaining = MAX_ATTEMPTS - count;
              setErrorMsg(`Incorrect PIN. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`);
            } else {
              // Stale count >= MAX_ATTEMPTS without active lockout -> reset to clean state
              await AsyncStorage.removeItem(attemptsKey);
              setFailedAttempts(0);
            }
          }
        } catch {}
      };
      checkLockout();
    }
  }, [visible, lockoutKey, attemptsKey]);

  // Countdown timer when locked out
  useEffect(() => {
    let interval: any = null;
    if (lockoutSeconds > 0) {
      interval = setInterval(() => {
        setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutSeconds > 0]);

  // Reset attempts and remove storage keys when lockout timer completes
  useEffect(() => {
    if (lockoutSeconds === 0 && failedAttempts >= MAX_ATTEMPTS) {
      setFailedAttempts(0);
      setErrorMsg('');
      AsyncStorage.removeItem(lockoutKey).catch(() => {});
      AsyncStorage.removeItem(attemptsKey).catch(() => {});
    }
  }, [lockoutSeconds, failedAttempts, lockoutKey, attemptsKey]);

  const displayHint = (() => {
    if (hintText !== undefined && hintText !== '') {
      if (hintText === 'Default PIN: 1234') {
        return isDefaultPin ? 'Default PIN: 1234' : 'Enter 4-Digit Security PIN';
      }
      return hintText;
    }
    return isDefaultPin ? 'Default PIN: 1234' : 'Enter 4-Digit Security PIN';
  })();

  const handleDigitPress = (digit: string) => {
    if (isLocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setErrorMsg('');
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(async () => {
          const isValid = onVerify ? onVerify(newPin) : verifyAdminPin(newPin);
          if (isValid) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPin('');
            setErrorMsg('');
            setFailedAttempts(0);
            setLockoutSeconds(0);
            try {
              await AsyncStorage.removeItem(lockoutKey);
              await AsyncStorage.removeItem(attemptsKey);
            } catch {}
            onSuccess();
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const nextAttempts = failedAttempts + 1;
            setFailedAttempts(nextAttempts);
            setPin('');
            if (nextAttempts >= MAX_ATTEMPTS) {
              const lockoutUntil = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
              setLockoutSeconds(LOCKOUT_DURATION_SECONDS);
              setErrorMsg('');
              try {
                await AsyncStorage.setItem(lockoutKey, String(lockoutUntil));
                await AsyncStorage.setItem(attemptsKey, String(MAX_ATTEMPTS));
              } catch {}
            } else {
              const left = MAX_ATTEMPTS - nextAttempts;
              const msg = isDefaultPin
                ? `Incorrect PIN (Try: 1234). ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`
                : `Incorrect PIN. ${left} ${left === 1 ? 'attempt' : 'attempts'} remaining.`;
              setErrorMsg(msg);
              try {
                await AsyncStorage.setItem(attemptsKey, String(nextAttempts));
              } catch {}
            }
          }
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    if (isLocked) return;
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
                // Clear lockout upon successful PIN recovery
                await AsyncStorage.removeItem(lockoutKey);
                await AsyncStorage.removeItem(attemptsKey);
                setLockoutSeconds(0);
                setFailedAttempts(0);
                setErrorMsg('');
                Alert.alert(
                  'New PIN Sent! ✉️',
                  `A new 4-digit PIN has been generated and sent to ${recoveryEmail}. Please check your inbox.`
                );
              } else if (res.newPin) {
                await AsyncStorage.removeItem(lockoutKey);
                await AsyncStorage.removeItem(attemptsKey);
                setLockoutSeconds(0);
                setFailedAttempts(0);
                setErrorMsg('');
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
        {/* Totoro Security Mascot */}
        <View style={{ alignItems: 'center', paddingTop: 8, marginBottom: 12 }}>
          <TotoroSticker type={isLocked ? 'curious' : isAccount ? 'vault' : 'peek'} size={68} />
        </View>

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
                    borderColor: isLocked
                      ? (colors.danger || '#ef4444')
                      : isFilled
                      ? colors.primaryAccent
                      : colors.textMuted,
                    backgroundColor: isLocked
                      ? (colors.dangerLight || '#FFEBEB')
                      : isFilled
                      ? colors.primaryAccent
                      : colors.bgSecondary,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Lockout countdown timer or error message or hint */}
        {isLocked ? (
          <View
            style={[
              styles.timerContainer,
              {
                backgroundColor: colors.dangerLight || '#FFEBEB',
                borderColor: colors.danger || '#ef4444',
              },
            ]}
          >
            <Ionicons name="timer-outline" size={18} color={colors.danger || '#ef4444'} />
            <Text style={[styles.timerText, { color: colors.danger || '#ef4444' }]}>
              Too many attempts. Try again in {String(Math.floor(lockoutSeconds / 60)).padStart(2, '0')}:{String(lockoutSeconds % 60).padStart(2, '0')}
            </Text>
          </View>
        ) : errorMsg ? (
          <View style={{ paddingHorizontal: 10, marginBottom: 16 }}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
          </View>
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
                      activeOpacity={isLocked ? 1 : 0.7}
                      onPress={handleBackspace}
                      disabled={isLocked}
                      style={[
                        styles.keyButton,
                        {
                          backgroundColor: colors.bgSecondary,
                          borderColor: 'transparent',
                          borderWidth: 0,
                          opacity: isLocked ? 0.35 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="backspace-outline" size={22} color={colors.textMain} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={cIdx}
                    activeOpacity={isLocked ? 1 : 0.7}
                    onPress={() => handleDigitPress(item)}
                    disabled={isLocked}
                    style={[
                      styles.keyButton,
                      {
                        backgroundColor: colors.bgSecondary,
                        borderColor: 'transparent',
                        borderWidth: 0,
                        opacity: isLocked ? 0.35 : 1,
                      },
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
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
