import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFinancial } from '@/context/FinancialContext';

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 30;

interface PinKeypadProps {
  onSuccess: () => void;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({ onSuccess }) => {
  const { colors, unlockVault, accountPin, recoveryEmail, recoverPinViaEmail } = useFinancial();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  const isDefaultPin = accountPin === '1234';
  const lockoutKey = '@cashly_pin_lockout_vault';
  const attemptsKey = '@cashly_pin_attempts_vault';

  const isLocked = lockoutSeconds > 0;

  // On mount, check stored lockout timestamp & attempts
  useEffect(() => {
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
            const left = MAX_ATTEMPTS - count;
            setErrorMsg(`Incorrect PIN. ${left} ${left === 1 ? 'attempt' : 'attempts'} remaining.`);
          } else {
            await AsyncStorage.removeItem(attemptsKey);
            setFailedAttempts(0);
          }
        }
      } catch {}
    };
    checkLockout();
  }, [lockoutKey, attemptsKey]);

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
        // Validate
        setTimeout(async () => {
          const isValid = unlockVault(newPin);
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
                ? `Incorrect PIN (Try default: 1234). ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`
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
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Secure Vault Badge */}
      <View style={[styles.vaultIconWrapper, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
        <Ionicons name={isLocked ? 'lock-closed' : 'keypad-outline'} size={32} color={isLocked ? colors.danger : colors.primaryAccent} />
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
        <View style={{ paddingHorizontal: 12, marginBottom: 20 }}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
        </View>
      ) : (
        <Text style={[styles.hintText, { color: colors.textSubtle }]}>
          {isDefaultPin ? 'Default PIN: 1234' : 'Enter 4-digit PIN'}
        </Text>
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
                    activeOpacity={isLocked ? 1 : 0.7}
                    onPress={handleBackspace}
                    disabled={isLocked}
                    style={[
                      styles.keyButton,
                      {
                        backgroundColor: colors.bgCard,
                        ...colors.cardShadow,
                        opacity: isLocked ? 0.35 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="backspace-outline" size={26} color={colors.textMain} />
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
                      backgroundColor: colors.bgCard,
                      borderColor: 'transparent',
                      borderWidth: 0,
                      ...colors.cardShadow,
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
    borderWidth: 0,
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
    marginBottom: 20,
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
